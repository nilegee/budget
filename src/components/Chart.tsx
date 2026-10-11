import { useState, useRef } from "preact/hooks";
import { parseDay } from "../lib/dates";
import { money } from "../lib/fmt";

export interface Point { date: string; value: number }

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
function smooth(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const W = 340;
const H = 160;
const PAD = { l: 12, r: 12, t: 20, b: 26 };

export function LineChart({ points, target, label }: { points: Point[]; target?: number; label: string }) {
  if (points.length < 2) return null;

  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const t0 = parseDay(points[0].date).getTime();
  const t1 = parseDay(points[points.length - 1].date).getTime();
  const span = Math.max(1, t1 - t0);
  const values = points.map((p) => p.value);
  const hi = Math.max(...values, target && target < Math.max(...values) * 1.6 ? target : 0);
  const lo = Math.min(...values);
  const pad = (hi - lo || hi || 1) * 0.15;
  const min = lo - pad;
  const max = hi + pad;

  const x = (d: string) => PAD.l + ((parseDay(d).getTime() - t0) / span) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b);
  const xy = points.map((p) => [x(p.date), y(p.value)] as [number, number]);
  const line = smooth(xy);

  const currentIdx = activeIdx !== null ? activeIdx : points.length - 1;
  const activePt = points[currentIdx];
  const activeCoords = xy[currentIdx];

  const handlePointer = (e: PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * W;

    let closest = 0;
    let minDist = Infinity;
    xy.forEach(([ptX], idx) => {
      const dist = Math.abs(ptX - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = idx;
      }
    });
    setActiveIdx(closest);
  };

  const handleLeave = () => {
    setActiveIdx(null);
  };

  const fmt = (d: string) => parseDay(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div class="chart-container">
      {activePt && (
        <div class="chart-tooltip" style={{ left: `${(activeCoords[0] / W) * 100}%` }}>
          <span class="tooltip-date">{fmt(activePt.date)}</span>
          <b class="tooltip-val">{money(activePt.value)}</b>
        </div>
      )}

      <svg
        ref={svgRef}
        class="chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={handleLeave}
      >
        <defs>
          <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="var(--accent-from)" />
            <stop offset="100%" stop-color="var(--accent-to)" />
          </linearGradient>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent-from)" stop-opacity="0.38" />
            <stop offset="70%" stop-color="var(--accent-to)" stop-opacity="0.08" />
            <stop offset="100%" stop-color="var(--accent-to)" stop-opacity="0" />
          </linearGradient>
          <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="var(--accent-from)" flood-opacity="0.4" />
          </filter>
        </defs>

        {/* Target threshold guideline */}
        {target !== undefined && target >= min && target <= max && (
          <g class="target-group">
            <line class="target" x1={PAD.l} x2={W - PAD.r} y1={y(target)} y2={y(target)} />
            <text x={W - PAD.r} y={y(target) - 5} text-anchor="end">Target</text>
          </g>
        )}

        {/* Ambient Area gradient under curve */}
        <path class="area" d={`${line}L${xy[xy.length - 1][0]},${H - PAD.b}L${xy[0][0]},${H - PAD.b}Z`} />

        {/* Glowing bezier stroke */}
        <path class="stroke" d={line} pathLength={1} filter="url(#chartGlow)" />

        {/* Vertical cursor guide when scrubbing */}
        {activeIdx !== null && (
          <line
            class="scrub-line"
            x1={activeCoords[0]}
            x2={activeCoords[0]}
            y1={PAD.t}
            y2={H - PAD.b}
          />
        )}

        {/* Active glowing point */}
        <circle class="dot-halo" cx={activeCoords[0]} cy={activeCoords[1]} r="11" />
        <circle class="dot" cx={activeCoords[0]} cy={activeCoords[1]} r="5.5" />

        {/* Date labels */}
        <text class="axis-label" x={PAD.l} y={H - 6}>{fmt(points[0].date)}</text>
        <text class="axis-label" x={W - PAD.r} y={H - 6} text-anchor="end">{fmt(points[points.length - 1].date)}</text>
      </svg>
    </div>
  );
}
