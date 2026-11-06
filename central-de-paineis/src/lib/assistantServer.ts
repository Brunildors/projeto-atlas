import { getLang, t, type MessageKey } from "../i18n";
import type { Session } from "../types";
import { isObject } from "./records";

const AGENT_URL = (import.meta.env.VITE_ASSISTENTE_URL ?? "").trim();

// o gemini às vezes demora bastante pra responder, por isso 3 minutos
const TIMEOUT_MS = 180_000;

export class AssistantError extends Error {}

export const serverConfigured = (): boolean => AGENT_URL !== "";

const STATUS_MESSAGE: Record<number, MessageKey> = {
  400: "ai.srv.400",
  401: "ai.srv.401",
  429: "ai.srv.429",
  503: "ai.srv.503",
};

// o chat mostra texto puro, então tira o markdown que o modelo insiste em mandar
function plainReply(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}[ \t]+/gm, "")
    .replace(/^[ \t]*[-*][ \t]+/gm, "• ")
    .trim();
}

export async function askServer(session: Session, question: string, conversationId: string): Promise<string> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ mensagem: question, conversaId: conversationId, idioma: getLang() }),
      signal: controller.signal,
    });
  } catch {
    throw new AssistantError(
      controller.signal.aborted ? t("ai.srv.timeout") : t("ai.srv.network"),
    );
  } finally {
    window.clearTimeout(timer);
  }

  if (!response.ok) {
    throw new AssistantError(
      response.status in STATUS_MESSAGE
        ? t(STATUS_MESSAGE[response.status])
        : t("ai.srv.http", { status: String(response.status) }),
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  const text = isObject(data) && typeof data.resposta === "string" ? plainReply(data.resposta) : "";
  if (text === "") throw new AssistantError(t("ai.srv.empty"));
  return text;
}
