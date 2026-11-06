import { Badge } from "../../components/Badge";
import { describeAbsence } from "../../lib/absences";
import { absenceTypeLabel, requestStatusLabel } from "../../lib/attendance";
import { formatIsoDate } from "../../lib/format";
import type { AbsenceEntry, City, Holiday } from "../../types";
import { KIND_TONE, kindLabel, scopeLabel } from "./labels";

export function HolidayList({
  holidays,
  city,
  withDate,
  showScope = true,
}: {
  holidays: Holiday[];
  city: City;
  withDate: boolean;
  showScope?: boolean;
}) {
  return (
    <ul className="holiday-list">
      {holidays.map((holiday) => (
        <li key={`${holiday.date}-${holiday.name}`}>
          {withDate && <span className="holiday-date">{formatIsoDate(holiday.date)}</span>}
          <span className="holiday-name">{holiday.name}</span>
          <Badge tone={KIND_TONE[holiday.kind]}>{kindLabel(holiday.kind)}</Badge>
          {showScope && <span className="holiday-scope">{scopeLabel(holiday.scope, city)}</span>}
          {holiday.note && <span className="holiday-note">{holiday.note}</span>}
        </li>
      ))}
    </ul>
  );
}

export function AbsenceList({ entries, withDate }: { entries: AbsenceEntry[]; withDate: boolean }) {
  return (
    <ul className="holiday-list absence-list">
      {entries.map((entry) => (
        <li key={entry.id}>
          <span className="absence-name">{entry.name}</span>
          <Badge tone="neutral">{absenceTypeLabel(entry.type)}</Badge>
          {entry.status === "analise" && <Badge tone="warning">{requestStatusLabel(entry.status)}</Badge>}
          <span className="absence-when">{describeAbsence(entry, withDate)}</span>
        </li>
      ))}
    </ul>
  );
}
