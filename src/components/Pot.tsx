import { useEffect, useRef, useState } from "preact/hooks";
import type { Mood } from "../lib/types";

/**
 * The elevated family pot.
 * Features:
 * - Fluid meniscus and ambient rising bubbles
 * - Specular 3D glass gloss highlights
 * - Expressive animated face states
 * - Mood aura particles and squash/stretch physics
 */
export function Pot({ fill, mood, pulse = 0 }: { fill: number; mood: Mood; pulse?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const [splash, setSplash] = useState(false);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setSplash(true);
    const timer = window.setTimeout(() => setSplash(false), 900);

    ref.current?.animate(
      [
        { transform: "scale(1) translateY(0)" },
        { transform: "scale(1.12, 0.86) translateY(4px)", offset: 0.2 },
        { transform: "scale(0.92, 1.12) translateY(-8px)", offset: 0.5 },
        { transform: "scale(1.04, 0.97) translateY(2px)", offset: 0.75 },
        { transform: "scale(1) translateY(0)" }
      ],
      { duration: 750, easing: "cubic-bezier(.34,1.56,.64,1)" }
    );

    return () => window.clearTimeout(timer);
  }, [pulse]);

  const level = Math.min(100, Math.max(fill > 0 ? 8 : 0, fill));
  const y = 188 - (level / 100) * 120; // jar interior spans y 68..188
  const eyes = <Eyes mood={mood} />;

  return (
    <div class="pot-wrap" data-mood={mood} ref={ref}>
      <svg class="pot" viewBox="0 0 160 190" role="img" aria-label={`Family pot, ${Math.round(fill)}% used, feeling ${mood}`}>
        <defs>
          {/* Fluid fill gradient */}
          <linearGradient id="potFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--c1)" />
            <stop offset="100%" stop-color="var(--c2)" />
          </linearGradient>

          {/* Glass rim specular gradient */}
          <linearGradient id="glassSpecular" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.8" />
            <stop offset="35%" stop-color="#ffffff" stop-opacity="0.1" />
            <stop offset="70%" stop-color="var(--c1)" stop-opacity="0.1" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.4" />
          </linearGradient>

          {/* Internal gloss reflection */}
          <linearGradient id="glossGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
          </linearGradient>

          <clipPath id="jar">
            <path d="M30 60h100l-8 112a18 18 0 0 1-18 16H56a18 18 0 0 1-18-16z" />
          </clipPath>
        </defs>

        {/* Ambient jar glow */}
        <ellipse cx="80" cy="180" rx="44" ry="7" fill="var(--c2)" opacity="0.35" filter="blur(4px)" />

        {/* Liquid body with wave animation & bubbles */}
        <g clip-path="url(#jar)">
          <g class="liquid-body" style={{ transform: `translateY(${y - 68}px)` }}>
            {/* Background deeper wave */}
            <path class="wave b" fill="var(--c1)" d="M-80 70q20-10 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0v130h-320z" />
            {/* Foreground crisp wave */}
            <path class="wave" fill="var(--c1)" d="M-80 74q20 10 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0v130h-320z" />
            <rect x="0" y="74" width="160" height="140" fill="url(#potFill)" />

            {/* Rising ambient bubbles */}
            <circle class="pot-bubble b1" cx="50" cy="120" r="3" fill="#ffffff" opacity="0.45" />
            <circle class="pot-bubble b2" cx="105" cy="140" r="2.5" fill="#ffffff" opacity="0.35" />
            <circle class="pot-bubble b3" cx="75" cy="160" r="4" fill="#ffffff" opacity="0.4" />

            {/* Luminous Liquid Meniscus Crest & Foam Highlight */}
            <path
              class="liquid-meniscus-glow"
              d="M20 74q30 -6 60 0t60 0v5h-120z"
              fill="url(#potFill)"
              opacity="0.8"
            />
            <ellipse class="meniscus-crest" cx="80" cy="74" rx="46" ry="4.5" fill="#ffffff" opacity="0.45" />
            <ellipse class="meniscus-core" cx="80" cy="73" rx="40" ry="2.5" fill="#ffffff" opacity="0.7" />
          </g>
        </g>

        {/* Outer glass specular outline */}
        <path class="glass" d="M30 60h100l-8 112a18 18 0 0 1-18 16H56a18 18 0 0 1-18-16z" stroke="url(#glassSpecular)" stroke-width="3" fill="rgba(255, 255, 255, 0.12)" />

        {/* Specular glass reflection bar (left highlight) */}
        <path class="specular-highlight" d="M40 68l-5 96a12 12 0 0 0 8 10h4l-7-106z" fill="url(#glossGrad)" />

        {/* Floating Lid with metallic/frosted depth */}
        <g class="pot-lid-group">
          <ellipse cx="80" cy="54" rx="58" ry="12" fill="rgba(0, 0, 0, 0.18)" />
          <rect class="lid-shadow" x="22" y="44" width="116" height="24" rx="12" fill="rgba(0,0,0,0.12)" />
          <rect class="lid" x="22" y="42" width="116" height="24" rx="12" fill="#ffffff" opacity="0.95" />
          <ellipse cx="80" cy="46" rx="46" ry="5" fill="#ffffff" opacity="0.8" />
        </g>

        {/* Face features */}
        {eyes}
      </svg>

      {/* Dynamic mood particles & indicators */}
      {(mood === "sleepy" || mood === "sad") && (
        <span class="zzz" aria-hidden="true">{mood === "sad" ? "…" : "z z"}</span>
      )}

      {mood === "glowing" && (
        <div class="pot-sparks" aria-hidden="true">
          <span class="spark s1">✦</span>
          <span class="spark s2">✧</span>
          <span class="spark s3">✦</span>
        </div>
      )}

      {splash && (
        <div class="pot-splash-ring" aria-hidden="true" />
      )}
    </div>
  );
}

function Eyes({ mood }: { mood: Mood }) {
  const lx = 58;
  const rx = 102;
  const ey = 108;
  switch (mood) {
    case "glowing":
      return (
        <g class="pot-face">
          <path class="face-line glow-eye" d={`M${lx - 10} ${ey + 2}q10-15 20 0M${rx - 10} ${ey + 2}q10-15 20 0`} />
          <path class="face-line" d="M62 128q18 20 36 0" />
          {/* Rosy blush cheeks */}
          <ellipse cx={lx - 14} cy={ey + 12} rx="6" ry="3.5" fill="#ff769c" opacity="0.6" />
          <ellipse cx={rx + 14} cy={ey + 12} rx="6" ry="3.5" fill="#ff769c" opacity="0.6" />
        </g>
      );
    case "content":
      return (
        <g class="pot-face">
          <Eye x={lx} y={ey} /><Eye x={rx} y={ey} />
          <path class="face-line" d="M68 128q12 11 24 0" />
          <ellipse cx={lx - 12} cy={ey + 10} rx="4.5" ry="2.5" fill="#ff769c" opacity="0.4" />
          <ellipse cx={rx + 12} cy={ey + 10} rx="4.5" ry="2.5" fill="#ff769c" opacity="0.4" />
        </g>
      );
    case "uneasy":
      return (
        <g class="pot-face">
          <Eye x={lx} y={ey} /><Eye x={rx} y={ey} />
          <path class="face-line" d="M66 132q7-6 14 0t14 0" />
          <path class="sweat" d="M122 84q7 10 0 15q-7-5 0-15z" />
        </g>
      );
    case "stressed":
      return (
        <g class="pot-face">
          <Eye x={lx} y={ey} r={11} /><Eye x={rx} y={ey} r={11} />
          <ellipse cx="80" cy="134" rx="9" ry="7" fill="#fff" />
          <path class="sweat" d="M122 82q7 10 0 15q-7-5 0-15zM36 92q6 9 0 13q-6-4 0-13z" />
        </g>
      );
    case "sleepy":
      return (
        <g class="pot-face">
          <path class="face-line" d={`M${lx - 9} ${ey}h18M${rx - 9} ${ey}h18`} />
          <ellipse cx="80" cy="132" rx="6" ry="5" fill="#fff" opacity=".9" />
        </g>
      );
    case "sad":
      return (
        <g class="pot-face">
          <path class="face-line" d={`M${lx - 10} ${ey - 8}l16 -6M${rx + 10} ${ey - 8}l-16 -6`} />
          <Eye x={lx} y={ey + 2} /><Eye x={rx} y={ey + 2} />
          <path class="face-line" d="M66 138q14-14 28 0" />
          <path class="tear" d="M52 122q6 11 0 16q-6-5 0-16z" />
        </g>
      );
  }
}

function Eye({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g class="eye-group">
      <circle class="eye" cx={x} cy={y} r={r} />
      <circle class="pupil" cx={x + 1.2} cy={y + 0.8} r={r * 0.58} />
      <circle cx={x + 2.5} cy={y - 1.5} r={r * 0.22} fill="#ffffff" />
    </g>
  );
}
