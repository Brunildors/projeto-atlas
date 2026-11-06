import { t, tn } from "../i18n";
import type {
  AbsenceNotice,
  AssistantReply,
  ChatMessage,
  ChatRole,
  Conversation,
  NoticeDraft,
  NoticeRequest,
  Session,
} from "../types";
import {
  absenceReasonLabel,
  absenceTypeLabel,
  createNotice,
  formatLatePeriod,
  isNoticeDraft,
  listNotices,
  requestStatusLabel,
  saveNotice,
} from "./attendance";
import { askServer, serverConfigured } from "./assistantServer";
import { readSession } from "./auth";
import { addDays, daysBetween, todayIso } from "./calendar";
import { findCity, placeLabel, preferredCityId } from "./cities";
import { findEmployee } from "./employees";
import { formatIsoDate, formatIsoDateLong } from "./format";
import { holidaysInRange } from "./holidays";
import { asksForNotice, parseNoticeRequest } from "./noticeRequest";
import { isOverdue, listProjects, projectStatusLabel } from "./projects";
import { createRecordStore, isObject, newId } from "./records";
import { normalizeName, plainText } from "./validation";

const REQUEST_STATES: NoticeRequest["state"][] = ["asking", "pending", "sent", "dropped"];

function isNoticeRequest(value: unknown): value is NoticeRequest {
  return (
    isObject(value) &&
    typeof value.text === "string" &&
    REQUEST_STATES.includes(value.state as NoticeRequest["state"]) &&
    (value.draft === undefined || isNoticeDraft(value.draft))
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    (value.role === "user" || value.role === "assistant") &&
    typeof value.text === "string" &&
    typeof value.createdAt === "string" &&
    (value.request === undefined || isNoticeRequest(value.request))
  );
}

function isConversation(value: unknown): value is Conversation {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.document === "string" &&
    typeof value.title === "string" &&
    Array.isArray(value.messages) &&
    value.messages.every(isChatMessage) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

const store = createRecordStore<Conversation>("conversas-ia", isConversation);

export const saveConversation = store.save;
export const removeConversation = store.remove;

export function listConversations(document: string): Conversation[] {
  return store.listFor(document).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const findConversation = (document: string, id: string): Conversation | undefined =>
  store.listFor(document).find((conversation) => conversation.id === id);

export const MESSAGE_MAX_LENGTH = 500;

const TITLE_MAX_LENGTH = 48;

export function createMessage(role: ChatRole, text: string): ChatMessage {
  return { id: newId(), role, text: text.trim(), createdAt: new Date().toISOString() };
}

export function startConversation(document: string, first: ChatMessage): Conversation {
  const text = normalizeName(first.text);
  const title =
    text.length > TITLE_MAX_LENGTH ? `${text.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…` : text;

  return {
    id: newId(),
    document,
    title,
    messages: [first],
    createdAt: first.createdAt,
    updatedAt: first.createdAt,
  };
}

export const appendMessage = (conversation: Conversation, message: ChatMessage): Conversation => ({
  ...conversation,
  messages: [...conversation.messages, message],
  updatedAt: message.createdAt,
});

export function appendReply(conversation: Conversation, reply: AssistantReply): Conversation {
  const replaces = reply.request?.state === "pending";
  const messages = replaces
    ? conversation.messages.map((message) =>
        message.request?.state === "pending"
          ? { ...message, request: { ...message.request, state: "dropped" as const } }
          : message,
      )
    : conversation.messages;

  return appendMessage({ ...conversation, messages }, { ...createMessage("assistant", reply.text), request: reply.request });
}

export function firstNameOf(session: Session): string {
  const name = session.socialName || session.fullName || "";
  return name.split(" ")[0];
}

// o sim/não vale nos 7 idiomas. chinês e japonês ficam separados porque o \b não
// funciona nessas escritas, e "ja", "si", "no" só contam sozinhos ("no dia 15" não é resposta)
const YES = /^(sim|s|pode|confirm|isso|ok|certo|correto|claro|perfeito|registr|manda|beleza|blz|yes|yep|sure|vale|oui|jawohl)\b/;
const YES_ALONE = /^(ja|si|y)[.!]*$/;
const YES_CJK = /^(はい|ええ|確定|確認|是|好|对|确认)/;
const NO = /^(nao|n|cancel|deixa|esquece|desist|pare|nope|nein|abbrechen|annuler)\b/;
const NO_ALONE = /^(no|non)[.!]*$/;
const NO_CJK = /^(いいえ|キャンセル|取り消し|不|否|取消)/;

export function readConfirmation(text: string): boolean | null {
  const plain = plainText(text);
  if (YES.test(plain) || YES_ALONE.test(plain) || YES_CJK.test(plain)) return true;
  if (NO.test(plain) || NO_ALONE.test(plain) || NO_CJK.test(plain)) return false;
  return null;
}

export function resolveNotice(
  conversation: Conversation,
  messageId: string,
  accepted: boolean,
): Conversation | null {
  const target = conversation.messages.find((message) => message.id === messageId);
  const request = target?.request;
  if (!request?.draft || request.state !== "pending") return conversation;

  if (accepted && !saveNotice(createNotice(conversation.document, request.draft))) return null;

  const messages = conversation.messages.map((message) =>
    message.id === messageId
      ? { ...message, request: { ...request, state: accepted ? ("sent" as const) : ("dropped" as const) } }
      : message,
  );

  const text = accepted ? t("ai.reply.saved") : t("ai.reply.dropped");

  return appendMessage({ ...conversation, messages }, createMessage("assistant", text));
}

const topics = (): string =>
  [t("ai.topics.projects"), t("ai.topics.holidays"), t("ai.topics.notices"), t("ai.topics.profile")].join("\n");

const ITEMS_LISTED = 5;

interface Context {
  session: Session;
  today: string;
}

function projectsAnswer({ session, today }: Context): string {
  const open = listProjects(session.document).filter((project) => project.status !== "concluida");
  if (open.length === 0) return t("ai.projects.none");

  open.sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"));

  const overdue = open.filter((project) => isOverdue(project, today)).length;
  const openText = tn("ai.projects.open", open.length);
  const head =
    overdue > 0
      ? t("ai.projects.headOverdue", { open: openText, overdue: tn("ai.projects.overdue", overdue) })
      : t("ai.projects.head", { open: openText });

  const lines = open.slice(0, ITEMS_LISTED).map((project) => {
    const due = !project.dueDate
      ? t("ai.projects.noDue")
      : t(isOverdue(project, today) ? "ai.projects.overdueOn" : "ai.projects.dueOn", {
          date: formatIsoDate(project.dueDate),
        });
    return `• ${project.title} — ${projectStatusLabel(project.status).toLocaleLowerCase()}, ${due}`;
  });

  const rest = open.length > ITEMS_LISTED ? `\n\n${t("ai.projects.more", { n: open.length - ITEMS_LISTED })}` : "";
  return `${head}\n\n${lines.join("\n")}${rest}`;
}

function holidaysAnswer({ session, today }: Context): string {
  const city = findCity(preferredCityId(findEmployee(session.document)?.address));
  const upcoming = holidaysInRange(city.id, { start: today, end: addDays(today, 366) })
    .filter((holiday) => holiday.kind === "feriado")
    .slice(0, 3);

  if (upcoming.length === 0) return t("ai.holidays.none", { city: city.name });

  const lines = upcoming.map((holiday) => `• ${holiday.name}: ${formatIsoDateLong(holiday.date)}`);
  return `${t("ai.holidays.head", { place: placeLabel(city) })}\n\n${lines.join("\n")}\n\n${t("ai.holidays.foot")}`;
}

function describeWhen(notice: Pick<AbsenceNotice, "type" | "startDate" | "endDate" | "startTime" | "expectedTime">): string {
  if (notice.type === "atraso") {
    return `${formatIsoDateLong(notice.startDate)}, ${formatLatePeriod(notice.startTime, notice.expectedTime)}`;
  }
  if (notice.startDate === notice.endDate) return formatIsoDateLong(notice.startDate);

  return t("ai.when.range", {
    start: formatIsoDate(notice.startDate),
    end: formatIsoDate(notice.endDate),
    days: tn("cal.days", daysBetween(notice.startDate, notice.endDate)),
  });
}

function describeDraft(draft: NoticeDraft): string {
  return [
    t("ai.draft.type", { value: absenceTypeLabel(draft.type) }),
    t("ai.draft.when", { value: describeWhen(draft) }),
    t("ai.draft.reason", { value: absenceReasonLabel(draft.reason) }),
  ].join("\n");
}

function noticeAnswer(requestText: string, { today }: Context): AssistantReply {
  const parsed = parseNoticeRequest(requestText, today);

  if (parsed.kind === "missing") {
    return { text: parsed.question, request: { text: requestText, state: "asking" } };
  }
  if (parsed.kind === "invalid") {
    return { text: `${parsed.message}\n\n${t("ai.notice.retry")}` };
  }

  return {
    text: `${t("ai.notice.check")}\n\n${describeDraft(parsed.draft)}\n\n${t("ai.notice.ask")}`,
    request: { text: requestText, state: "pending", draft: parsed.draft },
  };
}

function myNoticesAnswer({ session }: Context): string {
  const notices = listNotices(session.document);
  if (notices.length === 0) return t("ai.mine.none");

  const lines = notices
    .slice(0, ITEMS_LISTED)
    .map(
      (notice) =>
        `• ${absenceTypeLabel(notice.type)} — ${describeWhen(notice)} · ${requestStatusLabel(notice.status)}`,
    );
  const rest = notices.length > ITEMS_LISTED ? `\n\n${t("ai.mine.more", { n: notices.length - ITEMS_LISTED })}` : "";
  return `${t("ai.mine.head")}\n\n${lines.join("\n")}${rest}`;
}

function greetingAnswer({ session }: Context): string {
  const name = firstNameOf(session);
  return `${name ? t("ai.greeting.named", { name }) : t("ai.greeting")}\n\n${topics()}`;
}

const INTENTS: { test: RegExp; answer: (context: Context) => string }[] = [
  { test: /\b(projeto|tarefa|pendencia|prazo)/, answer: projectsAnswer },
  { test: /\b(feriado|facultativo|folga|recesso)/, answer: holidaysAnswer },
  { test: /\b(meus avisos|minhas faltas|meus atrasos|avisos enviados|meus pedidos)/, answer: myNoticesAnswer },
  {
    test: /\b(perfil|cadastro|meus dados|endereco|telefone)/,
    answer: () => t("ai.profile"),
  },
  { test: /\b(que dia|data de hoje)/, answer: ({ today }) => t("ai.today", { date: formatIsoDateLong(today) }) },
  {
    test: /\b(ajuda|o que (voce|vc) (sabe|faz|pode)|quem e voce|como (voce|vc) funciona)/,
    answer: () => `${t("ai.help")}\n\n${topics()}`,
  },
  {
    test: /\b(obrigad|valeu|agradeco)/,
    answer: () => t("ai.thanks"),
  },
  { test: /^(oi|ola|opa|bom dia|boa tarde|boa noite|e ai|hey)\b/, answer: greetingAnswer },
];

const BEFORE_NOTICE = 3;

const fallback = (): string => `${t("ai.fallback")}\n\n${topics()}`;

const MY_NOTICES = INTENTS.find((intent) => intent.answer === myNoticesAnswer) ?? INTENTS[BEFORE_NOTICE - 1];

const LOCAL_DELAY_MS = 450; // só pro "escrevendo…" não piscar na tela

const localDelay = (): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, LOCAL_DELAY_MS));

function noticeReply(history: ChatMessage[], context: Context): AssistantReply | null {
  const last = history[history.length - 1];
  const question = plainText(last?.text ?? "");

  const previous = history[history.length - 2];
  const asking = previous?.request?.state === "asking" ? previous.request : null;

  if (asking && !INTENTS.some((intent) => intent.test.test(question))) {
    if (readConfirmation(last.text) === false) return { text: t("ai.reply.droppedShort") };

    const alone = asksForNotice(question) && parseNoticeRequest(last.text, context.today).kind === "ready";
    return noticeAnswer(alone ? last.text : `${asking.text} ${last.text}`, context);
  }

  if (MY_NOTICES.test.test(question)) return { text: MY_NOTICES.answer(context) };

  if (INTENTS.slice(0, BEFORE_NOTICE).some((intent) => intent.test.test(question))) return null;

  return asksForNotice(question) ? noticeAnswer(last.text, context) : null;
}

function localAnswer(question: string, context: Context): string {
  const intent = INTENTS.find((item) => item.test.test(question));
  return intent ? intent.answer(context) : fallback();
}

// aviso de falta/atraso é resolvido aqui no app mesmo. o resto vai pro agente no n8n,
// e se o VITE_ASSISTENTE_URL estiver vazio responde só com o que dá pra saber localmente
export async function askAssistant(history: ChatMessage[], conversationId: string): Promise<AssistantReply> {
  const session = readSession();
  if (!session) return { text: t("ai.sessionEnded") };

  const context: Context = { session, today: todayIso() };
  const last = history[history.length - 1];

  const notice = noticeReply(history, context);
  if (notice) {
    await localDelay();
    return notice;
  }

  if (serverConfigured()) return { text: await askServer(session, last.text, conversationId) };

  await localDelay();
  return { text: localAnswer(plainText(last?.text ?? ""), context) };
}
