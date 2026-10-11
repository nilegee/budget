import type { AccentKey } from "./types";

export interface Accent { key: AccentKey; label: string; from: string; to: string }

/** Every pair keeps dark ink text readable on top of it. */
export const ACCENTS: Accent[] = [
  { key: "ocean", label: "Ocean", from: "#4d8dff", to: "#19c8b2" },
  { key: "orchid", label: "Orchid", from: "#b455f2", to: "#ff5c7a" },
  { key: "sunset", label: "Sunset", from: "#ffa22e", to: "#ff5c7a" },
  { key: "mint", label: "Mint", from: "#19c8b2", to: "#a3e635" },
  { key: "gold", label: "Gold", from: "#ffd23f", to: "#ff9f1c" }
];

export const accentOf = (key: AccentKey): Accent => ACCENTS.find((a) => a.key === key) ?? ACCENTS[0];

export function applyAccent(key: AccentKey) {
  const a = accentOf(key);
  const root = document.documentElement;
  root.style.setProperty("--accent-from", a.from);
  root.style.setProperty("--accent-to", a.to);
}

/** Everyone gets their own starting colour; the phone can change it in More. */
export const accentFor = (personId: string, deviceMe: string, deviceAccent: AccentKey): AccentKey =>
  personId === deviceMe ? deviceAccent : personId === "p_mariem" ? "orchid" : "ocean";
