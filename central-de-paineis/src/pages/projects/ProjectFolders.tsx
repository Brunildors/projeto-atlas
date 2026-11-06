import { useMemo, useState } from "react";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { Icon } from "../../components/Icon";
import { Panel } from "../../components/Panel";
import { useReorder } from "../../components/useReorder";
import { t } from "../../i18n";
import { PROJECT_STATUSES, projectStatusLabel } from "../../lib/projects";
import type { Project, ProjectStatus } from "../../types";
import { dueLabel, fileCountLabel, PRIORITY_TONE, priorityBadgeLabel, STATUS_TONE } from "./labels";

type Filter = ProjectStatus | "todos";

interface ProjectFoldersProps {
  projects: Project[];
  fileCounts: Map<string, number>;
  today: string;
  onCreate: () => void;
  onReorder: (ids: string[]) => void;
}

export function ProjectFolders({ projects, fileCounts, today, onCreate, onReorder }: ProjectFoldersProps) {
  const [filter, setFilter] = useState<Filter>("todos");

  const counts = useMemo(() => {
    const byStatus = { pendente: 0, andamento: 0, concluida: 0 };
    for (const project of projects) byStatus[project.status] += 1;
    return byStatus;
  }, [projects]);

  const byId = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const visible = projects.filter((project) => filter === "todos" || project.status === filter);

  function reorderVisible(visibleIds: string[]) {
    const shown = new Set(visibleIds);
    let next = 0;
    onReorder(projects.map((project) => (shown.has(project.id) ? visibleIds[next++] : project.id)));
  }

  const reorder = useReorder({
    ids: visible.map((project) => project.id),
    onReorder: reorderVisible,
    labelOf: (id) => t("proj.folderLabel", { title: byId.get(id)?.title ?? "" }),
  });

  const filters: { id: Filter; label: string }[] = [
    { id: "todos", label: t("proj.filter.all", { n: projects.length }) },
    ...PROJECT_STATUSES.map((status) => ({
      id: status,
      label: `${projectStatusLabel(status)} (${counts[status]})`,
    })),
  ];

  return (
    <>
      <div className="projects-toolbar">
        <div className="segmented" role="group" aria-label={t("proj.filter.group")}>
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--primary btn--create" onClick={onCreate}>
          <Icon name="plus" size={18} />
          {t("proj.create")}
        </button>
      </div>
      <div className="grid">
        <Panel
          title={t("proj.mine")}
          note={visible.length > 1 ? t("proj.mine.noteMany") : t("proj.mine.noteOne")}
          span={12}
          className="panel--frame"
        >
          {visible.length === 0 ? (
            <EmptyState
              message={projects.length === 0 ? t("proj.empty.none") : t("proj.empty.filtered")}
              hint={projects.length === 0 ? t("proj.empty.noneHint") : undefined}
              minHeight={220}
            />
          ) : (
            <ul className="folders">
              {reorder.order.map((id) => {
                const project = byId.get(id);
                if (!project) return null;

                const due = dueLabel(project, today);
                const classes = ["folder"];
                if (project.status === "concluida") classes.push("is-done");
                if (reorder.draggingId === id) classes.push("is-dragging");

                return (
                  <li key={id} className={classes.join(" ")} {...reorder.itemProps(id)}>
                    <a className="folder-open" href={`#tarefas/${id}`} draggable={false}>
                      <span className="folder-icon" aria-hidden="true">
                        <Icon name="folder" size={24} />
                      </span>
                      <span className="folder-title">{project.title}</span>
                      {project.description && <span className="folder-text">{project.description}</span>}

                      <span className="folder-badges">
                        <Badge tone={STATUS_TONE[project.status]}>{projectStatusLabel(project.status)}</Badge>
                        <Badge tone={PRIORITY_TONE[project.priority]}>
                          {priorityBadgeLabel(project.priority)}
                        </Badge>
                      </span>
                      <span className="folder-foot">
                        <span className={due.overdue ? "text-negative" : undefined}>{due.text}</span>
                        <span className="folder-files">
                          <Icon name="paperclip" size={14} />
                          {fileCountLabel(fileCounts.get(id) ?? 0)}
                        </span>
                      </span>
                    </a>
                    <button
                      type="button"
                      className="folder-grip"
                      aria-label={t("proj.move", { title: project.title })}
                      aria-describedby="pastas-ajuda"
                      title={t("proj.dragHint")}
                      {...reorder.handleProps(id)}
                    >
                      <Icon name="grip" size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="sr-only" id="pastas-ajuda">
            {t("proj.keyboardHelp")}
          </p>
          <p className="sr-only" aria-live="polite">
            {reorder.announcement}
          </p>
        </Panel>
      </div>
    </>
  );
}
