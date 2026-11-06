import { t, tn, type MessageKey } from "../i18n";
import { getLang } from "../i18n/core";
import type { CalendarView, DateRange, DayPeriod } from "../types";
import { addDays, addMonths, daysBetween, daysInMonth, weekdayIndex } from "./calendar";
import { formatIsoDateLong, formatMonthYear } from "./format";
import { MAX_YEAR, MIN_YEAR, toIsoDate } from "./holidays";

export const CALENDAR_VIEWS: CalendarView[] = [
  "periodo",
  "dia",
  "semana",
  "mes",
  "bimestre",
  "trimestre",
  "semestre",
  "ano",
  "personalizado",
];

export const viewLabel = (view: CalendarView): string => t(`cal.view.${view}` as MessageKey);

export const stepLabel = (view: CalendarView, direction: "prev" | "next"): string =>
  t(`cal.${direction}.${view}` as MessageKey);

const MONTH_SPAN: Partial<Record<CalendarView, number>> = {
  mes: 1,
  bimestre: 2,
  trimestre: 3,
  semestre: 6,
  ano: 12,
};

export const isMonthGridView = (view: CalendarView): boolean =>
  view in MONTH_SPAN || view === "personalizado";

export const DAY_PERIODS: DayPeriod[] = ["manha", "tarde", "noite"];

export const PERIOD_WINDOW: Record<DayPeriod, { from: string; to: string }> = {
  manha: { from: "00:00", to: "12:00" },
  tarde: { from: "12:00", to: "18:00" },
  noite: { from: "18:00", to: "24:00" },
};

export const periodLabel = (period: DayPeriod): string => t(`cal.period.${period}`);
export const periodHours = (period: DayPeriod): string => t(`cal.hours.${period}`);

export function periodAt(date = new Date()): DayPeriod {
  const hour = date.getHours();
  if (hour < 12) return "manha";
  return hour < 18 ? "tarde" : "noite";
}

export const FIRST_DAY = toIsoDate(MIN_YEAR, 1, 1);
export const LAST_DAY = toIsoDate(MAX_YEAR, 12, 31);

export const CUSTOM_MAX_DAYS = 366;

export function clampDay(iso: string): string {
  if (iso.length > LAST_DAY.length || iso > LAST_DAY) return LAST_DAY;
  return iso < FIRST_DAY ? FIRST_DAY : iso;
}

export function rangeFor(view: CalendarView, anchor: string, custom: DateRange): DateRange {
  if (view === "personalizado") return custom;
  if (view === "periodo" || view === "dia") return { start: anchor, end: anchor };

  if (view === "semana") {
    const start = addDays(anchor, -weekdayIndex(anchor));
    return { start: clampDay(start), end: clampDay(addDays(start, 6)) };
  }

  const span = MONTH_SPAN[view] ?? 1;
  const year = Number(anchor.slice(0, 4));
  const month = Number(anchor.slice(5, 7));
  const first = Math.floor((month - 1) / span) * span + 1;
  const last = first + span - 1;

  return { start: toIsoDate(year, first, 1), end: toIsoDate(year, last, daysInMonth(year, last)) };
}

export function monthsOf(range: DateRange): { year: number; month: number }[] {
  const startYear = Number(range.start.slice(0, 4));
  const startMonth = Number(range.start.slice(5, 7));
  const count =
    (Number(range.end.slice(0, 4)) - startYear) * 12 + Number(range.end.slice(5, 7)) - startMonth + 1;

  return Array.from({ length: count }, (_, index) => {
    const month = addMonths(toIsoDate(startYear, startMonth, 1), index);
    return { year: Number(month.slice(0, 4)), month: Number(month.slice(5, 7)) };
  });
}

export function eachDay(range: DateRange): string[] {
  return Array.from({ length: daysBetween(range.start, range.end) }, (_, index) =>
    addDays(range.start, index),
  );
}

export function shiftAnchor(view: CalendarView, anchor: string, delta: number): string {
  if (view === "dia") return clampDay(addDays(anchor, delta));
  if (view === "semana") return clampDay(addDays(anchor, 7 * delta));
  return clampDay(addMonths(anchor, (MONTH_SPAN[view] ?? 1) * delta));
}

export function shiftPeriod(
  anchor: string,
  period: DayPeriod,
  delta: number,
): { anchor: string; period: DayPeriod } {
  const index = DAY_PERIODS.indexOf(period) + delta;
  const dayOffset = Math.floor(index / DAY_PERIODS.length);
  const wrapped = ((index % DAY_PERIODS.length) + DAY_PERIODS.length) % DAY_PERIODS.length;

  return { anchor: clampDay(addDays(anchor, dayOffset)), period: DAY_PERIODS[wrapped] };
}

export function shiftRange(range: DateRange, delta: number): DateRange {
  const offset = daysBetween(range.start, range.end) * delta;
  const start = addDays(range.start, offset);
  const end = addDays(range.end, offset);

  return clampDay(start) !== start || clampDay(end) !== end ? range : { start, end };
}

export function customRangeError(range: DateRange): string | null {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!pattern.test(range.start) || !pattern.test(range.end)) return t("cal.err.bothDates");
  if (range.start < FIRST_DAY || range.end > LAST_DAY) {
    return t("cal.err.limits", { min: String(MIN_YEAR), max: String(MAX_YEAR) });
  }
  if (range.end < range.start) return t("cal.err.order");
  if (daysBetween(range.start, range.end) > CUSTOM_MAX_DAYS) return t("cal.err.tooLong", { n: CUSTOM_MAX_DAYS });

  return null;
}

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const utc = (iso: string): Date => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

function rangeText(range: DateRange, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(getLang(), { ...options, timeZone: "UTC" }).formatRange(utc(range.start), utc(range.end));
}

export function describeRange(
  view: CalendarView,
  range: DateRange,
  period: DayPeriod,
): { title: string; note?: string } {
  const year = Number(range.start.slice(0, 4));
  const month = Number(range.start.slice(5, 7));

  switch (view) {
    case "periodo":
      return {
        title: capitalize(t("cal.periodOf", { period: periodLabel(period), date: formatIsoDateLong(range.start) })),
        note: periodHours(period),
      };
    case "dia":
      return { title: capitalize(formatIsoDateLong(range.start)) };
    case "semana":
      return {
        title: t("cal.weekOf", { span: rangeText(range, { day: "numeric", month: "long", year: "numeric" }) }),
        note: t("cal.sunToSat"),
      };
    case "mes":
      return { title: capitalize(formatMonthYear(range.start)) };
    case "ano":
      return { title: String(year) };
    case "personalizado":
      return {
        title: rangeText(range, { day: "2-digit", month: "2-digit", year: "numeric" }),
        note: tn("cal.days", daysBetween(range.start, range.end)),
      };
    default: {
      const span = MONTH_SPAN[view] ?? 1;
      const order = Math.floor((month - 1) / span) + 1;
      return {
        title: t(`cal.block.${view}` as MessageKey, { n: order, year: String(year) }),
        note: rangeText(range, { month: "long" }),
      };
    }
  }
}
