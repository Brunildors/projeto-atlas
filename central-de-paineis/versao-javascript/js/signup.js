import { Brand, ThemeToggle } from "./components.js";
import { createEmployee, isRegistered, saveEmployee } from "./employees.js";
import { h, useState } from "./react.js";
import {
  checkPassword,
  cpfError,
  formatCpf,
  formatPhone,
  fullNameError,
  PASSWORD_MIN_LENGTH,
  passwordError,
  phoneError,
  socialNameError,
} from "./validation.js";

const PASSWORD_RULES = [
  { key: "length", label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres` },
  { key: "uppercase", label: "Pelo menos 1 letra maiúscula" },
  { key: "special", label: "Pelo menos 1 caractere especial (@, #, $, %, !)" },
];

const NOTHING_TOUCHED = {
  cpf: false,
  fullName: false,
  socialName: false,
  phone: false,
  password: false,
};

export function SignupPage({ onSignUp, onBackToLogin }) {
  const [cpf, setCpf] = useState("");
  const [fullName, setFullName] = useState("");
  const [socialName, setSocialName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState(NOTHING_TOUCHED);
  const [showPassword, setShowPassword] = useState(false);

  const [formError, setFormError] = useState(null);

  const checks = checkPassword(password);

  const messages = {
    cpf: cpfError(cpf) ?? (isRegistered(cpf) ? "Este CPF já tem cadastro. Entre com ele." : null),
    fullName: fullNameError(fullName),
    socialName: socialNameError(socialName),
    phone: phoneError(phone),
    password: passwordError(password),
  };

  const visible = {};
  for (const field of Object.keys(messages)) {
    visible[field] = touched[field] ? messages[field] : null;
  }

  const markTouched = (field) => setTouched((current) => ({ ...current, [field]: true }));

  function handleSubmit(event) {
    event.preventDefault();

    setTouched({
      cpf: true,
      fullName: true,
      socialName: true,
      phone: true,
      password: true,
    });
    setFormError(null);

    if (Object.values(messages).some(Boolean)) return;

    const employee = createEmployee({ cpf, fullName, socialName, phone });

    if (!saveEmployee(employee)) {
      setFormError(
        "Não foi possível salvar o cadastro neste navegador. " +
          "Verifique se o armazenamento local está bloqueado (janela privada) e tente de novo.",
      );
      return;
    }

    onSignUp(employee.cpf);
  }

  return h(
    "main",
    { className: "login" },
    h(
      "div",
      { className: "login-card login-card--wide" },

      h(
        "header",
        { className: "login-head" },
        h("div", { className: "login-top" }, h(Brand, { variant: "login" }), h(ThemeToggle)),
        h("h1", null, "Criar cadastro"),
        h("p", null, "Preencha os dados do funcionário para liberar o acesso aos painéis."),
      ),

      h(
        "form",
        { className: "login-form", onSubmit: handleSubmit, noValidate: true },

        h(
          "div",
          { className: "field" },
          h(
            "label",
            { htmlFor: "cadastro-nome" },
            "Nome completo ",
            h("span", { className: "field-flag" }, "obrigatório"),
          ),
          h("input", {
            id: "cadastro-nome",
            className: "input",
            type: "text",
            autoComplete: "name",
            placeholder: "Como está no documento",
            value: fullName,
            onChange: (event) => setFullName(event.target.value),
            onBlur: () => markTouched("fullName"),
            "aria-invalid": visible.fullName ? true : undefined,
            "aria-describedby": visible.fullName ? "cadastro-nome-erro" : undefined,
          }),
          visible.fullName &&
            h(
              "p",
              { className: "field-error", id: "cadastro-nome-erro", role: "alert" },
              visible.fullName,
            ),
        ),

        h(
          "div",
          { className: "field" },
          h(
            "label",
            { htmlFor: "cadastro-nome-social" },
            "Nome social ",
            h("span", { className: "field-flag" }, "opcional"),
          ),
          h("input", {
            id: "cadastro-nome-social",
            className: "input",
            type: "text",
            autoComplete: "nickname",
            placeholder: "Como você quer ser chamado",
            value: socialName,
            onChange: (event) => setSocialName(event.target.value),
            onBlur: () => markTouched("socialName"),
            "aria-invalid": visible.socialName ? true : undefined,
            "aria-describedby": `cadastro-nome-social-dica${
              visible.socialName ? " cadastro-nome-social-erro" : ""
            }`,
          }),
          visible.socialName &&
            h(
              "p",
              { className: "field-error", id: "cadastro-nome-social-erro", role: "alert" },
              visible.socialName,
            ),
          h(
            "p",
            { className: "field-hint", id: "cadastro-nome-social-dica" },
            "Se preenchido, é este o nome que aparece no sistema.",
          ),
        ),

        h(
          "div",
          { className: "field-row" },

          h(
            "div",
            { className: "field" },
            h("label", { htmlFor: "cadastro-cpf" }, "CPF"),
            h("input", {
              id: "cadastro-cpf",
              className: "input",
              type: "text",
              inputMode: "numeric",
              autoComplete: "username",
              placeholder: "000.000.000-00",
              maxLength: 14,
              value: cpf,
              onChange: (event) => setCpf(formatCpf(event.target.value)),
              onBlur: () => markTouched("cpf"),
              "aria-invalid": visible.cpf ? true : undefined,
              "aria-describedby": visible.cpf ? "cadastro-cpf-erro" : undefined,
            }),
            visible.cpf &&
              h(
                "p",
                { className: "field-error", id: "cadastro-cpf-erro", role: "alert" },
                visible.cpf,
              ),
          ),

          h(
            "div",
            { className: "field" },
            h("label", { htmlFor: "cadastro-telefone" }, "Telefone"),
            h("input", {
              id: "cadastro-telefone",
              className: "input",
              type: "tel",
              inputMode: "tel",
              autoComplete: "tel",
              placeholder: "(13) 90000-0000",
              maxLength: 15,
              value: phone,
              onChange: (event) => setPhone(formatPhone(event.target.value)),
              onBlur: () => markTouched("phone"),
              "aria-invalid": visible.phone ? true : undefined,
              "aria-describedby": visible.phone ? "cadastro-telefone-erro" : undefined,
            }),
            visible.phone &&
              h(
                "p",
                { className: "field-error", id: "cadastro-telefone-erro", role: "alert" },
                visible.phone,
              ),
          ),
        ),

        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "cadastro-senha" }, "Senha"),
          h(
            "div",
            { className: "input-wrap" },
            h("input", {
              id: "cadastro-senha",
              className: "input",
              type: showPassword ? "text" : "password",
              autoComplete: "new-password",
              placeholder: "Crie uma senha",
              value: password,
              onChange: (event) => setPassword(event.target.value),
              onBlur: () => markTouched("password"),
              "aria-invalid": visible.password ? true : undefined,
              "aria-describedby": `cadastro-senha-regras${
                visible.password ? " cadastro-senha-erro" : ""
              }`,
            }),
            h(
              "button",
              {
                type: "button",
                className: "input-action",
                "aria-pressed": showPassword,
                "aria-label": showPassword ? "Esconder a senha" : "Mostrar a senha",
                title: showPassword ? "Esconder a senha" : "Mostrar a senha",
                onClick: () => setShowPassword((visivel) => !visivel),
              },
              h("span", { "aria-hidden": "true" }, showPassword ? "◡" : "◉"),
            ),
          ),

          visible.password &&
            h(
              "p",
              { className: "field-error", id: "cadastro-senha-erro", role: "alert" },
              visible.password,
            ),

          h(
            "ul",
            { className: "rules", id: "cadastro-senha-regras" },
            PASSWORD_RULES.map((rule) => {
              const ok = checks[rule.key];

              return h(
                "li",
                { key: rule.key, className: ok ? "rule is-ok" : "rule" },
                h("span", { className: "rule-mark", "aria-hidden": "true" }, ok ? "✓" : "○"),
                rule.label,
                h("span", { className: "sr-only" }, ok ? " — cumprido" : " — pendente"),
              );
            }),
          ),
        ),

        formError && h("p", { className: "form-error", role: "alert" }, formError),

        h(
          "button",
          { type: "submit", className: "btn btn--primary login-submit" },
          "Cadastrar e entrar",
        ),
      ),

      h(
        "p",
        { className: "login-alt" },
        "Já tem cadastro? ",
        h("button", { type: "button", className: "link-btn", onClick: onBackToLogin }, "Entrar"),
      ),

      h(
        "p",
        { className: "login-note" },
        "Demonstração: o cadastro fica no navegador deste computador (",
        h("code", null, "js/employees.js"),
        "). A senha é validada e não é guardada em lugar nenhum — conferi-la é papel do servidor.",
      ),
    ),
  );
}
