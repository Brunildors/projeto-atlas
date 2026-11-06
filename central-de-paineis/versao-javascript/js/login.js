import { Brand, ThemeToggle } from "./components.js";
import { h, useState } from "./react.js";
import {
  checkPassword,
  cpfError,
  formatCpf,
  PASSWORD_MIN_LENGTH,
  passwordError,
} from "./validation.js";

const PASSWORD_RULES = [
  { key: "length", label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres` },
  { key: "uppercase", label: "Pelo menos 1 letra maiúscula" },
  { key: "special", label: "Pelo menos 1 caractere especial (@, #, $, %, !)" },
];

export function LoginPage({ onSignIn, onShowSignup }) {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState({ cpf: false, password: false });

  const [showPassword, setShowPassword] = useState(false);

  const checks = checkPassword(password);

  const cpfMessage = cpfError(cpf);
  const passwordMessage = passwordError(password);

  const cpfVisible = touched.cpf ? cpfMessage : null;
  const passwordVisible = touched.password ? passwordMessage : null;

  const markTouched = (field) =>
    setTouched((current) => ({ ...current, [field]: true }));

  function handleSubmit(event) {
    event.preventDefault();

    setTouched({ cpf: true, password: true });

    if (cpfMessage || passwordMessage) return;

    onSignIn(cpf);
  }

  return h(
    "main",
    { className: "login" },
    h(
      "div",
      { className: "login-card" },

      h(
        "header",
        { className: "login-head" },
        h(
          "div",
          { className: "login-top" },
          h(Brand, { variant: "login" }),
          h(ThemeToggle),
        ),
        h("h1", null, "Central de painéis"),
        h("p", null, "Entre com o CPF do funcionário para acessar os painéis."),
      ),

      h(
        "form",
        { className: "login-form", onSubmit: handleSubmit, noValidate: true },

        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "login-cpf" }, "CPF do funcionário"),
          h("input", {
            id: "login-cpf",
            className: "input",
            type: "text",
            inputMode: "numeric",
            autoComplete: "username",
            placeholder: "000.000.000-00",
            maxLength: 14,
            value: cpf,
            onChange: (event) => setCpf(formatCpf(event.target.value)),
            onBlur: () => markTouched("cpf"),
            "aria-invalid": cpfVisible ? true : undefined,
            "aria-describedby": cpfVisible ? "login-cpf-erro" : undefined,
          }),
          cpfVisible &&
            h(
              "p",
              { className: "field-error", id: "login-cpf-erro", role: "alert" },
              cpfVisible,
            ),
        ),

        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "login-senha" }, "Senha"),
          h(
            "div",
            { className: "input-wrap" },
            h("input", {
              id: "login-senha",
              className: "input",
              type: showPassword ? "text" : "password",
              autoComplete: "current-password",
              placeholder: "Sua senha",
              value: password,
              onChange: (event) => setPassword(event.target.value),
              onBlur: () => markTouched("password"),
              "aria-invalid": passwordVisible ? true : undefined,
              "aria-describedby": `login-senha-regras${
                passwordVisible ? " login-senha-erro" : ""
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
                onClick: () => setShowPassword((visible) => !visible),
              },
              h("span", { "aria-hidden": "true" }, showPassword ? "◡" : "◉"),
            ),
          ),

          passwordVisible &&
            h(
              "p",
              { className: "field-error", id: "login-senha-erro", role: "alert" },
              passwordVisible,
            ),

          h(
            "ul",
            { className: "rules", id: "login-senha-regras" },
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

        h("button", { type: "submit", className: "btn btn--primary login-submit" }, "Entrar"),
      ),

      h(
        "p",
        { className: "login-alt" },
        "Primeiro acesso? ",
        h(
          "button",
          { type: "button", className: "link-btn", onClick: onShowSignup },
          "Criar cadastro",
        ),
      ),

      h(
        "p",
        { className: "login-note" },
        "Demonstração: a validação é de formato (CPF e regras de senha). A conferência da senha depende do servidor de autenticação — veja ",
        h("code", null, "js/auth.js"),
        ".",
      ),
    ),
  );
}
