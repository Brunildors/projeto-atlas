import { t } from "../i18n";
import { formatNumber, NO_DATA } from "../lib/format";
import type { GoodWhen } from "../types";
import { Sparkline } from "./Sparkline";

interface KpiCardProps {
  label: string;
  value?: string;
  delta?: number;
  goodWhen?: GoodWhen;
  comparison?: string;
  spark?: number[];
  detail?: string;
}

export function KpiCard({
  label,
  value,
  delta,
  goodWhen = "up",
  comparison = t("ui.vsPrevious"),
  spark,
  detail,
}: KpiCardProps) {
  const hasValue = typeof value === "string" && value.length > 0;
  const hasDelta = typeof delta === "number";

  const isGood = hasDelta && (goodWhen === "up" ? delta >= 0 : delta <= 0);

  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${hasValue ? "" : "is-empty"}`}>
        {hasValue ? value : NO_DATA}
      </div>
      {hasDelta && (
        <div className={`kpi-delta ${isGood ? "is-good" : "is-bad"}`}>
          {delta >= 0 ? "▲" : "▼"} {formatNumber(Math.abs(delta), 1)}%{" "}
          <span>{comparison}</span>
        </div>
      )}

      {detail && <div className="kpi-detail">{detail}</div>}

      {spark && spark.length > 1 && (
        <Sparkline values={spark} color={isGood || !hasDelta ? "var(--positive)" : "var(--negative)"} />
      )}
    </div>
  );
}
