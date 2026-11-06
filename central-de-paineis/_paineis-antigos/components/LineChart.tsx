import { useMemo, useRef, useState, type PointerEvent } from "react";
import { clamp } from "../lib/math";
import type { Series } from "../types";
import { EmptyState } from "./EmptyState";

const VIEW_WIDTH = 720;

const MARGIN = { top: 14, right: 12, bottom: 28, left: 80 };

interface LineChartProps {
  labels: string[];
  series: Series[];
  height?: number;
  format?: (value: number) => string;
  area?: boolean;
  ariaLabel?: string;
  emptyMessage?: string;
  emptyHint?: string;
}

export function LineChart({
  labels,
  series,
  height = 260,
  format = String,
  area = false,
  ariaLabel,
  emptyMessage = "Sem dados no período",
  emptyHint,
}: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const [hovered, setHovered] = useState<number | null>(null);

  const pointCount = labels.length;

  const maxY = useMemo(() => {
    const values = series.flatMap((s) => s.values);

    if (values.length === 0) return 1;

    const peak = Math.max(...values) * 1.08 || 1;
    const step = 10 ** Math.floor(Math.log10(peak)) / 2;
    return Math.ceil(peak / step) * step;
  }, [series]);

  const hasData = pointCount > 0 && series.some((s) => s.values.length > 0);

  if (!hasData) {
    return <EmptyState message={emptyMessage} hint={emptyHint} minHeight={height} />;
  }

  const plotWidth = VIEW_WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const toX = (index: number) =>
    MARGIN.left + (pointCount <= 1 ? 0 : (index * plotWidth) / (pointCount - 1));

  const toY = (value: number) => MARGIN.top + plotHeight - (value / maxY) * plotHeight;

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ratio * maxY);

  const labelStep = Math.max(1, Math.ceil(pointCount / 8));

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;

    const x = ((event.clientX - box.left) / box.width) * VIEW_WIDTH;
    const index = Math.round(((x - MARGIN.left) / plotWidth) * (pointCount - 1));
    setHovered(clamp(index, 0, pointCount - 1));
  }

  const toPath = (values: number[]) =>
    values
      .map((value, index) => `${index ? "L" : "M"}${toX(index).toFixed(1)},${toY(value).toFixed(1)}`)
      .join("");

  const firstSeries = series[0];

  const tipLeft = hovered === null ? 0 : (toX(hovered) / VIEW_WIDTH) * 100;

  return (
    <div className="chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHovered(null)}
      >
        {gridValues.map((value) => (
          <g key={value}>
            <line
              className="grid"
              x1={MARGIN.left}
              x2={VIEW_WIDTH - MARGIN.right}
              y1={toY(value)}
              y2={toY(value)}
            />
            <text className="axis" x={MARGIN.left - 10} y={toY(value) + 4} textAnchor="end">
              {format(value)}
            </text>
          </g>
        ))}

        {labels.map((label, index) =>
          (pointCount - 1 - index) % labelStep === 0 ? (
            <text
              key={label + index}
              className="axis"
              x={toX(index)}
              y={height - 8}
              textAnchor="middle"
            >
              {label}
            </text>
          ) : null,
        )}

        {area && firstSeries && (
          <path
            d={`${toPath(firstSeries.values)}L${toX(pointCount - 1)},${toY(0)}L${toX(0)},${toY(0)}Z`}
            style={{ fill: firstSeries.color, fillOpacity: 0.12 }}
          />
        )}

        {series.map((s) => (
          <path
            key={s.name}
            d={toPath(s.values)}
            fill="none"
            style={{ stroke: s.color }}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        ))}

        {hovered !== null && (
          <g>
            <line
              className="cursor"
              x1={toX(hovered)}
              x2={toX(hovered)}
              y1={MARGIN.top}
              y2={MARGIN.top + plotHeight}
            />
            {series.map((s) => (
              <circle
                key={s.name}
                cx={toX(hovered)}
                cy={toY(s.values[hovered])}
                r={4.5}
                style={{ fill: s.color }}
                className="cursor-dot"
              />
            ))}
          </g>
        )}
      </svg>
      {hovered !== null && (
        <div
          className="chart-tip"
          style={{
            left: `${tipLeft}%`,
            transform: `translateX(${tipLeft > 65 ? "-105%" : "5%"})`,
          }}
        >
          <strong>{labels[hovered]}</strong>
          {series.map((s) => (
            <span key={s.name}>
              <i style={{ background: s.color }} /> {s.name}: {format(s.values[hovered])}
            </span>
          ))}
        </div>
      )}

      {series.length > 1 && (
        <ul className="legend">
          {series.map((s) => (
            <li key={s.name}>
              <i style={{ background: s.color }} />
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
