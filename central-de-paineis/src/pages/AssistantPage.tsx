import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { t } from "../i18n";
import {
  appendMessage,
  appendReply,
  askAssistant,
  createMessage,
  findConversation,
  firstNameOf,
  listConversations,
  MESSAGE_MAX_LENGTH,
  readConfirmation,
  removeConversation,
  resolveNotice,
  saveConversation,
  startConversation,
} from "../lib/assistant";
import { AssistantError } from "../lib/assistantServer";
import { addDays, isoDateOf, todayIso } from "../lib/calendar";
import type { ChatMessage, Conversation, DashboardPageProps } from "../types";

const suggestions = (): string[] => [
  t("ai.suggest.1"),
  t("ai.suggest.2"),
  t("ai.suggest.3"),
  "Vou me atrasar amanhã, chego às 10h",
];

function NoticeActions({
  message,
  disabled,
  onDecide,
}: {
  message: ChatMessage;
  disabled: boolean;
  onDecide: (accepted: boolean) => void;
}) {
  const state = message.request?.draft ? message.request.state : null;

  if (state === "pending") {
    return (
      <div className="chat-notice" role="group" aria-label={t("ai.notice.group")}>
        <button type="button" className="btn btn--primary" disabled={disabled} onClick={() => onDecide(true)}>
          <Icon name="check" size={16} />
          {t("ai.notice.confirm")}
        </button>
        <button type="button" className="btn" disabled={disabled} onClick={() => onDecide(false)}>
          {t("ui.cancel")}
        </button>
      </div>
    );
  }

  if (state === "sent") {
    return (
      <p className="chat-notice-status is-sent">
        <Icon name="check" size={14} />
        {t("ai.notice.sent")}
      </p>
    );
  }

  if (state === "dropped") return <p className="chat-notice-status">{t("ai.notice.dropped")}</p>;

  return null;
}

interface HistoryGroup {
  label: string;
  items: Conversation[];
}

function groupByAge(conversations: Conversation[], today: string): HistoryGroup[] {
  const yesterday = addDays(today, -1);
  const weekStart = addDays(today, -6);
  const groups: HistoryGroup[] = [
    { label: t("ai.group.today"), items: [] },
    { label: t("ai.group.yesterday"), items: [] },
    { label: t("ai.group.week"), items: [] },
    { label: t("ai.group.older"), items: [] },
  ];

  for (const conversation of conversations) {
    const day = isoDateOf(new Date(conversation.updatedAt));
    const index = day >= today ? 0 : day === yesterday ? 1 : day >= weekStart ? 2 : 3;
    groups[index].items.push(conversation);
  }

  return groups.filter((group) => group.items.length > 0);
}

export function AssistantPage({ session }: DashboardPageProps) {
  const [conversations, setConversations] = useState(() => listConversations(session.document));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;
  const messages = active?.messages ?? [];
  const waiting = pendingId !== null && pendingId === activeId;
  const groups = useMemo(() => groupByAge(conversations, todayIso()), [conversations]);
  const name = firstNameOf(session);

  const reload = () => setConversations(listConversations(session.document));

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [activeId, messages.length, waiting]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [draft]);

  useEffect(() => {
    if (!historyOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHistoryOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [historyOpen]);

  async function send(text: string) {
    const question = text.trim();
    if (question === "" || pendingId !== null) return;

    const message = createMessage("user", question);
    const conversation = active
      ? appendMessage(active, message)
      : startConversation(session.document, message);

    const lastMessage = active?.messages[active.messages.length - 1];
    const answer = lastMessage?.request?.state === "pending" ? readConfirmation(question) : null;

    if (answer !== null && lastMessage) {
      setDraft("");
      decide(conversation, lastMessage.id, answer);
      inputRef.current?.focus();
      return;
    }

    if (!saveConversation(conversation)) {
      setError(t("ai.err.save"));
      return;
    }

    setError(null);
    setDraft("");
    setActiveId(conversation.id);
    setPendingId(conversation.id);
    reload();
    inputRef.current?.focus();

    try {
      const reply = await askAssistant(conversation.messages, conversation.id);
      const current = findConversation(session.document, conversation.id);
      if (current) saveConversation(appendReply(current, reply));
    } catch (failure) {
      setError(
        failure instanceof AssistantError
          ? failure.message
          : t("ai.err.generic"),
      );
    } finally {
      setPendingId(null);
      reload();
    }
  }

  function decide(conversation: Conversation, messageId: string, accepted: boolean) {
    const next = resolveNotice(conversation, messageId, accepted);

    if (!next || !saveConversation(next)) {
      setError(t("ai.err.saveNotice"));
      return;
    }

    setError(null);
    reload();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(draft);
    }
  }

  function openConversation(id: string) {
    setActiveId(id);
    setError(null);
    setHistoryOpen(false);
  }

  function newConversation() {
    setActiveId(null);
    setError(null);
    setHistoryOpen(false);
    inputRef.current?.focus();
  }

  function remove(conversation: Conversation) {
    if (!window.confirm(t("ai.confirm.remove", { title: conversation.title }))) return;
    removeConversation(conversation.id);
    if (conversation.id === activeId) setActiveId(null);
    reload();
  }

  return (
    <div className={historyOpen ? "assistant is-history-open" : "assistant"}>
      <aside className="chat-history" id="ia-historico" aria-label={t("ai.history.label")}>
        <div className="chat-history-head">
          <h2 className="chat-history-title">{t("ai.history.title")}</h2>
          <button
            type="button"
            className="chat-history-action chat-history-close"
            aria-label={t("ai.history.close")}
            title={t("ai.history.close")}
            onClick={() => setHistoryOpen(false)}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <button
          type="button"
          className="chat-new"
          aria-current={activeId === null ? "true" : undefined}
          onClick={newConversation}
        >
          <Icon name="plus" size={16} />
          {t("ai.new")}
        </button>
        <div className="chat-history-scroll">
          {groups.length === 0 ? (
            <p className="chat-history-empty">{t("ai.history.empty")}</p>
          ) : (
            groups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <h3 className="chat-history-group">{group.label}</h3>
                <ul className="chat-history-list">
                  {group.items.map((item) => (
                    <li key={item.id} className="chat-history-item">
                      <button
                        type="button"
                        className="chat-history-open"
                        aria-current={item.id === activeId ? "true" : undefined}
                        title={item.title}
                        onClick={() => openConversation(item.id)}
                      >
                        {item.title}
                      </button>
                      <button
                        type="button"
                        className="chat-history-delete"
                        aria-label={t("ai.deleteLabel", { title: item.title })}
                        title={t("ai.delete")}
                        onClick={() => remove(item)}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </aside>
      <section className="chat" aria-label={t("ai.chat.label")}>
        <div className="chat-bar">
          <button
            type="button"
            className="chat-history-action"
            aria-label={t("ai.history.label")}
            title={t("ai.history.label")}
            aria-expanded={historyOpen}
            aria-controls="ia-historico"
            onClick={() => setHistoryOpen(true)}
          >
            <Icon name="history" size={18} />
          </button>
          <button
            type="button"
            className="chat-history-action"
            aria-label={t("ai.new")}
            title={t("ai.new")}
            onClick={newConversation}
          >
            <Icon name="plus" size={18} />
          </button>
        </div>
        <div className="chat-log" ref={logRef} role="log" aria-label={t("ai.messages")}>
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <span className="chat-welcome-mark" aria-hidden="true">
                <Icon name="assistant" size={28} />
              </span>
              <h2>{name ? t("ai.welcome.named", { name }) : t("ai.welcome")}</h2>
              <p>{t("ai.welcome.text")}</p>
              <div className="chat-suggestions">
                {suggestions().map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="chat-suggestion"
                    disabled={pendingId !== null}
                    onClick={() => void send(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-thread">
              {messages.map((message) => (
                <div key={message.id} className={`chat-msg chat-msg--${message.role}`}>
                  {message.role === "assistant" && (
                    <span className="chat-avatar" aria-hidden="true">
                      <Icon name="assistant" size={16} />
                    </span>
                  )}
                  <div className="chat-msg-body">
                    <p className="chat-bubble">
                      <span className="sr-only">{message.role === "user" ? `${t("ai.you")} ` : "IPORT AI: "}</span>
                      {message.text}
                    </p>
                    {active && (
                      <NoticeActions
                        message={message}
                        disabled={pendingId !== null}
                        onDecide={(accepted) => decide(active, message.id, accepted)}
                      />
                    )}
                  </div>
                </div>
              ))}

              {waiting && (
                <div className="chat-msg chat-msg--assistant">
                  <span className="chat-avatar" aria-hidden="true">
                    <Icon name="assistant" size={16} />
                  </span>
                  <p className="chat-bubble chat-typing">
                    <span className="sr-only">{t("ai.typing")}</span>
                    <i aria-hidden="true" />
                    <i aria-hidden="true" />
                    <i aria-hidden="true" />
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="chat-foot">
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            <label className="sr-only" htmlFor="ia-mensagem">
              {t("ai.input.label")}
            </label>
            <textarea
              ref={inputRef}
              id="ia-mensagem"
              className="chat-input"
              rows={1}
              maxLength={MESSAGE_MAX_LENGTH}
              placeholder={t("ai.input.placeholder")}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="chat-send"
              aria-label={t("ai.send")}
              title={t("ai.send")}
              disabled={draft.trim() === "" || pendingId !== null}
            >
              <Icon name="send" />
            </button>
          </form>
          <p className="chat-hint">{t("ai.hint")}</p>
        </div>
      </section>
    </div>
  );
}
