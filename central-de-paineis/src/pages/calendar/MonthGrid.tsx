import { useMemo } from "react";
import { tn } from "../../i18n";
import { buildMonthGrid, toWeeks, weekdayNames } from "../../lib/calendar";
import { formatIsoDateLong, formatMonthYear } from "../../lib/format";
import { toIsoDate } from "../../lib/holidays";
import type { AbsenceEntry, City, DateRange } from "../../types";
import { kindLabel, scopeLabel } from "./labels";

interface MonthGridProps {
  year: number;
  month: number;
  today: string;
  city: City;
  absences: Map<string, AbsenceEntry[]>;
  range: DateRange;
  selected: string | null;
  onSelect: (iso: string) => void;
  mini?: boolean;
}

const absenceText = (count: number): string => tn("cal.absences", count);

export function MonthGrid({
  year,
  month,
  today,
  city,
  absences,
  range,
  selected,
  onSelect,
  mini = false,
}: MonthGridProps) {
  const weeks = useMemo(
    () => toWeeks(buildMonthGrid(year, month, today, city.id)),
    [year, month, today, city.id],
  );

  const monthLabel = formatMonthYear(toIsoDate(year, month, 1));
  const weekdays = weekdayNames();

  return (
    <table className={mini ? "calendar calendar--mini" : "calendar"}>
      <caption className={mini ? "calendar-caption" : "sr-only"}>{monthLabel}</caption>
      <thead>
        <tr>
          {weekdays.map((weekday) => (
            <th key={weekday.short} scope="col">
              <abbr title={weekday.long}>{mini ? weekday.short.charAt(0) : weekday.short}</abbr>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0].iso}>
            {week.map((day) => {
              const holiday = day.holidays[0];
              const dayAbsences = absences.get(day.iso) ?? [];
              const active = day.inMonth && day.iso >= range.start && day.iso <= range.end;

              if (!active) {
                return (
                  <td key={day.iso}>
                    <span className="day is-outside" aria-hidden="true">
                      <span className="day-number">{day.day}</span>
                    </span>
                  </td>
                );
              }

              const classes = ["day"];
              if (day.isWeekend) classes.push("is-weekend");
              if (day.isToday) classes.push("is-today");
              if (day.holidays.some((item) => item.kind === "feriado")) {
                classes.push("is-holiday");
              } else if (day.holidays.length > 0) {
                classes.push("is-optional");
              }
              if (day.iso === selected) classes.push("is-selected");

              const parts = [formatIsoDateLong(day.iso)];
              if (holiday) {
                parts.push(`${holiday.name} (${kindLabel(holiday.kind)}, ${scopeLabel(holiday.scope, city)})`);
              }
              if (dayAbsences.length > 0) parts.push(absenceText(dayAbsences.length));

              const tip = [holiday?.name, dayAbsences.length > 0 ? absenceText(dayAbsences.length) : ""]
                .filter(Boolean)
                .join(" · ");

              return (
                <td key={day.iso}>
                  <button
                    type="button"
                    className={classes.join(" ")}
                    aria-pressed={day.iso === selected}
                    aria-label={parts.join(" — ")}
                    title={tip || undefined}
                    onClick={() => onSelect(day.iso)}
                  >
                    <span className="day-number">{day.day}</span>
                    {(day.holidays.length > 0 || dayAbsences.length > 0) && (
                      <span className="day-marks" aria-hidden="true">
                        {day.holidays.length > 0 && <span className="day-mark" />}
                        {dayAbsences.length > 0 && <span className="day-mark day-mark--absence" />}
                      </span>
                    )}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
