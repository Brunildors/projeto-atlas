import { formatPercent } from "../lib/format";
import type { Slice } from "../types";
import { EmptyState } from "./EmptyState";

const RADIUS = 70;

const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface DonutChartProps {
  data: Slice[];
  centerValue: string;
  centerLabel: string;
  format?: (value: number) => string;
  emptyMessage?: string;
  emptyHint?: string;
}

const EMPTY_HEIGHT = 300;

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  format = String,
  emptyMessage = "Sem composição para mostrar",
  emptyHint,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return <EmptyState message={emptyMessage} hint={emptyHint} minHeight={EMPTY_HEIGHT} />;
  }

  let offset = 0;

  return (
    <div className="donut">
      <svg viewBox="0 0 200 200" role="img" aria-label={`${centerLabel}: ${centerValue}`}>
        <g transform="rotate(-90 100 100)">
          {data.map((item) => {
            const arc = (item.value / total) * CIRCUMFERENCE;

            const circle = (
              <circle
                key={item.label}
                cx={100}
                cy={100}
                r={RADIUS}
                fill="none"
                style={{ stroke: item.color }}
                strokeWidth={26}
                strokeDasharray={`${Math.max(0, arc - 2)} ${CIRCUMFERENCE}`}
                strokeDashoffset={-offset}
              />
            );

            offset += arc;
            return circle;
          })}
        </g>
        <text x={100} y={98} textAnchor="middle" className="donut-value">
          {centerValue}
        </text>
        <text x={100} y={120} textAnchor="middle" className="donut-label">
          {centerLabel}
        </text>
      </svg>
      <ul className="donut-legend">
        {data.map((item) => (
          <li key={item.label}>
            <i style={{ background: item.color }} />
            <span>{item.label}</span>
            <span className="muted">{formatPercent((item.value / total) * 100, 0)}</span>
            <span className="strong">{format(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
