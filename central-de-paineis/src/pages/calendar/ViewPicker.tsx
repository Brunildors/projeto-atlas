import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import { t } from "../../i18n";
import { CALENDAR_VIEWS, viewLabel } from "../../lib/calendarViews";
import type { CalendarView } from "../../types";

interface ViewPickerProps {
  view: CalendarView;
  onChange: (view: CalendarView) => void;
  onToday: () => void;
}

export function ViewPicker({ view, onChange, onToday }: ViewPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const toggleLabel = open ? t("cal.collapse") : t("cal.expand", { view: viewLabel(view) });

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(next: CalendarView) {
    onChange(next);
    setOpen(false);
    toggleRef.current?.focus();
  }

  return (
    <div className="view-picker" ref={rootRef}>
      <span className="view-picker-label" id="calendario-visualizacao">
        {t("cal.viewLabel")}
      </span>
      <div className="segmented view-picker-bar" role="group" aria-labelledby="calendario-visualizacao">
        <button type="button" title={t("cal.backToday")} onClick={onToday}>
          {t("cal.today")}
        </button>
        <button
          ref={toggleRef}
          type="button"
          className="view-picker-toggle"
          aria-expanded={open}
          aria-controls="calendario-escalas"
          aria-label={toggleLabel}
          title={toggleLabel}
          onClick={() => setOpen((atual) => !atual)}
        >
          <Icon name="chevron" size={16} />
        </button>
      </div>
      <ul className="view-menu" id="calendario-escalas" hidden={!open}>
        {CALENDAR_VIEWS.map((item) => (
          <li key={item}>
            <button type="button" aria-pressed={item === view} onClick={() => choose(item)}>
              {viewLabel(item)}
              {item === view && <Icon name="check" size={16} />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
