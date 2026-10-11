import { render, options } from "preact";
import "./styles/app.css";
import { App } from "./app";
import { startSync } from "./lib/sync";
import { device } from "./lib/store";
import { applyAccent } from "./lib/theme";

// Preact 11 no longer appends "px" to numeric style values; restore that for length props.
const UNITLESS = /^(--|opacity|zIndex|flex|fontWeight|lineHeight|order|zoom|scale|aspectRatio)/;
const prevVnode = options.vnode;
options.vnode = (vnode) => {
  const st = (vnode.props as { style?: unknown } | null)?.style;
  if (st && typeof st === "object") {
    const o = st as Record<string, unknown>;
    for (const k in o) if (typeof o[k] === "number" && o[k] !== 0 && !UNITLESS.test(k)) o[k] = `${o[k]}px`;
  }
  prevVnode?.(vnode);
};

applyAccent(device.value.accent);
render(<App />, document.getElementById("app")!);
startSync();
