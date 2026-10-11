import { signal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import type { ComponentChildren } from "preact";
import type { Category } from "../lib/types";
import { Icon } from "./Icon";

/* ---------- toast ---------- */
export interface ToastState { msg: string; action?: { label: string; run: () => void } }
export const toast = signal<ToastState | null>(null);
let toastTimer: number | undefined;
export function showToast(msg: string, action?: ToastState["action"], ms = 4200) {
  toast.value = { msg, action };
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.value = null), ms);
}
export function Toast() {
  const t = toast.value;
  if (!t) return null;
  return (
    <div class="toast" role="status" aria-live="polite">
      <span>{t.msg}</span>
      {t.action && (
        <button type="button" onClick={() => { t.action!.run(); toast.value = null; }}>
          {t.action.label}
        </button>
      )}
    </div>
  );
}

/* ---------- count-up number with spring reel ---------- */
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export function Count({ value, format, ms = 850 }: { value: number; format: (n: number) => string; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const raf = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = shown.current;
    if (reduced() || from === value) {
      shown.current = value;
      el.textContent = format(value);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      // Fluid spring cubic-bezier reel easing
      const e = t === 1 ? 1 : 1 - Math.pow(2, -12 * t);
      shown.current = from + (value - from) * e;
      el.textContent = format(shown.current);
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        // Subtle micro-pulse when settled
        el.animate([
          { transform: "scale(1)" },
          { transform: "scale(1.05)", offset: 0.4 },
          { transform: "scale(1)" }
        ], { duration: 250, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <span ref={ref} class="num spring-digit-roll">{format(value)}</span>;
}

/* ---------- bottom sheet ---------- */
export function Sheet({ onClose, label, children }: { onClose: () => void; label: string; children: ComponentChildren }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = () => {
    const el = ref.current;
    if (!el || reduced()) return onClose();
    el.classList.add("closing");
    window.setTimeout(onClose, 200);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <>
      <div class="scrim" onClick={close} />
      <div class="sheet" role="dialog" aria-modal="true" aria-label={label} ref={ref}>
        <div class="grab" />
        {children}
      </div>
    </>
  );
}

/* ---------- small pieces ---------- */
export const CatBadge = ({ c }: { c: Pick<Category, "icon" | "color"> }) => (
  <i class="badge-icon" style={{ "--cat": c.color }} aria-hidden="true"><Icon name={c.icon} size={24} /></i>
);

export function Delta({ pct, invert = false }: { pct: number | null; invert?: boolean }) {
  if (pct === null || Math.abs(pct) < 1) return null;
  const down = pct < 0;
  const good = invert ? !down : down; // for spending, down is good
  return <span class={`delta ${good ? "good" : "bad"}`}>{down ? "▼" : "▲"} {Math.abs(Math.round(pct))}%</span>;
}

/* ---------- confetti ---------- */
const COLORS = ["#ffa22e", "#ff5c7a", "#b455f2", "#19c8b2", "#4d8dff", "#ffd23f"];
export function celebrate(count = 32) {
  if (reduced()) return;
  const ox = innerWidth / 2;
  const oy = innerHeight - 90;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("i");
    p.className = "confetti";
    p.style.background = COLORS[i % COLORS.length];
    p.style.left = `${ox}px`;
    p.style.top = `${oy}px`;
    document.body.appendChild(p);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2;
    const v = 170 + Math.random() * 280;
    const dx = Math.cos(a) * v;
    const dy = Math.sin(a) * v;
    p.animate(
      [
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx * 1.15}px,${dy + 280}px) rotate(${Math.random() * 900}deg)`, opacity: 0 }
      ],
      { duration: 1100 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.3,1)" }
    ).onfinish = () => p.remove();
  }
  navigator.vibrate?.(14);
}
