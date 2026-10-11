import { signal } from "@preact/signals";

export const ROUTES = ["home", "history", "savings", "wins", "more"] as const;
export type Route = (typeof ROUTES)[number];

const parse = (): Route => {
  const h = location.hash.replace(/^#\/?/, "") as Route;
  return (ROUTES as readonly string[]).includes(h) ? h : "home";
};

export const route = signal<Route>(parse());
export const historyView = signal<"transactions" | "categories">("transactions");

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function go(next: Route) {
  if (next === route.value) return;
  const dir = ROUTES.indexOf(next) < ROUTES.indexOf(route.value) ? "back" : "fwd";
  document.documentElement.dataset.dir = dir;
  const apply = () => {
    route.value = next;
    history.replaceState(null, "", `#/${next}`);
    window.scrollTo({ top: 0 });
  };
  const vt = (document as Document & { startViewTransition?: (cb: () => Promise<void> | void) => unknown }).startViewTransition;
  if (vt && !reduced()) {
    // Preact renders asynchronously, so hand the browser a promise that resolves once the new page is in the DOM.
    // Timers, not requestAnimationFrame: rendering is paused while the transition waits, so rAF would never fire.
    vt.call(document, () => new Promise<void>((resolve) => { apply(); setTimeout(resolve, 40); }));
  } else apply();
}

window.addEventListener("hashchange", () => (route.value = parse()));
