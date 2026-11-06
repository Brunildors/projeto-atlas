import { useState } from "react";
import { t } from "../i18n";
import { checkPassword, PASSWORD_MIN_LENGTH } from "../lib/validation";

const passwordRules = () =>
  [
    { key: "length", label: t("auth.password.ruleLength", { n: PASSWORD_MIN_LENGTH }) },
    { key: "uppercase", label: t("auth.password.ruleUpper") },
    { key: "special", label: t("auth.password.ruleSpecial") },
  ] as const;

interface PasswordFieldProps {
  id: string;
  value: string;
  error: string | null;
  autoComplete: "current-password" | "new-password";
  placeholder: string;
  showRules?: boolean; // a entrada esconde a lista, quem entra já criou a senha no cadastro
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function PasswordField({
  id,
  value,
  error,
  autoComplete,
  placeholder,
  showRules = true,
  onChange,
  onBlur,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const checks = checkPassword(value);

  const rulesId = showRules ? `${id}-regras` : undefined;
  const errorId = `${id}-erro`;
  const describedBy = [rulesId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div className="field">
      <label htmlFor={id}>{t("auth.password.label")}</label>
      <div className="input-wrap">
        <input
          id={id}
          className="input"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="input-action"
          aria-pressed={visible}
          aria-label={t(visible ? "auth.password.hide" : "auth.password.show")}
          title={t(visible ? "auth.password.hide" : "auth.password.show")}
          onClick={() => setVisible((current) => !current)}
        >
          <span aria-hidden="true">{visible ? "◡" : "◉"}</span>
        </button>
      </div>
      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}

      {showRules && (
        <ul className="rules" id={rulesId}>
          {passwordRules().map((rule) => {
            const ok = checks[rule.key];

            return (
              <li key={rule.key} className={ok ? "rule is-ok" : "rule"}>
                <span className="rule-mark" aria-hidden="true">
                  {ok ? "✓" : "○"}
                </span>
                {rule.label}
                <span className="sr-only">{t(ok ? "auth.password.done" : "auth.password.pending")}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
