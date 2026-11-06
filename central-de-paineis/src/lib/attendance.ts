import { t } from "../i18n";
import type { AbsenceNotice, AbsenceReason, AbsenceType, NoticeDraft, RequestStatus } from "../types";
import { daysBetween } from "./calendar";
import { createRecordStore, isObject, newId } from "./records";

export const absenceTypeLabel = (type: AbsenceType): string => t(`absence.${type}`);

export const ABSENCE_REASONS: AbsenceReason[] = ["saude", "familia", "transporte", "pessoal", "outro"];

export const absenceReasonLabel = (reason: AbsenceReason): string => t(`absence.reason.${reason}`);

const REQUEST_STATUSES: RequestStatus[] = ["analise", "aprovada", "recusada", "cancelada"];

export const requestStatusLabel = (status: RequestStatus): string => t(`absence.status.${status}`);

const isType = (value: unknown): value is AbsenceType => value === "falta" || value === "atraso";
const isReason = (value: unknown): value is AbsenceReason =>
  ABSENCE_REASONS.includes(value as AbsenceReason);
const isStatus = (value: unknown): value is RequestStatus => REQUEST_STATUSES.includes(value as RequestStatus);

function isNotice(value: unknown): value is AbsenceNotice {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.document === "string" &&
    isType(value.type) &&
    typeof value.startDate === "string" &&
    typeof value.endDate === "string" &&
    typeof value.startTime === "string" &&
    typeof value.expectedTime === "string" &&
    isReason(value.reason) &&
    typeof value.details === "string" &&
    isStatus(value.status) &&
    typeof value.createdAt === "string"
  );
}

export function isNoticeDraft(value: unknown): value is NoticeDraft {
  return (
    isObject(value) &&
    isType(value.type) &&
    typeof value.startDate === "string" &&
    typeof value.endDate === "string" &&
    typeof value.startTime === "string" &&
    typeof value.expectedTime === "string" &&
    isReason(value.reason) &&
    typeof value.details === "string"
  );
}

const notices = createRecordStore<AbsenceNotice>("avisos", isNotice, (value) => ({
  startTime: "",
  ...value,
}));

export const listNotices = notices.listFor;
export const listAllNotices = notices.listAll;
export const saveNotice = notices.save;

export function createNotice(document: string, draft: NoticeDraft): AbsenceNotice {
  const isLate = draft.type === "atraso";

  return {
    ...draft,
    id: newId(),
    document,
    endDate: isLate || draft.endDate === "" ? draft.startDate : draft.endDate,
    startTime: isLate ? draft.startTime : "",
    expectedTime: isLate ? draft.expectedTime : "",
    details: draft.details.trim(),
    status: "analise",
    createdAt: new Date().toISOString(),
  };
}

export const NOTICE_MAX_DAYS = 30;

export const DETAILS_MAX_LENGTH = 500;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function futureDateError(value: string, today: string): string | null {
  return value < today ? t("absence.err.past") : null;
}

export function endDateError(start: string, end: string): string | null {
  if (end === "") return null;
  if (end < start) return t("absence.err.endBefore");
  if (daysBetween(start, end) > NOTICE_MAX_DAYS) return t("absence.err.tooLong", { n: NOTICE_MAX_DAYS });
  return null;
}

export function arrivalAfterError(start: string, arrival: string): string | null {
  if (!TIME.test(arrival)) return t("absence.err.time");
  if (TIME.test(start) && arrival <= start) return t("absence.err.arrival");
  return null;
}

export function minutesBetween(from: string, to: string): number {
  const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  return toMinutes(to) - toMinutes(from);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, "0")}`;
}

export function formatLatePeriod(startTime: string, arrival: string): string {
  if (startTime === "") return t("absence.arrivalOnly", { time: arrival });
  return t("absence.lateWindow", { from: startTime, to: arrival, duration: formatDuration(minutesBetween(startTime, arrival)) });
}
