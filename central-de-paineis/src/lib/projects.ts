import { t } from "../i18n";
import type { Project, ProjectPriority, ProjectStatus } from "../types";
import { createRecordStore, isObject, newId } from "./records";
import { normalizeName } from "./validation";

export const PROJECT_STATUSES: ProjectStatus[] = ["pendente", "andamento", "concluida"];

export const projectStatusLabel = (status: ProjectStatus): string => t(`proj.status.${status}`);

export const PROJECT_PRIORITIES: ProjectPriority[] = ["alta", "media", "baixa"];

export const projectPriorityLabel = (priority: ProjectPriority): string => t(`proj.priority.${priority}`);

export const PROJECT_PRIORITY_WEIGHT: Record<ProjectPriority, number> = {
  alta: 3,
  media: 2,
  baixa: 1,
};

function isProject(value: unknown): value is Project {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.document === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.dueDate === "string" &&
    PROJECT_PRIORITIES.includes(value.priority as ProjectPriority) &&
    PROJECT_STATUSES.includes(value.status as ProjectStatus) &&
    (value.order === undefined || typeof value.order === "number") &&
    typeof value.createdAt === "string"
  );
}

const store = createRecordStore<Project>("tarefas", isProject);

export const saveProject = store.save;
export const removeProject = store.remove;

function compareByDeadline(a: Project, b: Project): number {
  const doneA = a.status === "concluida" ? 1 : 0;
  const doneB = b.status === "concluida" ? 1 : 0;
  if (doneA !== doneB) return doneA - doneB;

  const dueA = a.dueDate || "9999-12-31";
  const dueB = b.dueDate || "9999-12-31";
  if (dueA !== dueB) return dueA.localeCompare(dueB);

  return PROJECT_PRIORITY_WEIGHT[b.priority] - PROJECT_PRIORITY_WEIGHT[a.priority];
}

function compareByOrder(a: Project, b: Project): number {
  if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
  if (a.order !== undefined) return -1;
  if (b.order !== undefined) return 1;
  return compareByDeadline(a, b);
}

export function listProjects(document: string): Project[] {
  return store.listFor(document).sort(compareByOrder);
}

export function saveProjectOrder(document: string, ids: string[]): boolean {
  const position = new Map(ids.map((id, index) => [id, index]));
  const reordered = store
    .listFor(document)
    .filter((project) => position.has(project.id))
    .map((project) => ({ ...project, order: position.get(project.id) }));

  return store.saveMany(reordered);
}

export function createProject(
  document: string,
  draft: { title: string; description: string; dueDate: string; priority: ProjectPriority },
  existing: Project[],
): Project {
  const orders = existing
    .map((project) => project.order)
    .filter((order): order is number => order !== undefined);

  return {
    id: newId(),
    document,
    title: normalizeName(draft.title),
    description: draft.description.trim(),
    dueDate: draft.dueDate,
    priority: draft.priority,
    status: "pendente",
    order: orders.length > 0 ? Math.min(...orders) - 1 : 0,
    createdAt: new Date().toISOString(),
  };
}

export function nextStatus(status: ProjectStatus): ProjectStatus {
  const index = PROJECT_STATUSES.indexOf(status);
  return PROJECT_STATUSES[(index + 1) % PROJECT_STATUSES.length];
}

export const PROJECT_TITLE_MIN_LENGTH = 3;
export const PROJECT_TITLE_MAX_LENGTH = 120;

export function projectTitleError(value: string): string | null {
  const title = normalizeName(value);
  if (title.length === 0) return t("proj.val.titleEmpty");
  if (title.length < PROJECT_TITLE_MIN_LENGTH) return t("proj.val.tooShort");
  if (title.length > PROJECT_TITLE_MAX_LENGTH) return t("proj.val.tooLong", { n: PROJECT_TITLE_MAX_LENGTH });
  return null;
}

export function projectDueDateError(value: string, today: string): string | null {
  if (value === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return t("proj.val.dateInvalid");
  if (value < today) return t("proj.val.datePast");
  return null;
}

export const isOverdue = (project: Project, today: string): boolean =>
  project.status !== "concluida" && project.dueDate !== "" && project.dueDate < today;
