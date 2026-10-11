import { useEffect, useLayoutEffect, useRef } from "preact/hooks";
import { route, go, type Route } from "./router";
import { Home } from "./pages/Home";
import { History } from "./pages/History";
import { Savings } from "./pages/Savings";
import { Wins } from "./pages/Wins";
import { More } from "./pages/More";
import { QuickAddHost, openAdd } from "./components/QuickAdd";
import { SavingsSheetHost } from "./components/SavingsSheet";
import { Welcome } from "./components/Welcome";
import { Toast } from "./components/ui";
import { Icon } from "./components/Icon";
import { device, refreshToday } from "./lib/store";
import { applyAccent } from "./lib/theme";
import { syncStatus } from "./lib/sync";
import { sfxClick, sfxTab } from "./lib/sound";

const PAGES: Record<Route, () => preact.JSX.Element> = { home: Home, history: History, savings: Savings, wins: Wins, more: More };
const TABS: { id: Route; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "history", label: "History", icon: "list" },
  { id: "savings", label: "Savings", icon: "vault" },
  { id: "wins", label: "Wins", icon: "trophy" }
];

export function App() {
  const navRef = useRef<HTMLElement>(null);
  const accent = device.value.accent;
  useEffect(() => applyAccent(accent), [accent]);
  useEffect(() => {
    const onShow = () => document.visibilityState === "visible" && refreshToday();
    document.addEventListener("visibilitychange", onShow);
    const id = window.setInterval(refreshToday, 60_000);
    return () => { document.removeEventListener("visibilitychange", onShow); window.clearInterval(id); };
  }, []);

  const r = route.value;
  useLayoutEffect(() => {
    const nav = navRef.current;
    const el = nav?.querySelector<HTMLElement>('.nav-tab[aria-current="page"]');
    if (!nav || !el) return;
    nav.style.setProperty("--gx", `${el.offsetLeft + 4}px`);
    nav.style.setProperty("--gw", `${el.offsetWidth - 8}px`);
    nav.style.setProperty("--gy", `${el.offsetTop + 4}px`);
    nav.style.setProperty("--gh", `${el.offsetHeight - 8}px`);
  }, [r]);

  if (!device.value.onboarded) return <Welcome />;
  const Page = PAGES[r];

  const tab = (t: (typeof TABS)[number]) => {
    const active = r === t.id;
    return (
      <button
        type="button"
        class="nav-tab"
        aria-current={active ? "page" : undefined}
        onClick={() => {
          sfxTab();
          navigator.vibrate?.(6);
          go(t.id);
        }}
        key={t.id}
      >
        <div class="nav-icon-box">
          <Icon name={t.icon} size={22} />
        </div>
        <span class="nav-label">{t.label}</span>
        {active && <span class="nav-active-pip" aria-hidden="true" />}
      </button>
    );
  };

  return (
    <>
      <main class="app" id="main">
        <button type="button" class="gear" aria-label="Settings" onClick={() => go("more")}>
          <Icon name="gear" size={22} />
          <span class="sync-dot" data-s={syncStatus.value} aria-hidden="true" />
        </button>
        <Page key={r} />
      </main>

      {/* Bleeding Edge Dynamic Glass Dock */}
      <nav class="nav" aria-label="Main navigation" ref={navRef}>
        <div class="nav-glass-shine" aria-hidden="true" />
        <span class="nav-glide" data-hidden={r === "more"} aria-hidden="true" />
        
        {tab(TABS[0])}
        {tab(TABS[1])}

        {/* Hero QuickAdd Action Button */}
        <div class="fab-wrapper">
          <button
            type="button"
            class="fab"
            onClick={() => {
              sfxClick();
              navigator.vibrate?.(12);
              openAdd();
            }}
            aria-label="Add expense"
          >
            <div class="fab-halo" aria-hidden="true" />
            <Icon name="plus" size={26} />
          </button>
        </div>

        {tab(TABS[2])}
        {tab(TABS[3])}
      </nav>

      <QuickAddHost />
      <SavingsSheetHost />
      <Toast />
    </>
  );
}
