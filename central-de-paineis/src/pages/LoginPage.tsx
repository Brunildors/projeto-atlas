import { useState } from "react";
import { Brand } from "../components/Brand";
import { DocTypeSwitch, DocumentInput } from "../components/DocumentField";
import { FormField } from "../components/FormField";
import { LanguagePicker } from "../components/LanguagePicker";
import { PasswordField } from "../components/PasswordField";
import { PhoneVerification } from "../components/PhoneVerification";
import { useTouched } from "../components/useTouched";
import { t } from "../i18n";
import { AuthError, signIn, type PendingVerification, type SignedIn } from "../lib/auth";
import { DOC_LABEL, documentError, normalizeDocument, passwordError } from "../lib/validation";
import type { DocType, DocumentDraft, LoginField } from "../types";

// excessão só pro login admin do time, esse cpf não passa na validação normal
const ADMIN_CPF = "11111111111";

const loginDocumentError = (type: DocType, value: string): string | null =>
  type === "cpf" && normalizeDocument(value) === ADMIN_CPF ? null : documentError(type, value);

interface LoginPageProps {
  onSignIn: (signedIn: SignedIn) => void;
  onShowSignup: (draft?: DocumentDraft) => void;
}

export function LoginPage({ onSignIn, onShowSignup }: LoginPageProps) {
  const [docType, setDocType] = useState<DocType>("cpf");
  const [docValue, setDocValue] = useState("");
  const [password, setPassword] = useState("");
  const form = useTouched<LoginField>();

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [verification, setVerification] = useState<PendingVerification | null>(null);

  const errors: Record<LoginField, string | null> = {
    document: loginDocumentError(docType, docValue),
    password: passwordError(password),
  };

  function changeDocType(type: DocType) {
    setDocType(type);
    setDocValue("");
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    form.submit();
    setFormError(null);
    if (errors.document || errors.password) return;

    setPending(true);
    try {
      const result = await signIn(docValue, password);
      if (result.kind === "signedIn") {
        onSignIn(result.signedIn);
        return;
      }
      setVerification(result.pending);
    } catch (failure) {
      setFormError(failure instanceof AuthError ? failure.message : t("auth.login.failed"));
    }
    setPending(false);
  }

  return (
    <main className="login">
      <div className="login-card">
        <header className="login-head login-head--brand">
          <Brand variant="login" />
          <h1 className="sr-only">{t("auth.appName")}</h1>
        </header>
        {verification ? (
          <PhoneVerification pending={verification} onSignedIn={onSignIn} onBack={() => setVerification(null)} />
        ) : (
          <>
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <FormField id="login-documento" label={DOC_LABEL[docType]} error={form.shown("document", errors.document)}>
                {(control) => (
                  <DocumentInput
                    control={control}
                    type={docType}
                    value={docValue}
                    onChange={setDocValue}
                    onBlur={() => form.touch("document")}
                  />
                )}
              </FormField>
              <DocTypeSwitch id="login-tipo-documento" value={docType} onChange={changeDocType} />

              <PasswordField
                id="login-senha"
                value={password}
                error={form.shown("password", errors.password)}
                autoComplete="current-password"
                placeholder={t("auth.login.passwordPlaceholder")}
                showRules={false}
                onChange={setPassword}
                onBlur={() => form.touch("password")}
              />

              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}

              <button type="submit" className="btn btn--primary login-submit" disabled={pending}>
                {pending ? t("auth.login.submitting") : t("auth.login.submit")}
              </button>
            </form>
            <p className="login-alt">
              {t("auth.login.firstAccess")}{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => onShowSignup(docValue ? { docType, value: docValue } : undefined)}
              >
                {t("auth.login.createAccount")}
              </button>
            </p>
          </>
        )}
        <div className="login-lang">
          <LanguagePicker variant="login" />
        </div>
      </div>
    </main>
  );
}
