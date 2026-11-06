import { t, tn } from "../../i18n";
import { formatIsoDate } from "../../lib/format";
import { isOverdue } from "../../lib/projects";
import type { Project, ProjectPriority, ProjectStatus, Tone } from "../../types";

export const STATUS_TONE: Record<ProjectStatus, Tone> = {
  pendente: "neutral",
  andamento: "warning",
  concluida: "positive",
};

export const PRIORITY_TONE: Record<ProjectPriority, Tone> = {
  alta: "negative",
  media: "warning",
  baixa: "neutral",
};

export const nextActionLabel = (status: ProjectStatus): string => t(`proj.next.${status}`);

export const priorityBadgeLabel = (priority: ProjectPriority): string => t(`proj.priorityBadge.${priority}`);

export function dueLabel(project: Project, today: string, labelled = false): { text: string; overdue: boolean } {
  const overdue = isOverdue(project, today);
  if (!project.dueDate) return { text: t("proj.due.none"), overdue };

  const date = formatIsoDate(project.dueDate);
  if (overdue) return { text: t("proj.due.overdue", { date }), overdue };
  return { text: labelled ? date : t("proj.due.on", { date }), overdue };
}

export function fileCountLabel(count: number): string {
  return count === 0 ? t("proj.files.none") : tn("proj.files", count);
}
