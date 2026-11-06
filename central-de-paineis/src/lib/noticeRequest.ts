import { t } from "../i18n";
import type { AbsenceReason, NoticeDraft } from "../types";
import { arrivalAfterError, DETAILS_MAX_LENGTH, endDateError, futureDateError } from "./attendance";
import { addDays, daysInMonth, weekdayIndex } from "./calendar";
import { toIsoDate } from "./holidays";
import { normalizeName, plainText } from "./validation";

export type NoticeParse =
  | { kind: "ready"; draft: NoticeDraft }
  | { kind: "missing"; question: string }
  | { kind: "invalid"; message: string };

const NOTICE_INTENT =
  /\b(falt(a|ar|arei|aria|ei|o|ando)\b|atras|ausen|chego\b|vou chegar\b|cheg\w* (mais )?tarde\b|nao (vou|irei|posso|poderei|vou poder) (ir|trabalhar|comparecer|aparecer)\b)/;

const NOT_A_NOTICE = /\b(quanto falta|faltam? \d)/;

export const asksForNotice = (plain: string): boolean => NOTICE_INTENT.test(plain) && !NOT_A_NOTICE.test(plain);

const LATE = /\b(atras\w*|chego|chegar|chegada|entro|entrar)\b/;

const REASON_HINTS: [AbsenceReason, RegExp][] = [
  ["familia", /\b(filh|familia|mae|pai|espos|marido|crianca|escola|creche|luto|velorio|enterro|avo|irma|dependente|bebe)/],
  ["saude", /\b(medic|consulta|exame|dentist|hospital|clinica|doen|atestado|saude|febre|gripe|cirurgia|vacina|terapia|fisioterap)/],
  ["transporte", /\b(transito|onibus|metro|trem|carro|pneu|uber|transporte|greve|engarrafamento|alagamento|enchente|voo)/],
  ["pessoal", /\b(banco|cartorio|documento|detran|pessoal|mudanca|audiencia|forum|receita|passaporte|prova|vestibular)/],
];

const reasonOf = (plain: string): AbsenceReason =>
  REASON_HINTS.find(([, hint]) => hint.test(plain))?.[0] ?? "outro";

const WEEKDAY_NAMES = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

const DATE_TOKEN = new RegExp(
  [
    "\\b(depois de amanha|anteontem|amanha|ontem|hoje)\\b",
    `\\b(${WEEKDAY_NAMES.join("|")})(?:[- ]feira)?\\b`,
    "\\b(\\d{1,2})/(\\d{1,2})(?:/(\\d{4}|\\d{2}))?\\b",
    "\\bdia (\\d{1,2})\\b(?!/)",
  ].join("|"),
  "g",
);

const RELATIVE_DAYS: Record<string, number> = {
  anteontem: -2,
  ontem: -1,
  hoje: 0,
  amanha: 1,
  "depois de amanha": 2,
};

function validDay(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return toIsoDate(year, month, day);
}

function readDates(plain: string, today: string): { dates: string[]; bad: string | null } {
  const dates: string[] = [];
  const [year, month, day] = today.split("-").map(Number);

  for (const match of plain.matchAll(DATE_TOKEN)) {
    const [token, relative, weekday, slashDay, slashMonth, slashYear, dayOfMonth] = match;
    let iso: string | null = null;

    if (relative) {
      iso = addDays(today, RELATIVE_DAYS[relative]);
    } else if (weekday) {
      const base = dates.length > 0 ? dates[dates.length - 1] : today;
      const ahead = (WEEKDAY_NAMES.indexOf(weekday) - weekdayIndex(base) + 7) % 7;
      iso = addDays(base, ahead === 0 ? 7 : ahead);
    } else if (slashDay) {
      const fullYear = slashYear ? (slashYear.length === 2 ? 2000 + Number(slashYear) : Number(slashYear)) : year;
      iso = validDay(fullYear, Number(slashMonth), Number(slashDay));
      if (iso && !slashYear && iso < today) iso = validDay(year + 1, Number(slashMonth), Number(slashDay));
    } else if (dayOfMonth) {
      const wanted = Number(dayOfMonth);
      iso = wanted >= day ? validDay(year, month, wanted) : null;
      if (!iso) iso = validDay(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1, wanted);
    }

    if (!iso) return { dates, bad: token };
    dates.push(iso);
  }

  return { dates, bad: null };
}

const TIME_TOKEN = /\b(\d{1,2})(?::(\d{2})|h(\d{2})?)|\b(?:as|das)\s+(\d{1,2})\b(?![/:\dh])|\b(meio[- ]dia)\b/g;

const AFTERNOON = /^\s*(da|de) (tarde|noite)\b/;

const DURATION_AFTER = /^\s*(de atraso|atrasad)/;
const DURATION_BEFORE = /(atraso de|atrasar|atrasad[oa]|uns|umas|cerca de|mais ou menos)\s*$/;

function readTimes(plain: string): { times: string[]; bad: string | null } {
  const times: string[] = [];

  for (const match of plain.matchAll(TIME_TOKEN)) {
    const [token, hourText, colonMinutes, hMinutes, bareHour, noon] = match;
    let hour = noon ? 12 : Number(hourText ?? bareHour);
    const minutes = Number(colonMinutes ?? hMinutes ?? 0);

    const start = match.index ?? 0;
    const before = plain.slice(0, start);
    const after = plain.slice(start + token.length);
    if (DURATION_AFTER.test(after) || DURATION_BEFORE.test(before)) continue;
    if (hour < 12 && AFTERNOON.test(after)) hour += 12;

    if (hour > 23 || minutes > 59) return { times, bad: token };
    times.push(`${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
  }

  return { times, bad: null };
}

export function parseNoticeRequest(text: string, today: string): NoticeParse {
  const plain = plainText(text);

  const { dates, bad: badDate } = readDates(plain, today);
  if (badDate) return { kind: "invalid", message: t("ai.bad.date", { token: badDate }) };

  const { times, bad: badTime } = readTimes(plain);
  if (badTime) return { kind: "invalid", message: t("ai.bad.time", { token: badTime }) };

  const late = LATE.test(plain) || times.length >= 2;

  if (dates.length === 0) return { kind: "missing", question: t("ai.ask.day") };
  if (late && times.length === 0) return { kind: "missing", question: t("ai.ask.time") };

  const startDate = dates[0];
  const endDate = late ? startDate : (dates[1] ?? startDate);

  const [startTime, expectedTime] =
    times.length >= 2 ? [...times.slice(0, 2)].sort() : ["", times[0] ?? ""];

  const problem =
    futureDateError(startDate, today) ??
    (late ? arrivalAfterError(startTime, expectedTime) : endDateError(startDate, endDate));
  if (problem) return { kind: "invalid", message: problem };

  return {
    kind: "ready",
    draft: {
      type: late ? "atraso" : "falta",
      startDate,
      endDate,
      startTime: late ? startTime : "",
      expectedTime: late ? expectedTime : "",
      reason: reasonOf(plain),
      details: normalizeName(text).slice(0, DETAILS_MAX_LENGTH),
    },
  };
}
