import { useState } from "react";
import type { Slice } from "../types";
import { EmptyState } from "./EmptyState";

const MARGIN = { top: 22, right: 8, bottom: 30, left: 8 };

interface BarChartProps {
  data: Slice[];
  height?: number;
  width?: number;
  color?: string;
  format?: (value: number) => string;
  ariaLabel?: string;
  emptyMessage?: string;
  emptyHint?: string;
}

export function BarChart({
  data,
  height = 240,
  width = 720,
  color = "var(--accent)",
  format = String,
  ariaLabel,
  emptyMessage = "Sem dados para comparar",
  emptyHint,
}: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) {
    return <EmptyState message={emptyMessage} hint={emptyHint} minHeight={height} />;
  }

  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const maxValue = Math.max(...data.map((item) => item.value)) || 1;

  const slot = plotWidth / data.length;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        <line
          className="grid"
          x1={MARGIN.left}
          x2={width - MARGIN.right}
          y1={MARGIN.top + plotHeight}
          y2={MARGIN.top + plotHeight}
        />

        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * plotHeight;
          const x = MARGIN.left + index * slot + slot * 0.18;
          const dimmed = hovered !== null && hovered !== index;

          return (
            <g
              key={item.label}
              onPointerEnter={() => setHovered(index)}
              onPointerLeave={() => setHovered(null)}
              opacity={dimmed ? 0.4 : 1}
              style={{ transition: "opacity .15s" }}
            >
              <rect
                x={x}
                y={MARGIN.top + plotHeight - barHeight}
                width={slot * 0.64}
                height={barHeight}
                rx={5}
                style={{ fill: item.color ?? color }}
              />
              <text
                className="bar-value"
                x={x + slot * 0.32}
                y={MARGIN.top + plotHeight - barHeight - 6}
                textAnchor="middle"
              >
                {format(item.value)}
              </text>
              <text className="axis" x={x + slot * 0.32} y={height - 10} textAnchor="middle">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
