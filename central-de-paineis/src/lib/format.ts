import { getLang } from "../i18n/core";

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

function numberFormat(key: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const id = `${getLang()}|n|${key}`;
  let formatter = cache.get(id) as Intl.NumberFormat | undefined;
  if (!formatter) {
    formatter = new Intl.NumberFormat(getLang(), options);
    cache.set(id, formatter);
  }
  return formatter;
}

function dateFormat(key: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const id = `${getLang()}|d|${key}`;
  let formatter = cache.get(id) as Intl.DateTimeFormat | undefined;
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(getLang(), options);
    cache.set(id, formatter);
  }
  return formatter;
}

export const formatNumber = (value: number, decimals = 0): string =>
  numberFormat(`fixed${decimals}`, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);

export const formatNumber1 = (value: number): string =>
  numberFormat("upTo1", { maximumFractionDigits: 1 }).format(value);

export const formatPercent = (value: number, decimals = 1): string => `${formatNumber(value, decimals)}%`;

// meio-dia pro fuso horário não jogar a data pro dia anterior
const noon = (iso: string): Date => new Date(`${iso}T12:00`);

export const formatIsoDate = (iso: string): string =>
  dateFormat("short", { day: "2-digit", month: "2-digit", year: "numeric" }).format(noon(iso));

export const formatDayMonth = (iso: string): string =>
  dateFormat("dayMonth", { day: "2-digit", month: "2-digit" }).format(noon(iso));

export const formatIsoDateLong = (iso: string): string =>
  dateFormat("long", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(noon(iso));

export const formatMonthYear = (iso: string): string =>
  dateFormat("monthYear", { month: "long", year: "numeric" }).format(noon(iso));

export const formatIsoDateTime = (iso: string): string =>
  dateFormat("dateTime", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${formatNumber1(value)} ${units[unit]}`;
}

export const compareText = (a: string, b: string): number => a.localeCompare(b, getLang());

export const NO_DATA = "—";

export const formatMaybe = (
  value: number | null | undefined,
  format: (value: number) => string,
): string | undefined => (value === null || value === undefined ? undefined : format(value));
