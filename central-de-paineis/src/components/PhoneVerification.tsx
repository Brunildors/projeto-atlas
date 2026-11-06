import { useEffect, useId, useRef, useState } from "react";
import { t } from "../i18n";
import { AuthError, resendCode, verifyPhone, type PendingVerification, type SignedIn } from "../lib/auth";
import { Icon } from "./Icon";

const RESEND_SECONDS = 60;

const CODE_LENGTH = 6;

// por enquanto o sms é de mentira: o n8n devolve o código e a gente mostra aqui
// TODO: ligar um provedor de verdade (twilio ou zenvia) e tirar esse aviso
function SimulatedSms({ code, onUse, onDismiss }: { code: string; onUse: () => void; onDismiss: () => void }) {
  return (
    <aside className="sms-toast" role="status" aria-live="polite" aria-label={t("sms.simulated")}>
      <div className="sms-toast-head">
        <span className="sms-toast-app">
          <Icon name="phone" size={14} />
          {t("sms.simulated")}
        </span>
        <span className="sms-toast-time">{t("sms.now")}</span>
        <button type="button" className="sms-toast-close" aria-label={t("sms.dismiss")} onClick={onDismiss}>
          <Icon name="close" size={12} />
        </button>
      </div>
      <p className="sms-toast-text">{t("sms.message", { code })}</p>
      <p className="sms-toast-note">{t("sms.simulatedNote")}</p>
      <button type="button" className="btn btn--primary sms-toast-use" onClick={onUse}>
        {t("sms.useCode")}
      </button>
    </aside>
  );
}

export function PhoneVerification({
  pending: initial,
  onSignedIn,
  onBack,
}: {
  pending: PendingVerification;
  onSignedIn: (signedIn: SignedIn) => void;
  onBack: () => void;
}) {
  const [pending, setPending] = useState(initial);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [smsVisible, setSmsVisible] = useState(initial.sms !== null);
  const [wait, setWait] = useState(initial.sms ? RESEND_SECONDS : initial.resendInSeconds);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  useEffect(() => inputRef.current?.focus(), []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)) {
      setError(t("sms.codeFormat"));
      return;
    }
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      onSignedIn(await verifyPhone(pending.document, code));
    } catch (failure) {
      setError(failure instanceof AuthError ? failure.message : t("err.INVALIDO"));
      setSubmitting(false);
    }
  }

  async function resend() {
    setError(null);
    setNotice(null);
    try {
      const next = await resendCode(pending.document);
      setPending(next);
      setCode("");
      setSmsVisible(next.sms !== null);
      setWait(RESEND_SECONDS);
      setNotice(t("sms.resent"));
      inputRef.current?.focus();
    } catch (failure) {
      if (failure instanceof AuthError && failure.retryInSeconds) setWait(failure.retryInSeconds);
      setError(failure instanceof AuthError ? failure.message : t("err.INVALIDO"));
    }
  }

  return (
    <>
      <form className="login-form" onSubmit={submit} noValidate>
        <div className="sms-intro">
          <span className="sms-intro-icon" aria-hidden="true">
            <Icon name="phone" size={22} />
          </span>
          <div>
            <h2 className="sms-title">{t("sms.title")}</h2>
            <p className="sms-text">
              {pending.sms
                ? t("sms.intro", { phone: pending.phone, min: pending.validMinutes })
                : t("sms.introNoCode", { phone: pending.phone })}
            </p>
          </div>
        </div>
        <div className="field">
          <label htmlFor={id}>{t("sms.code")}</label>
          <input
            ref={inputRef}
            id={id}
            className="input sms-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            placeholder="000000"
            value={code}
            aria-invalid={error ? true : undefined}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
          />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {notice && !error && (
          <p className="form-ok" role="status">
            {notice}
          </p>
        )}

        <button type="submit" className="btn btn--primary login-submit" disabled={submitting}>
          {submitting ? t("sms.submitting") : t("sms.submit")}
        </button>
        <div className="sms-actions">
          <button type="button" className="link-btn" onClick={onBack}>
            {t("sms.back")}
          </button>
          <button type="button" className="link-btn" disabled={wait > 0} onClick={() => void resend()}>
            {wait > 0 ? t("sms.resendIn", { s: wait }) : t("sms.resend")}
          </button>
        </div>
      </form>
      {smsVisible && pending.sms && (
        <SimulatedSms
          code={pending.sms.code}
          onUse={() => {
            setCode(pending.sms?.code ?? "");
            inputRef.current?.focus();
          }}
          onDismiss={() => setSmsVisible(false)}
        />
      )}
    </>
  );
}
