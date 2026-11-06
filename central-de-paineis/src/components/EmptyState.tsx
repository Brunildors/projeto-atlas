import { t } from "../i18n";

interface EmptyStateProps {
  message?: string;
  hint?: string;
  minHeight?: number;
}

export function EmptyState({ message = t("ui.noData"), hint, minHeight = 180 }: EmptyStateProps) {
  return (
    <div className="empty-state" style={{ minHeight }}>
      <span className="empty-state-mark" aria-hidden="true" />
      <p className="empty-state-text">{message}</p>
      {hint && <p className="empty-state-hint">{hint}</p>}
    </div>
  );
}
