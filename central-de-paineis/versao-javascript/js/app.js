import {
  clearSession,
  createSession,
  readSession,
  sessionDisplayName,
  storeSession,
} from "./auth.js";
import { Brand, ThemeToggle } from "./components.js";
import { formatToday } from "./format.js";
import { LoginPage } from "./login.js";
import {
  CalendarPage,
  FinancePage,
  HomePage,
  InfraPage,
  MarketingPage,
  ProfilePage,
} from "./pages.js";
import { createRoot, h, StrictMode, useEffect, useState } from "./react.js";
import { readCollapsed, storeCollapsed } from "./sidebar.js";
import { SignupPage } from "./signup.js";

const DASHBOARDS = [
  {
    id: "inicio",
    name: "Início",
    title: "Início",
    description: "Atalhos para as áreas do sistema",
    icon: "◧",
    Component: HomePage,
  },
  {
    id: "financas",
    name: "Finanças",
    title: "Finanças da empresa",
    description: "Receita, despesas e caixa da empresa",
    icon: "◐",
    Component: FinancePage,
  },
  {
    id: "infra",
    name: "Infraestrutura",
    title: "Saúde dos servidores",
    description: "Latência, carga e disponibilidade em tempo real",
    icon: "◉",
    Component: InfraPage,
  },
  {
    id: "marketing",
    name: "Marketing",
    title: "Aquisição e campanhas",
    description: "De onde vêm as vendas e quanto custam",
    icon: "◭",
    Component: MarketingPage,
  },
  {
    id: "calendario",
    name: "Calendário",
    title: "Calendário de Santos",
    description: "Feriados e pontos facultativos de Santos (SP)",
    icon: "▦",
    Component: CalendarPage,
  },
  {
    id: "perfil",
    name: "Perfil",
    title: "Meu perfil",
    description: "Os dados do seu cadastro de funcionário",
    icon: "◍",
    Component: ProfilePage,
  },
];

const DEFAULT_ID = "inicio";

const isKnownId = (id) => DASHBOARDS.some((dashboard) => dashboard.id === id);

function readDashboardId() {
  const id = window.location.hash.replace("#", "");
  return isKnownId(id) ? id : DEFAULT_ID;
}

function App() {
  const [session, setSession] = useState(readSession);
  const [activeId, setActiveId] = useState(readDashboardId);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authView, setAuthView] = useState("login");

  useEffect(() => {
    const onHashChange = () => setActiveId(readDashboardId());

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => storeCollapsed(collapsed), [collapsed]);

  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.classList.add("has-drawer-open");

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("has-drawer-open");
    };
  }, [drawerOpen]);

  function handleSignIn(cpf) {
    const novaSessao = createSession(cpf);
    storeSession(novaSessao);
    setSession(novaSessao);
  }

  function handleSignOut() {
    clearSession();
    setSession(null);
    setDrawerOpen(false);
    setAuthView("login");
  }

  if (!session) {
    return authView === "signup"
      ? h(SignupPage, {
          onSignUp: handleSignIn,
          onBackToLogin: () => setAuthView("login"),
        })
      : h(LoginPage, {
          onSignIn: handleSignIn,
          onShowSignup: () => setAuthView("signup"),
        });
  }

  const dashboard = DASHBOARDS.find((item) => item.id === activeId) ?? DASHBOARDS[0];
  const today = formatToday();
  const userName = sessionDisplayName(session);

  const shellClasses = ["shell"];
  if (collapsed) shellClasses.push("is-collapsed");
  if (drawerOpen) shellClasses.push("is-drawer-open");

  return h(
    "div",
    { className: shellClasses.join(" ") },

    h("button", {
      type: "button",
      className: "sidebar-backdrop",
      tabIndex: drawerOpen ? 0 : -1,
      "aria-label": "Fechar o menu",
      onClick: () => setDrawerOpen(false),
    }),

    h(
      "aside",
      { className: "sidebar", id: "sidebar" },

      h(
        "div",
        { className: "sidebar-head" },
        h(
          "a",
          {
            className: "brand-link",
            href: `#${dashboard.id}`,
            "aria-label": "iPORT Solutions",
          },
          h(Brand, { variant: "sidebar", compact: collapsed }),
        ),

        h(
          "button",
          {
            type: "button",
            className: "icon-btn sidebar-collapse",
            "aria-expanded": !collapsed,
            "aria-controls": "sidebar",
            "aria-label": collapsed ? "Expandir o menu" : "Recolher o menu",
            title: collapsed ? "Expandir o menu" : "Recolher o menu",
            onClick: () => setCollapsed((atual) => !atual),
          },
          h("span", { "aria-hidden": "true" }, collapsed ? "»" : "«"),
        ),

        h(
          "button",
          {
            type: "button",
            className: "icon-btn sidebar-close",
            "aria-label": "Fechar o menu",
            title: "Fechar o menu",
            onClick: () => setDrawerOpen(false),
          },
          h("span", { "aria-hidden": "true" }, "✕"),
        ),
      ),

      h(
        "nav",
        { "aria-label": "Dashboards" },
        DASHBOARDS.map((item) =>
          h(
            "a",
            {
              key: item.id,
              href: `#${item.id}`,
              "aria-current": item.id === activeId ? "page" : undefined,
              title: item.name,
              onClick: () => setDrawerOpen(false),
            },
            h("span", { className: "nav-icon", "aria-hidden": "true" }, item.icon),
            h("span", { className: "nav-label" }, item.name),
          ),
        ),
      ),

      h(
        "div",
        { className: "sidebar-foot" },
        h(
          "p",
          { className: "sidebar-user" },
          h("span", { className: "sidebar-user-label" }, "Funcionário"),
          h("span", { className: "sidebar-user-name", title: userName }, userName),
        ),
        h(
          "button",
          { type: "button", className: "sidebar-signout", onClick: handleSignOut },
          h("span", { className: "nav-icon", "aria-hidden": "true" }, "⏏"),
          h("span", { className: "nav-label" }, "Sair"),
        ),
      ),
    ),

    h(
      "main",
      { className: "content" },
      h(
        "header",
        { className: "page-head" },
        h(
          "div",
          { className: "page-head-main" },
          h(
            "button",
            {
              type: "button",
              className: "icon-btn sidebar-trigger",
              "aria-expanded": drawerOpen,
              "aria-controls": "sidebar",
              "aria-label": "Abrir o menu",
              title: "Abrir o menu",
              onClick: () => setDrawerOpen(true),
            },
            h("span", { "aria-hidden": "true" }, "☰"),
          ),
          h("div", null, h("h1", null, dashboard.title), h("p", null, dashboard.description)),
        ),
        h(
          "div",
          { className: "page-head-aside" },
          h(ThemeToggle),
          h("time", { className: "today" }, today),
        ),
      ),

      h(dashboard.Component, {
        key: dashboard.id,
        dashboards: DASHBOARDS,
        activeId: dashboard.id,
        session,
      }),
    ),
  );
}

const container = document.getElementById("root");

if (!container) {
  throw new Error("Elemento #root não encontrado no index.html");
}

createRoot(container).render(h(StrictMode, null, h(App)));
