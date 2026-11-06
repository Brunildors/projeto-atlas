import { useState } from "react";
import { Brand } from "../components/Brand";
import { DocTypeSwitch, DocumentInput } from "../components/DocumentField";
import { FormField } from "../components/FormField";
import { LanguagePicker } from "../components/LanguagePicker";
import { PasswordField } from "../components/PasswordField";
import { PhoneVerification } from "../components/PhoneVerification";
import { useTouched } from "../components/useTouched";
import { t } from "../i18n";
import { AuthError, signUp, type PendingVerification, type SignedIn } from "../lib/auth";
import { todayIso } from "../lib/calendar";
import { createEmployee } from "../lib/employees";
import { STATES } from "../lib/states";
import {
  addressNumberError,
  addressTextError,
  birthDateError,
  cepError,
  cityError,
  COMPLEMENT_MAX_LENGTH,
  complementError,
  DOC_LABEL,
  documentError,
  formatCep,
  formatPhone,
  fullNameError,
  normalizeDocument,
  passwordError,
  phoneError,
  socialNameError,
  stateError,
} from "../lib/validation";
import type { Address, DocType, DocumentDraft, SignupField } from "../types";

interface SignupPageProps {
  initialDocument?: DocumentDraft;
  onSignUp: (signedIn: SignedIn) => void;
  onBackToLogin: () => void;
}

const EMPTY_ADDRESS: Address = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

const STATES_BY_UF = [...STATES].sort((a, b) => a.uf.localeCompare(b.uf));

export function SignupPage({ initialDocument, onSignUp, onBackToLogin }: SignupPageProps) {
  const [today] = useState(todayIso);

  const [docType, setDocType] = useState<DocType>(initialDocument?.docType ?? "cpf");
  const [docValue, setDocValue] = useState(initialDocument?.value ?? "");
  const [fullName, setFullName] = useState("");
  const [socialName, setSocialName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [password, setPassword] = useState("");

  const form = useTouched<SignupField>();

  const [formError, setFormError] = useState<string | null>(null);

  const [pending, setPending] = useState(false);

  const [taken, setTaken] = useState<string | null>(null);

  const [verification, setVerification] = useState<PendingVerification | null>(null);

  const errors: Record<SignupField, string | null> = {
    document:
      documentError(docType, docValue) ??
      (taken !== null && taken === normalizeDocument(docValue) ? t("auth.signup.taken", { doc: DOC_LABEL[docType] }) : null),
    fullName: fullNameError(fullName),
    socialName: socialNameError(socialName),
    birthDate: birthDateError(birthDate, today),
    phone: phoneError(phone),
    cep: cepError(address.cep),
    street: addressTextError(address.street, "street"),
    number: addressNumberError(address.number),
    complement: complementError(address.complement),
    district: addressTextError(address.district, "district"),
    city: cityError(address.city),
    state: stateError(address.state),
    password: passwordError(password),
  };

  const shown = (field: SignupField) => form.shown(field, errors[field]);

  const setAddressField = (field: keyof Address, value: string) =>
    setAddress((current) => ({ ...current, [field]: value }));

  function changeDocType(type: DocType) {
    setDocType(type);
    setDocValue("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    form.submit();
    setFormError(null);

    if (Object.values(errors).some(Boolean)) return;

    const employee = createEmployee({
      docType,
      document: docValue,
      fullName,
      socialName,
      birthDate,
      phone,
      address,
    });

    setPending(true);
    try {
      const result = await signUp(employee, password);
      if (result.kind === "signedIn") {
        onSignUp(result.signedIn);
        return;
      }
      setVerification(result.pending);
    } catch (failure) {
      if (failure instanceof AuthError && failure.status === 409) {
        setTaken(employee.document);
      } else {
        setFormError(failure instanceof AuthError ? failure.message : t("auth.signup.failed"));
      }
    }
    setPending(false);
  }

  if (verification) {
    return (
      <main className="login">
        <div className="login-card">
          <header className="login-head">
            <div className="login-top">
              <Brand variant="login" />
              <LanguagePicker variant="login" />
            </div>
            <h1>{t("auth.appName")}</h1>
          </header>
          <PhoneVerification pending={verification} onSignedIn={onSignUp} onBack={onBackToLogin} />
        </div>
      </main>
    );
  }

  return (
    <main className="login">
      <div className="login-card login-card--wide">
        <header className="login-head">
          <div className="login-top">
            <Brand variant="login" />
            <LanguagePicker variant="login" />
          </div>
          <h1>{t("auth.signup.title")}</h1>
        </header>
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <FormField id="cadastro-nome" label={t("auth.signup.fullName")} flag="required" error={shown("fullName")}>
            {(control) => (
              <input
                {...control}
                className="input"
                type="text"
                autoComplete="name"
                placeholder={t("auth.signup.fullNamePlaceholder")}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                onBlur={() => form.touch("fullName")}
              />
            )}
          </FormField>
          <FormField
            id="cadastro-nome-social"
            label={t("auth.signup.socialName")}
            flag="optional"
            hint={t("auth.signup.socialNameHint")}
            error={shown("socialName")}
          >
            {(control) => (
              <input
                {...control}
                className="input"
                type="text"
                autoComplete="nickname"
                placeholder={t("auth.signup.socialNamePlaceholder")}
                value={socialName}
                onChange={(event) => setSocialName(event.target.value)}
                onBlur={() => form.touch("socialName")}
              />
            )}
          </FormField>
          <FormField
            id="cadastro-documento"
            label={DOC_LABEL[docType]}
            flag="required"
            error={shown("document")}
          >
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
          <DocTypeSwitch id="cadastro-tipo-documento" value={docType} onChange={changeDocType} />

          <div className="field-row">
            <FormField
              id="cadastro-nascimento"
              label={t("auth.signup.birthDate")}
              flag="required"
              error={shown("birthDate")}
            >
              {(control) => (
                <input
                  {...control}
                  className="input"
                  type="date"
                  autoComplete="bday"
                  max={today}
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  onBlur={() => form.touch("birthDate")}
                />
              )}
            </FormField>
            <FormField
              id="cadastro-telefone"
              label={t("auth.signup.phone")}
              flag="required"
              hint={t("auth.signup.phoneHint")}
              error={shown("phone")}
            >
              {(control) => (
                <input
                  {...control}
                  className="input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(13) 90000-0000"
                  maxLength={15}
                  value={phone}
                  onChange={(event) => setPhone(formatPhone(event.target.value))}
                  onBlur={() => form.touch("phone")}
                />
              )}
            </FormField>
          </div>
          <fieldset className="fieldset">
            <legend>{t("auth.signup.address")}</legend>
            <div className="address-grid">
              <FormField id="cadastro-cep" label={t("auth.signup.cep")} error={shown("cep")} className="col-2">
                {(control) => (
                  <input
                    {...control}
                    className="input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    maxLength={9}
                    value={address.cep}
                    onChange={(event) => setAddressField("cep", formatCep(event.target.value))}
                    onBlur={() => form.touch("cep")}
                  />
                )}
              </FormField>
              <FormField
                id="cadastro-logradouro"
                label={t("auth.signup.street")}
                error={shown("street")}
                className="col-4"
              >
                {(control) => (
                  <input
                    {...control}
                    className="input"
                    type="text"
                    autoComplete="address-line1"
                    placeholder={t("auth.signup.streetPlaceholder")}
                    value={address.street}
                    onChange={(event) => setAddressField("street", event.target.value)}
                    onBlur={() => form.touch("street")}
                  />
                )}
              </FormField>
              <FormField id="cadastro-numero" label={t("auth.signup.number")} error={shown("number")} className="col-2">
                {(control) => (
                  <input
                    {...control}
                    className="input"
                    type="text"
                    placeholder={t("auth.signup.numberPlaceholder")}
                    maxLength={8}
                    value={address.number}
                    onChange={(event) => setAddressField("number", event.target.value)}
                    onBlur={() => form.touch("number")}
                  />
                )}
              </FormField>
              <FormField
                id="cadastro-complemento"
                label={t("auth.signup.complement")}
                flag="optional"
                error={shown("complement")}
                className="col-2"
              >
                {(control) => (
                  <input
                    {...control}
                    className="input"
                    type="text"
                    autoComplete="address-line2"
                    placeholder={t("auth.signup.complementPlaceholder")}
                    maxLength={COMPLEMENT_MAX_LENGTH}
                    value={address.complement}
                    onChange={(event) => setAddressField("complement", event.target.value)}
                    onBlur={() => form.touch("complement")}
                  />
                )}
              </FormField>
              <FormField id="cadastro-bairro" label={t("auth.signup.district")} error={shown("district")} className="col-2">
                {(control) => (
                  <input
                    {...control}
                    className="input"
                    type="text"
                    value={address.district}
                    onChange={(event) => setAddressField("district", event.target.value)}
                    onBlur={() => form.touch("district")}
                  />
                )}
              </FormField>
              <FormField id="cadastro-cidade" label={t("auth.signup.city")} error={shown("city")} className="col-4">
                {(control) => (
                  <input
                    {...control}
                    className="input"
                    type="text"
                    autoComplete="address-level2"
                    value={address.city}
                    onChange={(event) => setAddressField("city", event.target.value)}
                    onBlur={() => form.touch("city")}
                  />
                )}
              </FormField>
              <FormField id="cadastro-uf" label={t("auth.signup.state")} error={shown("state")} className="col-2">
                {(control) => (
                  <select
                    {...control}
                    className="input"
                    autoComplete="address-level1"
                    value={address.state}
                    onChange={(event) => setAddressField("state", event.target.value)}
                    onBlur={() => form.touch("state")}
                  >
                    <option value="">{t("auth.signup.state")}</option>
                    {STATES_BY_UF.map((state) => (
                      <option key={state.uf} value={state.uf} title={state.name}>
                        {state.uf}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
            </div>
          </fieldset>
          <PasswordField
            id="cadastro-senha"
            value={password}
            error={shown("password")}
            autoComplete="new-password"
            placeholder={t("auth.signup.passwordPlaceholder")}
            onChange={setPassword}
            onBlur={() => form.touch("password")}
          />

          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}

          <button type="submit" className="btn btn--primary login-submit" disabled={pending}>
            {pending ? t("auth.signup.submitting") : t("auth.signup.submit")}
          </button>
        </form>
        <p className="login-alt">
          {t("auth.signup.haveAccount")}{" "}
          <button type="button" className="link-btn" onClick={onBackToLogin}>
            {t("auth.signup.signIn")}
          </button>
        </p>
      </div>
    </main>
  );
}
