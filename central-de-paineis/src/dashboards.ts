import { AlertasPage } from "./pages/AlertasPage";
import { AssistantPage } from "./pages/AssistantPage";
import { CalendarPage } from "./pages/CalendarPage";
import { HomePage } from "./pages/HomePage";
import { PlanejamentoPage } from "./pages/PlanejamentoPage";
import { PrevisaoPage } from "./pages/PrevisaoPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { UtilizacaoPage } from "./pages/UtilizacaoPage";
import { t, type MessageKey } from "./i18n";
import type { Dashboard } from "./types";

const REGISTRY: Omit<Dashboard, "name" | "title" | "description">[] = [
  { id: "inicio", icon: "home", Component: HomePage },
  { id: "utilizacao", icon: "heatmap", Component: UtilizacaoPage },
  { id: "previsao", icon: "forecast", Component: PrevisaoPage },
  { id: "planejamento", icon: "timeline", Component: PlanejamentoPage },
  { id: "alertas", icon: "alert", Component: AlertasPage },
  { id: "calendario", hideDescription: true, icon: "calendar", Component: CalendarPage },
  { id: "tarefas", hideDescription: true, icon: "projects", Component: ProjectsPage },
  { id: "iport-ai", hideDescription: true, icon: "assistant", Component: AssistantPage },
  { id: "perfil", hideFromMenu: true, icon: "profile", Component: ProfilePage },
];

export function getDashboards(): Dashboard[] {
  return REGISTRY.map((item) => ({
    ...item,
    name: t(`dash.${item.id}.name` as MessageKey),
    title: t(`dash.${item.id}.title` as MessageKey),
    description: t(`dash.${item.id}.description` as MessageKey),
  }));
}

const ALIASES: Record<string, string> = {
  funcionario: "perfil",
  financas: "utilizacao",
  infra: "utilizacao",
  marketing: "utilizacao",
};

function readHash(): string {
  const [raw = "", section = ""] = window.location.hash.replace("#", "").split("/");
  const id = ALIASES[raw] ?? raw;

  return id === "perfil" && section !== "" ? "tarefas" : id;
}

const DEFAULT_ID = "inicio";

const isKnownId = (id: string): boolean => REGISTRY.some((dashboard) => dashboard.id === id);

export function readDashboardId(): string {
  const id = readHash();
  return isKnownId(id) ? id : DEFAULT_ID;
}
