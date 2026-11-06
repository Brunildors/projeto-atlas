import { holidaysByDate, MAX_YEAR, MIN_YEAR, toIsoDate } from "./holidays.js";

export const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const WEEKDAYS = [
  { short: "dom", long: "domingo" },
  { short: "seg", long: "segunda-feira" },
  { short: "ter", long: "terça-feira" },
  { short: "qua", long: "quarta-feira" },
  { short: "qui", long: "quinta-feira" },
  { short: "sex", long: "sexta-feira" },
  { short: "sáb", long: "sábado" },
];

const GRID_CELLS = 42;

export function todayIso() {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export const clampYear = (year) => Math.min(Math.max(year, MIN_YEAR), MAX_YEAR);

export function shiftMonth(year, month, delta) {
  const absolute = year * 12 + (month - 1) + delta;

  const shiftedYear = Math.floor(absolute / 12);
  const shiftedMonth = (absolute % 12) + 1;

  if (shiftedYear < MIN_YEAR) return { year: MIN_YEAR, month: 1 };
  if (shiftedYear > MAX_YEAR) return { year: MAX_YEAR, month: 12 };

  return { year: shiftedYear, month: shiftedMonth };
}

export function buildMonthGrid(year, month, today) {
  const leading = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const byYear = new Map();

  const holidaysOf = (iso) => {
    const cellYear = Number(iso.slice(0, 4));

    let map = byYear.get(cellYear);
    if (!map) {
      map = holidaysByDate(cellYear);
      byYear.set(cellYear, map);
    }

    return map.get(iso) ?? [];
  };

  const days = [];

  for (let cell = 0; cell < GRID_CELLS; cell += 1) {
    const date = new Date(Date.UTC(year, month - 1, cell - leading + 1));

    const cellYear = date.getUTCFullYear();
    const cellMonth = date.getUTCMonth() + 1;
    const cellDay = date.getUTCDate();
    const weekday = date.getUTCDay();

    const iso = toIsoDate(cellYear, cellMonth, cellDay);

    days.push({
      iso,
      day: cellDay,
      inMonth: cellYear === year && cellMonth === month,
      isWeekend: weekday === 0 || weekday === 6,
      isToday: iso === today,
      holidays: holidaysOf(iso),
    });
  }

  return days;
}

export function toWeeks(days) {
  const weeks = [];

  for (let start = 0; start < days.length; start += WEEKDAYS.length) {
    weeks.push(days.slice(start, start + WEEKDAYS.length));
  }

  return weeks;
}

export function weekdayOf(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}
