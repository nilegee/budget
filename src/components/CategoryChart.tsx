import { useState } from "preact/hooks";
import { money } from "../lib/fmt";
import type { Category } from "../lib/types";
import { Icon } from "./Icon";

export interface CategorySlice {
  c: Category;
  amount: number;
  pct: number;
}

export function CategoryDonut({
  slices,
  total,
  onSelectCategory
}: {
  slices: CategorySlice[];
  total: number;
  onSelectCategory?: (id: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Filter only categories with spend for the donut
  const activeSlices = slices.filter((s) => s.amount > 0);
  if (activeSlices.length === 0 || total === 0) return null;

  // Geometry: SVG 240x240, Center 120, 120, Radius 82, strokeWidth 22
  const R = 80;
  const C = 2 * Math.PI * R; // ~502.65
  const center = 120;
  let accumulatedAngle = 0;

  const currentSelection = activeSlices.find((s) => s.c.id === activeId) ?? activeSlices[0];

  return (
    <div class="category-chart-card">
      <div class="donut-wrap">
        <svg class="donut-svg" viewBox="0 0 240 240" role="img" aria-label="Category breakdown donut chart">
          <defs>
            <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.25" />
            </filter>
          </defs>

          {/* Underlay ring */}
          <circle
            cx={center}
            cy={center}
            r={R}
            fill="none"
            stroke="color-mix(in oklch, var(--text) 8%, transparent)"
            stroke-width="22"
          />

          {/* Slices */}
          {activeSlices.map((s) => {
            const strokeDasharray = `${(s.pct / 100) * C} ${C}`;
            const strokeDashoffset = -((accumulatedAngle / 100) * C);
            accumulatedAngle += s.pct;

            const isSelected = activeId === s.c.id;

            return (
              <circle
                key={s.c.id}
                cx={center}
                cy={center}
                r={R}
                fill="none"
                stroke={s.c.color}
                stroke-width={isSelected ? "28" : "22"}
                stroke-dasharray={strokeDasharray}
                stroke-dashoffset={strokeDashoffset}
                stroke-linecap="round"
                transform={`rotate(-90 ${center} ${center})`}
                class="donut-segment"
                data-active={isSelected}
                filter={isSelected ? "url(#donutShadow)" : undefined}
                onClick={() => {
                  navigator.vibrate?.(8);
                  setActiveId(s.c.id);
                  onSelectCategory?.(s.c.id);
                }}
              />
            );
          })}
        </svg>

        {/* Center Dynamic Stat */}
        <div class="donut-center" style={{ "--cat-accent": currentSelection.c.color }}>
          <i class="donut-icon" style={{ color: currentSelection.c.color }}>
            <Icon name={currentSelection.c.icon} size={28} />
          </i>
          <b class="donut-cat-name">{currentSelection.c.name}</b>
          <div class="donut-amount">{money(currentSelection.amount)}</div>
          <span class="donut-pct">{Math.round(currentSelection.pct)}%</span>
        </div>
      </div>

      {/* Mini Interactive Segment Bar */}
      <div class="stacked-bar" role="meter" aria-label="Category distribution bar">
        {activeSlices.map((s) => (
          <i
            key={s.c.id}
            style={{ width: `${s.pct}%`, background: s.c.color }}
            title={`${s.c.name}: ${Math.round(s.pct)}%`}
            onClick={() => setActiveId(s.c.id)}
          />
        ))}
      </div>
    </div>
  );
}
