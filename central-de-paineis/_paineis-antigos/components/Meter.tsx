import { formatNumber } from "../lib/format";

interface MeterProps {
  value: number;
  label: string;
  warnAt?: number;
  dangerAt?: number;
}

export function Meter({ value, label, warnAt = 70, dangerAt = 85 }: MeterProps) {
  const tone = value >= dangerAt ? "negative" : value >= warnAt ? "warning" : "positive";

  return (
    <div
      className="meter"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <div className="meter-track">
        <div className={`meter-fill meter-fill--${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className="meter-value">{formatNumber(value)}%</span>
    </div>
  );
}
