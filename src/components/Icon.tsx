import type { JSX } from "preact";

/**
 * House icon set: two-tone. A soft filled shape (the "body") sits under a clean rounded stroke
 * (the "line"), both in currentColor, so every icon takes the colour of its context and looks
 * identical on every phone. 24x24 grid, 1.8 stroke.
 */
type Draw = { body?: string; line: string };

const ICONS: Record<string, Draw> = {
  /* categories */
  bike: { body: "M2.5 15.5a3.8 3.8 0 1 0 7.6 0 3.8 3.8 0 0 0-7.6 0zM13.9 15.5a3.8 3.8 0 1 0 7.6 0 3.8 3.8 0 0 0-7.6 0z", line: "M2.5 15.5a3.8 3.8 0 1 0 7.6 0 3.8 3.8 0 0 0-7.6 0zM13.9 15.5a3.8 3.8 0 1 0 7.6 0 3.8 3.8 0 0 0-7.6 0zM6.3 15.5 9.5 8h4.5l3.7 7.5M9.5 8H7.8M14 8l-1.2-2.5H10.8M6.3 15.5h7.5L10.5 9" },
  dining: { body: "M17.5 3c-2.5 1.5-3.8 4.5-3.8 8h3.8z", line: "M5.5 3v6a2.5 2.5 0 0 0 5 0V3M8 3v18M17.5 21V3c-2.5 1.5-3.8 4.5-3.8 8h3.8" },
  cart: { body: "M6 8h14l-1.6 8H8z", line: "M3 4h2.2l2.3 11h10.2M9 20.2a.8.8 0 1 0 0 .01M17 20.2a.8.8 0 1 0 0 .01" },
  car: { body: "M3 16.5v-4c0-.8.5-1.4 1.2-1.6L7 10l2-3.5h6.5l2.6 3.5 1.8.9c.6.3 1.1 1 1.1 1.7v4z", line: "M3 16.5v-4c0-.8.5-1.4 1.2-1.6L7 10l2-3.5h6.5l2.6 3.5 1.8.9c.6.3 1.1 1 1.1 1.7v4zM3 16.5h18M9.5 10h8M5.6 17.3a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM14.4 17.3a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" },
  fuel: { body: "M5 4h9v16H5z", line: "M5 20V4h9v16M3.5 20h12M14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V8l-2.5-2.5M7.5 8h4" },
  bulb: { body: "M12 3.5a6 6 0 0 0-3.5 10.9V16h7v-1.6A6 6 0 0 0 12 3.5z", line: "M8.5 14.4A6 6 0 1 1 15.5 14.4V16h-7zM9.5 19h5M10.5 21.5h3" },
  home: { body: "M5 11 12 4.5 19 11v8.5H5z", line: "M3 11.5 12 3.5l9 8M5.5 10v10h13V10M10 20v-5h4v5" },
  book: { body: "M4 5c3 0 5 .5 8 2v13c-3-1.5-5-2-8-2zM20 5c-3 0-5 .5-8 2v13c3-1.5 5-2 8-2z", line: "M12 7v13M4 5c3 0 5 .5 8 2 3-1.5 5-2 8-2v13c-3 0-5 .5-8 2-3-1.5-5-2-8-2z" },
  pulse: { body: "M12 20s-8-4.7-8-10.2A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.8C20 15.3 12 20 12 20z", line: "M12 20s-8-4.7-8-10.2A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.8C20 15.3 12 20 12 20zM6.5 12h3l1.5-3 2 5 1.3-2h3.2" },
  film: { body: "M3.5 6h17v12h-17z", line: "M3.5 6h17v12h-17zM7.5 6v12M16.5 6v12M3.5 10h4M3.5 14h4M16.5 10h4M16.5 14h4" },
  bag: { body: "M4.5 8h15L21 20H3z", line: "M4.5 8h15L21 20H3zM8.5 10.5V7a3.5 3.5 0 0 1 7 0v3.5" },
  repeat: { body: "M3 8h14v8H3z", line: "M17 4l3 3-3 3M20 7H8a4 4 0 0 0-4 4M7 20l-3-3 3-3M4 17h12a4 4 0 0 0 4-4" },
  plane: { body: "M3 13.5 9 12l5-8.5h2L13.5 12l5.5-1a2 2 0 0 1 0 4l-5.5-1L16 22h-2L9 14l-6-.5z", line: "M10.5 13 8 17l-1.5-.3.8-3.2L3 12.5l.4-1.5 6.4.9L13 5h2l-2 6.3 6 .7a1.4 1.4 0 0 1 0 2.8l-6 .5 1.6 5.2h-2z" },
  gift: { body: "M4 11h16v9H4z", line: "M4 11h16v9H4zM3 7.5h18V11H3zM12 7.5V20M12 7.5C10 7.5 8 7 8 5.5a2 2 0 0 1 4 0M12 7.5c2 0 4-.5 4-2a2 2 0 0 0-4 0" },
  grid: { body: "M4 4h6.5v6.5H4zM13.5 13.5H20V20h-6.5z", line: "M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z" },
  coffee: { body: "M4 9h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z", line: "M4 9h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M7.5 3.5v2.5M11 3.5v2.5" },
  paw: { body: "M12 12.5c-3 0-5 2.5-5 4.5a2.5 2.5 0 0 0 3 2.2c1.2-.3 1.5-.5 2-.5s.8.2 2 .5a2.5 2.5 0 0 0 3-2.2c0-2-2-4.5-5-4.5z", line: "M12 12.5c-3 0-5 2.5-5 4.5a2.5 2.5 0 0 0 3 2.2c1.2-.3 1.5-.5 2-.5s.8.2 2 .5a2.5 2.5 0 0 0 3-2.2c0-2-2-4.5-5-4.5zM5.5 10a1.4 1.9 0 1 0 0 .01M9 6.5a1.4 1.9 0 1 0 0 .01M15 6.5a1.4 1.9 0 1 0 0 .01M18.5 10a1.4 1.9 0 1 0 0 .01" },
  phone: { body: "M7 3h10v18H7z", line: "M7.5 3h9A1.5 1.5 0 0 1 18 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5v-15A1.5 1.5 0 0 1 7.5 3zM10.5 18h3" },
  dumbbell: { body: "M6 8h2.5v8H6zM15.5 8H18v8h-2.5z", line: "M6 8h2.5v8H6zM15.5 8H18v8h-2.5zM8.5 12h7M3.5 10v4M20.5 10v4" },
  scissors: { body: "M6 15.5a3 3 0 1 0 .01 0zM6 8.5a3 3 0 1 0 .01 0z", line: "M8.2 7 20 16.5M8.2 17 20 7.5M6 8.5a2.8 2.8 0 1 0 .01 0M6 15.5a2.8 2.8 0 1 0 .01 0" },

  /* achievements and states */
  flame: { body: "M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.3 1 2 2 2-1-3-.5-5.5 1-8z", line: "M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.3 1 2 2 2-1-3-.5-5.5 1-8zM12 19a2 2 0 0 1-2-2c0-1.5 2-2.5 2-4.5 1 1 2 2 2 4.5a2 2 0 0 1-2 2z" },
  snowflake: { line: "M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 6.5l2.5-2M9.5 19.5 12 17.5l2.5 2" },
  check: { body: "M12 3a9 9 0 1 0 .01 0z", line: "M12 3a9 9 0 1 0 .01 0M7.8 12.3l3 3 5.4-6" },
  sprout: { body: "M12 20v-7c0-3-2-5-6-5 0 4 2 6 6 6zM12 15c0-3 2-5.5 6-5.5 0 3.5-2 5.5-6 5.5z", line: "M12 21v-8M12 13c-4 0-6-2-6-6 4 0 6 2 6 6zM12 15.5c0-3 2-5.5 6-5.5 0 3.5-2 5.5-6 5.5z" },
  bolt: { body: "M13 3 5 13.5h6L10 21l9-11.5h-6z", line: "M13 3 5 13.5h6L10 21l9-11.5h-6z" },
  trophy: { body: "M7.5 4h9v5.5a4.5 4.5 0 0 1-9 0z", line: "M7.5 4h9v5.5a4.5 4.5 0 0 1-9 0zM7.5 6H4v1.5A3.5 3.5 0 0 0 7.8 11M16.5 6H20v1.5A3.5 3.5 0 0 1 16.2 11M12 14v4M8 20.5h8M9.5 18h5" },
  leaf: { body: "M5 19C4 11 9 5 20 4c0 11-6 16-15 15z", line: "M5 19C4 11 9 5 20 4c0 11-6 16-15 15zM5 19c3-5 6-8 10-10" },
  target: { body: "M12 6a6 6 0 1 0 .01 0z", line: "M12 3a9 9 0 1 0 .01 0M12 7.5a4.5 4.5 0 1 0 .01 0M12 11.5a.5.5 0 1 0 .01 0M12 12 19 5M16 5h3v3" },
  trend: { body: "M3 18 9 11l4 3 8-9v13z", line: "M3 6l6 7 4-3 8 8M21 13v5h-5" },
  gem: { body: "M6.5 4h11L21 9l-9 11L3 9z", line: "M6.5 4h11L21 9l-9 11L3 9zM3 9h18M9.5 4 8 9l4 11M14.5 4 16 9l-4 11" },
  party: { body: "M4 20 8.5 8l7.5 7.5z", line: "M4 20 8.5 8l7.5 7.5zM13 4v2M18 8l1.5-1.5M20 13h2M16.5 3.5 15.5 5M8.5 8l7.5 7.5" },
  compass: { body: "M12 3a9 9 0 1 0 .01 0z", line: "M12 3a9 9 0 1 0 .01 0M15.8 8.2l-2 5.6-5.6 2 2-5.6z" },
  sun: { body: "M12 7.5a4.5 4.5 0 1 0 .01 0z", line: "M12 7.5a4.5 4.5 0 1 0 .01 0M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" },
  moon: { body: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z", line: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" },
  search: { body: "M10.5 4a6.5 6.5 0 1 0 .01 0z", line: "M10.5 4a6.5 6.5 0 1 0 .01 0M15.5 15.5 20 20" },
  coin: { body: "M12 3a9 9 0 1 0 .01 0z", line: "M12 3a9 9 0 1 0 .01 0M12 7v10M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2-.4-2.5-1.2" },
  alert: { body: "M12 3.5 21.5 20h-19z", line: "M12 3.5 21.5 20h-19zM12 10v4.5M12 17.2v.01" },
  calendar: { body: "M4 6h16v14H4z", line: "M4 6h16v14H4zM4 10.5h16M8 3.5v4M16 3.5v4" },
  note: { body: "M5 4h14v16H5z", line: "M5 4h14v16H5zM8.5 9h7M8.5 13h7M8.5 17h4" },
  gear: { body: "M12 8.5a3.5 3.5 0 1 0 .01 0z", line: "M12 8.5a3.5 3.5 0 1 0 .01 0M10.3 3h3.4l.6 2.4 1.7.9 2.3-.8 1.7 3-1.8 1.6v2l1.8 1.6-1.7 3-2.3-.8-1.7.9-.6 2.4h-3.4l-.6-2.4-1.7-.9-2.3.8-1.7-3L5.8 13v-2L4 9.4l1.7-3 2.3.8 1.7-.9z" },
  vault: { body: "M4 5h16v14H4z", line: "M4 5h16v14H4zM9.5 12a2.5 2.5 0 1 0 .01 0M12 12h4M7 19v1.5M17 19v1.5" },
  plus: { line: "M12 5v14M5 12h14" },
  chevL: { line: "m15 5-7 7 7 7" },
  chevR: { line: "m9 5 7 7-7 7" },
  back: { line: "M21 6H9l-6 6 6 6h12V6ZM13 10l4 4m0-4-4 4" },
  home2: { body: "M5 11 12 4.5 19 11v8.5H5z", line: "m3 11 9-7.5 9 7.5M5.5 9.5V20h13V9.5M10 20v-6h4v6" },
  list: { body: "M7 4h13v16H7z", line: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" },
  wins: { body: "M8 4h8v6a4 4 0 0 1-8 0z", line: "M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 20h8" }
};

export type IconName = keyof typeof ICONS | (string & {});
type Props = Omit<JSX.IntrinsicElements["svg"], "name"> & { name: IconName; size?: number };

export function Icon({ name, size = 24, ...rest }: Props) {
  const d = ICONS[name] ?? ICONS.grid;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" {...rest}>
      {d.body && <path d={d.body} fill="currentColor" opacity=".2" />}
      <path d={d.line} stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

export const iconNames = Object.keys(ICONS);

/** Initial-letter avatar in the person's own accent, so no emoji depends on the phone's font. */
export function Avatar({ name, from, to, size = 44 }: { name: string; from: string; to: string; size?: number }) {
  return (
    <span class="avatar-disc" style={{ width: size, height: size, background: `linear-gradient(135deg, ${from}, ${to})`, fontSize: size * 0.46 }} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
