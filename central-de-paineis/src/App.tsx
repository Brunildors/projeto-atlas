import { useEffect, useState } from "react";
import { Brand } from "./components/Brand";
import { Icon } from "./components/Icon";
import { LanguagePicker } from "./components/LanguagePicker";
import { getDashboards, readDashboardId } from "./dashboards";
import { t } from "./i18n";
import {
  clearSession,
  readSession,
  sessionDisplayName,
  signOut,
  storeSession,
  type SignedIn,
} from "./lib/auth";
import { saveEmployee } from "./lib/employees";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import type { DocumentDraft, Session } from "./types";

type AuthView = "login" | "signup";

export function App() {
  const [session, setSession] = useState<Session | null>(readSession);
  const [activeId, setActiveId] = useState(readDashboardId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [signupDraft, setSignupDraft] = useState<DocumentDraft | undefined>(undefined);

  useEffect(() => {
    const onHashChange = () => setActiveId(readDashboardId());

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.classList.add("has-drawer-open");

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("has-drawer-open");
    };
  }, [drawerOpen]);

  function handleSignIn({ session: novaSessao, employee }: SignedIn) {
    saveEmployee(employee);
    storeSession(novaSessao);
    setSession(novaSessao);
    setSignupDraft(undefined);
  }

  function showSignup(draft?: DocumentDraft) {
    setSignupDraft(draft);
    setAuthView("signup");
  }

  function handleSignOut() {
    if (session) signOut(session);
    clearSession();
    setSession(null);
    setDrawerOpen(false);
    setAuthView("login");
  }

  if (!session) {
    return authView === "signup" ? (
      <SignupPage
        initialDocument={signupDraft}
        onSignUp={handleSignIn}
        onBackToLogin={() => setAuthView("login")}
      />
    ) : (
      <LoginPage onSignIn={handleSignIn} onShowSignup={showSignup} />
    );
  }

  const dashboards = getDashboards();
  const dashboard = dashboards.find((item) => item.id === activeId) ?? dashboards[0];
  const { Component } = dashboard;

  const userName = sessionDisplayName(session);
  const menu = dashboards.filter((item) => !item.hideFromMenu);
  const profileOpen = dashboard.id === "perfil";

  return (
    <div className={drawerOpen ? "shell is-drawer-open" : "shell"}>
      <button
        type="button"
        className="sidebar-backdrop"
        tabIndex={drawerOpen ? 0 : -1}
        aria-label={t("app.menu.close")}
        onClick={() => setDrawerOpen(false)}
      />

      <aside className="sidebar" id="sidebar">
        <div className="sidebar-head">
          <a
            className="brand-link"
            href="#inicio"
            aria-label={t("app.brand.home")}
            title={t("app.brand.homeTitle")}
            onClick={() => setDrawerOpen(false)}
          >
            <Brand variant="sidebar" />
          </a>
          <button
            type="button"
            className="icon-btn sidebar-close"
            aria-label={t("app.menu.close")}
            title={t("app.menu.close")}
            onClick={() => setDrawerOpen(false)}
          >
            <span aria-hidden="true">{"✕"}</span>
          </button>
        </div>
        <nav aria-label={t("app.menu.nav")}>
          {menu.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={item.id === activeId ? "page" : undefined}
              onClick={() => setDrawerOpen(false)}
            >
              <span className="nav-icon" aria-hidden="true">
                <Icon name={item.icon} />
              </span>
              <span className="nav-label">{item.name}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          <a
            className="sidebar-profile"
            href="#perfil"
            aria-current={profileOpen ? "page" : undefined}
            aria-label={t("app.profile.label", { name: userName })}
            title={t("app.profile.title")}
            onClick={() => setDrawerOpen(false)}
          >
            <span className="nav-icon" aria-hidden="true">
              <Icon name="profile" />
            </span>
            <span className="sidebar-profile-text nav-label">
              <span className="sidebar-user-label">{t("app.profile.role")}</span>
              <span className="sidebar-user-name" title={userName}>
                {userName}
              </span>
            </span>
          </a>
          <div className="sidebar-actions">
            <button type="button" className="sidebar-signout" onClick={handleSignOut}>
              <span className="nav-icon" aria-hidden="true">
                {"⏏"}
              </span>
              <span className="nav-label">{t("app.signOut")}</span>
            </button>
            <LanguagePicker variant="sidebar" />
          </div>
        </div>
      </aside>
      <main className="content">
        <header className="page-head">
          <div className="page-head-main">
            <button
              type="button"
              className="icon-btn sidebar-trigger"
              aria-expanded={drawerOpen}
              aria-controls="sidebar"
              aria-label={t("app.menu.open")}
              title={t("app.menu.open")}
              onClick={() => setDrawerOpen(true)}
            >
              <span aria-hidden="true">{"☰"}</span>
            </button>
            <div>
              <h1>{dashboard.title}</h1>
              {!dashboard.hideDescription && <p>{dashboard.description}</p>}
            </div>
          </div>
        </header>
        {/* a key faz o painel remontar quando troca de aba, senão ele herda o estado do anterior */}
        <Component key={dashboard.id} dashboards={dashboards} activeId={dashboard.id} session={session} />
      </main>
    </div>
  );
}
