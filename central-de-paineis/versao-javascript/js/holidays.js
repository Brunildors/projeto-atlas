export const MIN_YEAR = 1583;

export const MAX_YEAR = 9999;

export const toIsoDate = (year, month, day) =>
  [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");

const DAY_IN_MS = 86_400_000;

function shiftIsoDate(year, month, day, offset) {
  const shifted = new Date(Date.UTC(year, month - 1, day) + offset * DAY_IN_MS);

  return toIsoDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

export function easterSunday(year) {
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

const FIXED_DATES = [
  { month: 1, day: 1, name: "Confraternização Universal", kind: "feriado", scope: "nacional" },
  { month: 4, day: 21, name: "Tiradentes", kind: "feriado", scope: "nacional" },
  { month: 5, day: 1, name: "Dia do Trabalho", kind: "feriado", scope: "nacional" },
  { month: 9, day: 7, name: "Independência do Brasil", kind: "feriado", scope: "nacional" },
  {
    month: 10,
    day: 12,
    name: "Nossa Senhora Aparecida",
    kind: "feriado",
    scope: "nacional",
    since: 1980,
  },
  { month: 11, day: 2, name: "Finados", kind: "feriado", scope: "nacional" },
  { month: 11, day: 15, name: "Proclamação da República", kind: "feriado", scope: "nacional" },
  {
    month: 11,
    day: 20,
    name: "Dia Nacional de Zumbi e da Consciência Negra",
    kind: "feriado",
    scope: "nacional",
    since: 2024,
  },
  { month: 12, day: 25, name: "Natal", kind: "feriado", scope: "nacional" },

  {
    month: 7,
    day: 9,
    name: "Revolução Constitucionalista de 1932",
    kind: "feriado",
    scope: "estadual",
    note: "Data magna do estado de São Paulo",
  },

  {
    month: 1,
    day: 26,
    name: "Aniversário de Santos",
    kind: "feriado",
    scope: "municipal",
    note: "Fundação da cidade, em 1546",
  },
  {
    month: 9,
    day: 8,
    name: "Nossa Senhora do Monte Serrat",
    kind: "feriado",
    scope: "municipal",
    note: "Padroeira de Santos",
  },

  { month: 10, day: 28, name: "Dia do Servidor Público", kind: "facultativo", scope: "nacional" },
  {
    month: 12,
    day: 24,
    name: "Véspera de Natal",
    kind: "facultativo",
    scope: "nacional",
    note: "A partir das 14h",
  },
  {
    month: 12,
    day: 31,
    name: "Véspera de Ano-Novo",
    kind: "facultativo",
    scope: "nacional",
    note: "A partir das 14h",
  },
];

const MOVABLE_DATES = [
  { offset: -48, name: "Segunda-feira de Carnaval", kind: "facultativo", scope: "municipal" },
  { offset: -47, name: "Carnaval", kind: "facultativo", scope: "nacional" },
  {
    offset: -46,
    name: "Quarta-feira de Cinzas",
    kind: "facultativo",
    scope: "nacional",
    note: "Até as 14h",
  },
  { offset: -3, name: "Quinta-feira Santa", kind: "facultativo", scope: "municipal" },
  { offset: -2, name: "Sexta-feira Santa", kind: "feriado", scope: "nacional" },
  { offset: 0, name: "Domingo de Páscoa", kind: "feriado", scope: "nacional" },
  { offset: 60, name: "Corpus Christi", kind: "facultativo", scope: "nacional" },
];

const cache = new Map();

export function holidaysForYear(year) {
  if (year < MIN_YEAR || year > MAX_YEAR) return [];

  const cached = cache.get(year);
  if (cached) return cached;

  const fixed = FIXED_DATES.filter(
    (date) => date.since === undefined || year >= date.since,
  ).map(({ month, day, since, ...rest }) => ({ date: toIsoDate(year, month, day), ...rest }));

  const [easterYear, easterMonth, easterDay] = easterSunday(year).split("-").map(Number);

  const movable = MOVABLE_DATES.map(({ offset, ...rest }) => ({
    date: shiftIsoDate(easterYear, easterMonth, easterDay, offset),
    ...rest,
  }));

  const all = [...fixed, ...movable].sort((a, b) => a.date.localeCompare(b.date));

  cache.set(year, all);
  return all;
}

export function holidaysByDate(year) {
  const map = new Map();

  for (const holiday of holidaysForYear(year)) {
    const sameDay = map.get(holiday.date);

    if (sameDay) sameDay.push(holiday);
    else map.set(holiday.date, [holiday]);
  }

  return map;
}

export function nextHoliday(fromIso) {
  const year = Number(fromIso.slice(0, 4));

  for (const candidateYear of [year, year + 1]) {
    const found = holidaysForYear(candidateYear).find(
      (holiday) => holiday.kind === "feriado" && holiday.date >= fromIso,
    );

    if (found) return found;
  }

  return null;
}
