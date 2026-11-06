import { t } from "../i18n";
import type { AbsenceEntry, AbsenceNotice, DateRange, DayPeriod } from "../types";
import { formatLatePeriod, listAllNotices } from "./attendance";
import { addDays, daysBetween } from "./calendar";
import { capitalize, PERIOD_WINDOW } from "./calendarViews";
import { displayName, listEmployees } from "./employees";
import { compareText, formatIsoDate } from "./format";
import { formatDocument } from "./validation";

function nameFor(notice: AbsenceNotice, names: Map<string, string>): string {
  return (
    names.get(notice.document) ??
    formatDocument(notice.document.length === 11 ? "cpf" : "cnpj", notice.document)
  );
}

export function listAbsences(): AbsenceEntry[] {
  const names = new Map(listEmployees().map((employee) => [employee.document, displayName(employee)]));

  return listAllNotices()
    .filter((notice) => notice.status === "analise" || notice.status === "aprovada")
    .map((notice) => ({
      id: notice.id,
      name: nameFor(notice, names),
      type: notice.type,
      startDate: notice.startDate,
      endDate: notice.endDate,
      from: notice.startTime,
      to: notice.expectedTime,
      status: notice.status,
    }))
    .sort(
      (a, b) =>
        a.startDate.localeCompare(b.startDate) ||
        a.from.localeCompare(b.from) ||
        compareText(a.name, b.name),
    );
}

export const overlapsRange = (entry: AbsenceEntry, range: DateRange): boolean =>
  entry.startDate <= range.end && entry.endDate >= range.start;

export function inPeriod(entry: AbsenceEntry, period: DayPeriod): boolean {
  if (entry.type === "falta") return true;

  const window = PERIOD_WINDOW[period];
  const from = entry.from === "" ? "00:00" : entry.from;

  return from < window.to && entry.to > window.from;
}

export function absencesByDate(entries: AbsenceEntry[], range: DateRange): Map<string, AbsenceEntry[]> {
  const map = new Map<string, AbsenceEntry[]>();

  for (const entry of entries) {
    const start = entry.startDate > range.start ? entry.startDate : range.start;
    const end = entry.endDate < range.end ? entry.endDate : range.end;
    if (start > end) continue;

    for (let index = 0; index < daysBetween(start, end); index += 1) {
      const day = addDays(start, index);
      const sameDay = map.get(day);

      if (sameDay) sameDay.push(entry);
      else map.set(day, [entry]);
    }
  }

  return map;
}

export function describeAbsence(entry: AbsenceEntry, withDate: boolean): string {
  const late = entry.type === "atraso" ? formatLatePeriod(entry.from, entry.to) : "";

  if (!withDate) return late === "" ? t("absence.wholeDay") : capitalize(late);
  if (late !== "") return `${formatIsoDate(entry.startDate)}, ${late}`;
  if (entry.startDate === entry.endDate) return formatIsoDate(entry.startDate);

  return t("absence.range", { from: formatIsoDate(entry.startDate), to: formatIsoDate(entry.endDate) });
}
