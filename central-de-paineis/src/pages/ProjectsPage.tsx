import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { t } from "../i18n";
import { todayIso } from "../lib/calendar";
import {
  addProjectFile,
  countByProject,
  downloadProjectFile,
  listFilesOf,
  removeProjectFile,
  removeProjectFiles,
} from "../lib/projectFiles";
import {
  createProject,
  listProjects,
  nextStatus,
  removeProject,
  saveProject,
  saveProjectOrder,
} from "../lib/projects";
import type { DashboardPageProps, Project, ProjectFile } from "../types";
import { FileForm, type FileDraft } from "./projects/FileForm";
import { ProjectDetail } from "./projects/ProjectDetail";
import { ProjectFolders } from "./projects/ProjectFolders";
import { ProjectForm, type ProjectDraft } from "./projects/ProjectForm";

const TAB_HASH = "#tarefas";

function readOpenId(): string | null {
  const [tab, id = ""] = window.location.hash.replace("#", "").split("/");
  return tab === "tarefas" && id !== "" ? id : null;
}

export function ProjectsPage({ session }: DashboardPageProps) {
  const [today] = useState(todayIso);
  const [projects, setProjects] = useState(() => listProjects(session.document));
  const [files, setFiles] = useState(() => listFilesOf(session.document));
  const [openId, setOpenId] = useState(readOpenId);
  const [creating, setCreating] = useState(false);
  const [addingFile, setAddingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      setOpenId(readOpenId());
      setAddingFile(false);
      setError(null);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const fileCounts = useMemo(() => countByProject(files), [files]);
  const open = openId ? projects.find((project) => project.id === openId) : undefined;
  const openFiles = open ? files.filter((file) => file.projectId === open.id) : [];

  function reload() {
    setProjects(listProjects(session.document));
    setFiles(listFilesOf(session.document));
  }

  function create(draft: ProjectDraft): boolean {
    if (!saveProject(createProject(session.document, draft, projects))) return false;
    setCreating(false);
    reload();
    return true;
  }

  function reorder(ids: string[]) {
    if (!saveProjectOrder(session.document, ids)) {
      setError(t("proj.err.order"));
    }
    reload();
  }

  function advance(project: Project) {
    saveProject({ ...project, status: nextStatus(project.status) });
    reload();
  }

  async function remove(project: Project) {
    if (!window.confirm(t("proj.confirm.remove", { title: project.title }))) return;

    removeProject(project.id);
    await removeProjectFiles(session.document, project.id);
    window.location.hash = TAB_HASH;
    reload();
  }

  async function addFile(draft: FileDraft): Promise<boolean> {
    if (!open || !(await addProjectFile(session.document, open.id, draft))) return false;
    setAddingFile(false);
    reload();
    return true;
  }

  async function download(file: ProjectFile) {
    setError(null);
    if (!(await downloadProjectFile(file))) {
      setError(t("proj.err.download", { name: file.name }));
    }
  }

  async function removeFile(file: ProjectFile) {
    if (!window.confirm(t("proj.confirm.removeFile", { name: file.name }))) return;

    setError(null);
    if (!(await removeProjectFile(file))) {
      setError(t("proj.err.removeFile"));
    }
    reload();
  }

  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {open ? (
        <ProjectDetail
          project={open}
          files={openFiles}
          today={today}
          onAdvance={() => advance(open)}
          onRemove={() => void remove(open)}
          onAddFile={() => setAddingFile(true)}
          onDownload={(file) => void download(file)}
          onRemoveFile={(file) => void removeFile(file)}
        />
      ) : (
        <ProjectFolders
          projects={projects}
          fileCounts={fileCounts}
          today={today}
          onCreate={() => setCreating(true)}
          onReorder={reorder}
        />
      )}

      <Modal
        open={creating}
        title={t("proj.create")}
        note={t("proj.create.note")}
        onClose={() => setCreating(false)}
      >
        {creating && <ProjectForm today={today} onSave={create} onCancel={() => setCreating(false)} />}
      </Modal>
      <Modal
        open={addingFile && open !== undefined}
        title={t("proj.addFile")}
        note={open ? t("proj.addFile.note", { title: open.title }) : undefined}
        onClose={() => setAddingFile(false)}
      >
        {addingFile && open && <FileForm onSave={addFile} onCancel={() => setAddingFile(false)} />}
      </Modal>
    </>
  );
}
