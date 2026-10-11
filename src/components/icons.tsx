import type { JSX } from "preact";

const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 1.9, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": true } as const;
type P = JSX.IntrinsicElements["svg"];

export const HomeIcon = (p: P) => <svg {...base} {...p}><path d="m3 11 9-7.5 9 7.5M5.5 9.5V20h13V9.5M10 20v-6h4v6" /></svg>;
export const ListIcon = (p: P) => <svg {...base} {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>;
export const TrophyIcon = (p: P) => <svg {...base} {...p}><path d="M8 4h8v6a4 4 0 0 1-8 0V4ZM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 20h8" /></svg>;
export const MoreIcon = (p: P) => <svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
export const PlusIcon = (p: P) => <svg {...base} stroke-width={2.6} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const ChevronLeft = (p: P) => <svg {...base} {...p}><path d="m15 5-7 7 7 7" /></svg>;
export const ChevronRight = (p: P) => <svg {...base} {...p}><path d="m9 5 7 7-7 7" /></svg>;
export const BackspaceIcon = (p: P) => <svg {...base} {...p}><path d="M21 6H9l-6 6 6 6h12V6ZM13 10l4 4m0-4-4 4" /></svg>;
