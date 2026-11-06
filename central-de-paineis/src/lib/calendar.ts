import { getLang } from "../i18n/core";
import type { CalendarDay } from "../types";
import { holidaysByDate, toIsoDate } from "./holidays";

export const WEEK_LENGTH = 7;

export function weekdayNames(): { short: string; long: string }[] {
  const short = new Intl.DateTimeFormat(getLang(), { weekday: "short", timeZone: "UTC" });
  const long = new Intl.DateTimeFormat(getLang(), { weekday: "long", timeZone: "UTC" });
  return Array.from({ length: WEEK_LENGTH }, (_, index) => {
    const date = new Date(Date.UTC(2026, 0, 4 + index));
    return { short: short.format(date).replace(/\.$/, ""), long: long.format(date) };
  });
}

const GRID_CELLS = 42;

export function isoDateOf(date: Date): string {
  return toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function todayIso(): string {
  return isoDateOf(new Date());
}

function toUtc(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

const fromUtc = (date: Date): string =>
  toIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

export function addDays(iso: string, days: number): string {
  const date = toUtc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtc(date);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / 86_400_000) + 1;
}

export const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

export function addMonths(iso: string, months: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const absolute = year * 12 + (month - 1) + months;

  const nextYear = Math.floor(absolute / 12);
  const nextMonth = (absolute % 12) + 1;

  return toIsoDate(nextYear, nextMonth, Math.min(day, daysInMonth(nextYear, nextMonth)));
}

export const weekdayIndex = (iso: string): number => toUtc(iso).getUTCDay();

export const isWeekend = (iso: string): boolean => {
  const weekday = weekdayIndex(iso);
  return weekday === 0 || weekday === 6;
};

export function buildMonthGrid(
  year: number,
  month: number,
  today: string,
  cityId: string,
): CalendarDay[] {
  const leading = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const byYear = new Map<number, Map<string, CalendarDay["holidays"]>>();

  const holidaysOf = (iso: string): CalendarDay["holidays"] => {
    const cellYear = Number(iso.slice(0, 4));

    let map = byYear.get(cellYear);
    if (!map) {
      map = holidaysByDate(cityId, cellYear);
      byYear.set(cellYear, map);
    }

    return map.get(iso) ?? [];
  };

  const days: CalendarDay[] = [];

  for (let cell = 0; cell < GRID_CELLS; cell += 1) {
    const date = new Date(Date.UTC(year, month - 1, cell - leading + 1));

    const cellYear = date.getUTCFullYear();
    const cellMonth = date.getUTCMonth() + 1;
    const weekday = date.getUTCDay();

    const iso = fromUtc(date);

    days.push({
      iso,
      day: date.getUTCDate(),
      inMonth: cellYear === year && cellMonth === month,
      isWeekend: weekday === 0 || weekday === 6,
      isToday: iso === today,
      holidays: holidaysOf(iso),
    });
  }

  return days;
}

export function toWeeks(days: CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = [];

  for (let start = 0; start < days.length; start += WEEK_LENGTH) {
    weeks.push(days.slice(start, start + WEEK_LENGTH));
  }

  return weeks;
}
