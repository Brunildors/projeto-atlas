import { describeAbsence } from "../../lib/absences";
import { absenceTypeLabel } from "../../lib/attendance";
import { isWeekend, weekdayIndex, weekdayNames } from "../../lib/calendar";
import { formatIsoDateLong } from "../../lib/format";
import type { AbsenceEntry, Holiday } from "../../types";

interface WeekViewProps {
  days: string[];
  today: string;
  holidays: Map<string, Holiday[]>;
  absences: Map<string, AbsenceEntry[]>;
  selected: string | null;
  onSelect: (iso: string) => void;
}

export function WeekView({ days, today, holidays, absences, selected, onSelect }: WeekViewProps) {
  const weekdays = weekdayNames();

  return (
    <ol className="week">
      {days.map((iso) => {
        const weekday = weekdays[weekdayIndex(iso)];
        const dayHolidays = holidays.get(iso) ?? [];
        const dayAbsences = absences.get(iso) ?? [];

        const classes = ["week-day"];
        if (iso === today) classes.push("is-today");
        if (iso === selected) classes.push("is-selected");
        if (isWeekend(iso)) classes.push("is-weekend");

        return (
          <li key={iso} className={classes.join(" ")}>
            <button
              type="button"
              className="week-day-head"
              aria-pressed={iso === selected}
              aria-label={formatIsoDateLong(iso)}
              onClick={() => onSelect(iso)}
            >
              <span className="week-day-name">{weekday.short}</span>
              <span className="week-day-number">{Number(iso.slice(8, 10))}</span>
            </button>
            <ul className="week-items">
              {dayHolidays.map((holiday) => (
                <li
                  key={holiday.name}
                  className={holiday.kind === "feriado" ? "chip chip--holiday" : "chip chip--optional"}
                  title={holiday.note}
                >
                  {holiday.name}
                </li>
              ))}

              {dayAbsences.map((entry) => (
                <li key={entry.id} className="chip chip--absence">
                  <span className="chip-name">{entry.name}</span>
                  <span className="chip-detail">
                    {absenceTypeLabel(entry.type)} · {describeAbsence(entry, false)}
                  </span>
                </li>
              ))}
            </ul>
            {dayHolidays.length === 0 && dayAbsences.length === 0 && (
              <p className="week-empty">—</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
