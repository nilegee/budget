import { signal } from "@preact/signals";
import { data, device, onMutate, replaceData, setDevice } from "./store";
import { applyRows, rowsSince, type Row } from "./merge";
import type { SyncConfig } from "./types";

export type SyncStatus = "off" | "idle" | "syncing" | "ok" | "error";
export const syncStatus = signal<SyncStatus>(device.value.sync ? "idle" : "off");
export const syncMessage = signal("");

function endpoint(cfg: SyncConfig, path: string) {
  return `${cfg.url.replace(/\/+$/, "")}/rest/v1/${path}`;
}

function headers(cfg: SyncConfig, extra: Record<string, string> = {}) {
  return {
    apikey: cfg.anonKey,
    Authorization: `Bearer ${cfg.anonKey}`,
    "x-household-key": cfg.householdKey,
    "Content-Type": "application/json",
    ...extra
  };
}

let running = false;
let queued = false;

export async function syncNow(): Promise<void> {
  const cfg = device.value.sync;
  if (!cfg) return;
  if (running) {
    queued = true;
    return;
  }
  running = true;
  syncStatus.value = "syncing";
  try {
    // 1. Pull anything the other phone changed since our last server stamp.
    const pull = await fetch(
      endpoint(cfg, `records?select=kind,id,data,updated_at,synced_at&synced_at=gt.${encodeURIComponent(device.value.syncSince)}&order=synced_at.asc&limit=2000`),
      { headers: headers(cfg) }
    );
    if (!pull.ok) throw new Error(`Pull failed (${pull.status})`);
    const rows = (await pull.json()) as Row[];
    if (rows.length) {
      replaceData(applyRows(data.value, rows));
      const newest = rows.reduce((m, r) => ((r.synced_at ?? "") > m ? (r.synced_at as string) : m), device.value.syncSince);
      setDevice({ syncSince: newest });
    }

    // 2. Push what only we have.
    const out = rowsSince(data.value, device.value.lastPushed);
    if (out.length) {
      const body = out.map((r) => ({ household_key: cfg.householdKey, kind: r.kind, id: r.id, data: r.data, updated_at: r.updated_at }));
      const push = await fetch(endpoint(cfg, "records?on_conflict=household_key,kind,id"), {
        method: "POST",
        headers: headers(cfg, { Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(body)
      });
      if (!push.ok) throw new Error(`Push failed (${push.status})`);
      setDevice({ lastPushed: out.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), device.value.lastPushed) });
    }
    syncStatus.value = "ok";
    syncMessage.value = `Synced ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  } catch (err) {
    syncStatus.value = "error";
    syncMessage.value = err instanceof Error ? err.message : "Sync failed";
  } finally {
    running = false;
    if (queued) {
      queued = false;
      void syncNow();
    }
  }
}

export function connectSync(cfg: SyncConfig) {
  setDevice({ sync: cfg, syncSince: "1970-01-01T00:00:00.000Z", lastPushed: "1970-01-01T00:00:00.000Z" });
  void syncNow();
}

export function disconnectSync() {
  setDevice({ sync: null });
  syncStatus.value = "off";
  syncMessage.value = "";
}

let timer: number | undefined;
export function startSync() {
  onMutate(() => {
    if (!device.value.sync) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void syncNow(), 1200);
  });
  const tick = () => document.visibilityState === "visible" && void syncNow();
  document.addEventListener("visibilitychange", tick);
  window.addEventListener("online", tick);
  window.setInterval(tick, 20_000);
  void syncNow();
}
