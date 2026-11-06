import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { Icon } from "../../components/Icon";
import { Panel } from "../../components/Panel";
import { formatFileSize, formatIsoDateTime } from "../../lib/format";
import { t } from "../../i18n";
import { projectPriorityLabel, projectStatusLabel } from "../../lib/projects";
import type { Project, ProjectFile } from "../../types";
import { dueLabel, fileCountLabel, nextActionLabel, PRIORITY_TONE, STATUS_TONE } from "./labels";

interface ProjectDetailProps {
  project: Project;
  files: ProjectFile[];
  today: string;
  onAdvance: () => void;
  onRemove: () => void;
  onAddFile: () => void;
  onDownload: (file: ProjectFile) => void;
  onRemoveFile: (file: ProjectFile) => void;
}

export function ProjectDetail({
  project,
  files,
  today,
  onAdvance,
  onRemove,
  onAddFile,
  onDownload,
  onRemoveFile,
}: ProjectDetailProps) {
  const due = dueLabel(project, today, true);

  return (
    <>
      <div className="project-bar">
        <a className="btn btn--back" href="#tarefas">
          <Icon name="back" size={16} />
          {t("proj.back")}
        </a>
      </div>
      <div className="grid">
        <Panel title={project.title} note={t("proj.folderNote")} span={4} className="project-about">
          <dl className="data-list">
            <div className="data-row">
              <dt>{t("proj.field.status")}</dt>
              <dd>
                <Badge tone={STATUS_TONE[project.status]}>{projectStatusLabel(project.status)}</Badge>
              </dd>
            </div>
            <div className="data-row">
              <dt>{t("proj.field.priority")}</dt>
              <dd>
                <Badge tone={PRIORITY_TONE[project.priority]}>{projectPriorityLabel(project.priority)}</Badge>
              </dd>
            </div>
            <div className="data-row">
              <dt>{t("proj.field.due")}</dt>
              <dd className={due.overdue ? "text-negative" : undefined}>{due.text}</dd>
            </div>
            <div className="data-row">
              <dt>{t("proj.field.created")}</dt>
              <dd>{formatIsoDateTime(project.createdAt)}</dd>
            </div>
            <div className="data-row">
              <dt>{t("proj.field.description")}</dt>
              <dd className="project-description">{project.description || "—"}</dd>
            </div>
          </dl>
          <div className="project-actions">
            <button type="button" className="btn" onClick={onAdvance}>
              {nextActionLabel(project.status)}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onRemove}>
              {t("proj.remove")}
            </button>
          </div>
        </Panel>
        <Panel
          title={t("proj.filesTitle")}
          note={t("proj.filesNote", { count: fileCountLabel(files.length) })}
          span={8}
          actions={
            <button type="button" className="btn btn--primary btn--with-icon" onClick={onAddFile}>
              <Icon name="upload" size={16} />
              {t("proj.addFile")}
            </button>
          }
        >
          {files.length === 0 ? (
            <EmptyState
              message={t("proj.filesEmpty")}
              hint={t("proj.filesEmptyHint")}
              minHeight={220}
            />
          ) : (
            <ul className="file-list">
              {files.map((file) => (
                <li key={file.id} className="file-item">
                  <span className="file-icon" aria-hidden="true">
                    <Icon name="file" size={20} />
                  </span>
                  <div className="file-main">
                    <p className="file-name">{file.name}</p>
                    <p className="file-text">{file.description}</p>
                    <p className="file-meta">
                      {file.fileName} · {formatFileSize(file.size)} · {formatIsoDateTime(file.createdAt)}
                    </p>
                  </div>
                  <div className="file-actions">
                    <button
                      type="button"
                      className="btn btn--with-icon"
                      aria-label={t("proj.downloadLabel", { name: file.name })}
                      onClick={() => onDownload(file)}
                    >
                      <Icon name="download" size={16} />
                      {t("proj.download")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      aria-label={t("proj.deleteLabel", { name: file.name })}
                      onClick={() => onRemoveFile(file)}
                    >
                      {t("proj.delete")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
