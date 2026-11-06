import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  note?: string;
  actions?: ReactNode;
  span?: 4 | 5 | 6 | 7 | 8 | 12;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, note, actions, span = 6, className, children }: PanelProps) {
  return (
    <section className={className ? `panel span-${span} ${className}` : `panel span-${span}`}>
      <header className="panel-head">
        <div>
          <h2>{title}</h2>
          {note && <p className="panel-note">{note}</p>}
        </div>
        {actions && <div className="panel-actions">{actions}</div>}
      </header>
      {children}
    </section>
  );
}
