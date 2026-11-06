import { t } from "../i18n";
import { getLang } from "../i18n/core";
import type { DateRange, Holiday, HolidayMove, HolidayScope, LocalDateRules, RuleYears } from "../types";
import { findCity, regionOf } from "./cities";
import { countryOf } from "./countries";
import { formatDayMonth } from "./format";

export const MIN_YEAR = 1583;

export const MAX_YEAR = 9999;

export const toIsoDate = (year: number, month: number, day: number): string =>
  [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");

const DAY_IN_MS = 86_400_000;

function shiftIsoDate(year: number, month: number, day: number, offset: number): string {
  const shifted = new Date(Date.UTC(year, month - 1, day) + offset * DAY_IN_MS);

  return toIsoDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

function addDaysIso(iso: string, offset: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  return shiftIsoDate(year, month, day, offset);
}

function weekdayOf(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

const weekdayName = (iso: string): string =>
  new Intl.DateTimeFormat(getLang(), { weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))),
  );

// páscoa pelo algoritmo de Meeus/Jones/Butcher. carnaval, sexta-feira santa
// e corpus christi são calculados a partir dela
export function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);

  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return toIsoDate(year, month, day);
}

function validIn(rule: RuleYears, year: number): boolean {
  if (rule.since !== undefined && year < rule.since) return false;
  if (rule.until !== undefined && year > rule.until) return false;
  if (rule.except?.includes(year)) return false;
  if (rule.every !== undefined && (year - (rule.since ?? 0)) % rule.every !== 0) return false;
  return true;
}

function nthWeekday(year: number, month: number, weekday: number, nth: number): string {
  if (nth > 0) {
    const first = weekdayOf(toIsoDate(year, month, 1));
    return toIsoDate(year, month, 1 + ((weekday - first + 7) % 7) + (nth - 1) * 7);
  }

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = weekdayOf(toIsoDate(year, month, lastDay));
  return toIsoDate(year, month, lastDay - ((last - weekday + 7) % 7));
}

// alguns países mudam o feriado de dia dependendo do dia da semana em que ele cai
function movedDate(iso: string, move: Exclude<HolidayMove, "substituto">): string {
  const weekday = weekdayOf(iso);

  switch (move) {
    case "observado":
      if (weekday === 6) return addDaysIso(iso, -1);
      if (weekday === 0) return addDaysIso(iso, 1);
      return iso;
    case "segunda":
      return weekday === 1 ? iso : addDaysIso(iso, (8 - weekday) % 7);
    case "segunda-proxima":
      if (weekday === 2 || weekday === 3) return addDaysIso(iso, 1 - weekday);
      if (weekday === 4 || weekday === 5) return addDaysIso(iso, 8 - weekday);
      return iso;
    case "domingo-sabado":
      return weekday === 0 ? addDaysIso(iso, -1) : iso;
  }
}

function movedNote(original: string, note: string | undefined): string {
  const moved = t("cal.moved", { date: formatDayMonth(original), weekday: weekdayName(original) });
  return note ? `${note} · ${moved}` : moved;
}

interface PendingSubstitute {
  holiday: Holiday;
  original: string;
}

const isWeekendIso = (iso: string): boolean => weekdayOf(iso) === 0 || weekdayOf(iso) === 6;

function placeSubstitutes(placed: Holiday[], pending: PendingSubstitute[]): Holiday[] {
  const taken = new Set(placed.map((holiday) => holiday.date));
  const onWeekdays = pending.filter((item) => !isWeekendIso(item.original));
  const onWeekends = pending
    .filter((item) => isWeekendIso(item.original))
    .sort((a, b) => a.original.localeCompare(b.original));

  for (const item of onWeekdays) taken.add(item.original);
  const result = onWeekdays.map((item) => item.holiday);

  for (const { holiday, original } of onWeekends) {
    let date = original;
    while (isWeekendIso(date) || taken.has(date)) date = addDaysIso(date, 1);

    taken.add(date);
    result.push({ ...holiday, date, note: movedNote(original, holiday.note) });
  }

  return result;
}

function applyRules(rules: LocalDateRules, scope: HolidayScope, year: number): Holiday[] {
  const [easterYear, easterMonth, easterDay] = easterSunday(year).split("-").map(Number);
  const placed: Holiday[] = [];
  const pending: PendingSubstitute[] = [];

  for (const rule of rules.fixed ?? []) {
    if (!validIn(rule, year)) continue;

    const original = toIsoDate(year, rule.month, rule.day);
    const holiday: Holiday = { date: original, name: rule.name, kind: rule.kind, scope, note: rule.note };

    if (rule.move === "substituto") {
      pending.push({ holiday, original });
      continue;
    }

    const date = rule.move ? movedDate(original, rule.move) : original;
    placed.push(date === original ? holiday : { ...holiday, date, note: movedNote(original, rule.note) });
  }

  for (const rule of rules.easter ?? []) {
    if (!validIn(rule, year)) continue;
    placed.push({
      date: shiftIsoDate(easterYear, easterMonth, easterDay, rule.offset),
      name: rule.name,
      kind: rule.kind,
      scope,
      note: rule.note,
    });
  }

  for (const rule of rules.weekday ?? []) {
    if (!validIn(rule, year)) continue;
    placed.push({
      date: nthWeekday(year, rule.month, rule.weekday, rule.nth),
      name: rule.name,
      kind: rule.kind,
      scope,
      note: rule.note,
    });
  }

  return [...placed, ...placeSubstitutes(placed, pending)];
}

const SCOPE_WEIGHT: Record<HolidayScope, number> = {
  nacional: 0,
  estadual: 1,
  municipal: 2,
};

const outranks = (a: Holiday, b: Holiday): boolean =>
  a.kind !== b.kind ? a.kind === "feriado" : SCOPE_WEIGHT[a.scope] > SCOPE_WEIGHT[b.scope];

const cache = new Map<string, Holiday[]>();

export function holidaysFor(cityId: string, year: number): Holiday[] {
  if (year < MIN_YEAR || year > MAX_YEAR) return [];

  const city = findCity(cityId);
  const key = `${city.id}:${year}:${getLang()}`;

  const cached = cache.get(key);
  if (cached) return cached;

  const country = countryOf(city.country);
  const region = regionOf(city);

  const layers: Holiday[] = [];
  for (const candidate of [year - 1, year, year + 1]) {
    if (candidate < MIN_YEAR || candidate > MAX_YEAR) continue;
    layers.push(
      ...applyRules(country.rules, "nacional", candidate),
      ...applyRules(region?.rules ?? {}, "estadual", candidate),
      ...applyRules(city.rules, "municipal", candidate),
    );
  }

  const prefix = `${String(year).padStart(4, "0")}-`;
  const byDateAndName = new Map<string, Holiday>();
  for (const holiday of layers) {
    if (!holiday.date.startsWith(prefix)) continue;

    const id = `${holiday.date}|${holiday.name}`;
    const current = byDateAndName.get(id);
    if (!current || outranks(holiday, current)) byDateAndName.set(id, holiday);
  }

  const all = [...byDateAndName.values()].sort((a, b) => a.date.localeCompare(b.date));

  cache.set(key, all);
  return all;
}

export function holidaysByDate(cityId: string, year: number): Map<string, Holiday[]> {
  return groupByDate(holidaysFor(cityId, year));
}

export function groupByDate(holidays: Holiday[]): Map<string, Holiday[]> {
  const map = new Map<string, Holiday[]>();

  for (const holiday of holidays) {
    const sameDay = map.get(holiday.date);

    if (sameDay) sameDay.push(holiday);
    else map.set(holiday.date, [holiday]);
  }

  return map;
}

export function holidaysInRange(cityId: string, range: DateRange): Holiday[] {
  const firstYear = Number(range.start.slice(0, 4));
  const lastYear = Number(range.end.slice(0, 4));
  const found: Holiday[] = [];

  for (let year = firstYear; year <= lastYear; year += 1) {
    for (const holiday of holidaysFor(cityId, year)) {
      if (holiday.date >= range.start && holiday.date <= range.end) found.push(holiday);
    }
  }

  return found;
}

export function nextHoliday(cityId: string, fromIso: string): Holiday | null {
  const year = Number(fromIso.slice(0, 4));

  for (const candidateYear of [year, year + 1]) {
    const found = holidaysFor(cityId, candidateYear).find(
      (holiday) => holiday.kind === "feriado" && holiday.date >= fromIso,
    );

    if (found) return found;
  }

  return null;
}
