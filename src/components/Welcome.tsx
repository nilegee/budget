import { useState } from "preact/hooks";
import { data, device, setDevice, updateSettings } from "../lib/store";
import { DEFAULT_STAMP } from "../lib/defaults";
import { ACCENTS, accentOf, applyAccent } from "../lib/theme";
import type { AccentKey } from "../lib/types";
import { Avatar } from "./Icon";
import { Pot } from "./Pot";
import { go } from "../router";

const DEFAULT_ACCENT: Record<string, AccentKey> = { p_me: "ocean", p_mariem: "orchid" };

/** First launch on a phone: who is this, pick a colour, name the pot. Remembered per phone. */
export function Welcome() {
  const d = data.value;
  const people = d.settings.people;
  const firstSetup = d.settings.updatedAt === DEFAULT_STAMP; // nobody has configured the household yet
  const [me, setMe] = useState(device.value.me);
  const [accent, setAccent] = useState<AccentKey>(DEFAULT_ACCENT[device.value.me] ?? device.value.accent);
  const [pot, setPot] = useState(d.settings.potName);

  const pickPerson = (id: string) => {
    setMe(id);
    const a = DEFAULT_ACCENT[id] ?? "ocean";
    setAccent(a);
    applyAccent(a);
  };
  const pickAccent = (a: AccentKey) => {
    setAccent(a);
    applyAccent(a);
  };
  const finish = (next?: "more") => {
    setDevice({ me, accent, onboarded: true });
    if (firstSetup && pot.trim() && pot.trim() !== d.settings.potName) updateSettings({ potName: pot.trim() });
    if (next) go(next);
  };
  const who = people.find((p) => p.id === me) ?? people[0];

  return (
    <div class="welcome" role="dialog" aria-modal="true" aria-label="Welcome">
      <div class="welcome-in">
        <div class="pot-box"><Pot fill={42} mood="glowing" /></div>
        <div style={{ textAlign: "center" }}>
          <h1>Hi, who's this?</h1>
          <p>Pick yourself once. This phone remembers.</p>
        </div>

        <div class="who" role="radiogroup" aria-label="Who is this">
          {people.map((p) => {
            const a = accentOf(DEFAULT_ACCENT[p.id] ?? "ocean");
            return (
              <button type="button" role="radio" aria-checked={me === p.id} data-on={me === p.id} onClick={() => pickPerson(p.id)}>
                <Avatar name={p.name} from={a.from} to={a.to} size={64} />
                {p.name}
              </button>
            );
          })}
        </div>

        <div>
          <label>Your colour</label>
          <div class="swatches">
            {ACCENTS.map((a) => (
              <button type="button" class="swatch" aria-label={a.label} aria-pressed={accent === a.key} style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }} onClick={() => pickAccent(a.key)} />
            ))}
          </div>
          <small>Only changes how this phone looks.</small>
        </div>

        {firstSetup && (
          <div>
            <label for="pn">Name the pot</label>
            <input id="pn" class="input" value={pot} maxLength={14} onInput={(e) => setPot((e.target as HTMLInputElement).value)} />
            <small>It speaks in the messages. You can rename it any time in Settings.</small>
          </div>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          <button type="button" class="btn btn-primary btn-block" onClick={() => finish()}>Let's go, {who.name}</button>
          <button type="button" class="btn btn-ghost btn-block" style={{ minHeight: 48 }} onClick={() => finish("more")}>Already set up on another phone? Connect sharing</button>
        </div>
      </div>
    </div>
  );
}
