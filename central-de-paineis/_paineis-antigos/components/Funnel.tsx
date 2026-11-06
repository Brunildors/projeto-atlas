import { formatCompact, formatPercent, NO_DATA } from "../lib/format";
import { safeDivide } from "../lib/math";
import type { FunnelStage } from "../types";
import { EmptyState } from "./EmptyState";

interface FunnelProps {
  stages: FunnelStage[];
}

const MIN_WIDTH = 4;

export function Funnel({ stages }: FunnelProps) {
  if (stages.length === 0) {
    return (
      <EmptyState
        message="Funil sem etapas"
        hint="Preencha FUNNEL_STAGES em data/marketing.ts."
      />
    );
  }

  const top = stages[0].value;

  return (
    <ol className="funnel">
      {stages.map((stage, index) => {
        const previous = index > 0 ? stages[index - 1].value : null;

        const share = safeDivide(stage.value, top);
        const passRate = safeDivide(stage.value, previous);

        return (
          <li key={stage.label}>
            <div className="funnel-row">
              <span>{stage.label}</span>
              <strong>{formatCompact(stage.value)}</strong>
            </div>
            <div
              className="funnel-bar"
              style={{ width: `${Math.max(MIN_WIDTH, (share ?? 0) * 100)}%` }}
            />

            {index > 0 && (
              <div className="funnel-rate">
                {passRate === null ? NO_DATA : formatPercent(passRate * 100)} da etapa anterior
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
