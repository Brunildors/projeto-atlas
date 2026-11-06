import { t } from "../i18n";
import type { ProjectFile } from "../types";
import { formatFileSize } from "./format";
import { createRecordStore, isObject, newId } from "./records";
import { normalizeName } from "./validation";

function isProjectFile(value: unknown): value is ProjectFile {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.document === "string" &&
    typeof value.projectId === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.fileName === "string" &&
    typeof value.type === "string" &&
    typeof value.size === "number" &&
    typeof value.createdAt === "string"
  );
}

const store = createRecordStore<ProjectFile>("arquivos-projetos", isProjectFile);

export const listFilesOf = store.listFor;

export function countByProject(files: ProjectFile[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const file of files) counts.set(file.projectId, (counts.get(file.projectId) ?? 0) + 1);
  return counts;
}

const DB_NAME = "central-de-paineis";
const DB_VERSION = 1;
const CONTENT = "arquivos-projetos";

let connection: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (!connection) {
    connection = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("Este navegador não tem IndexedDB."));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => request.result.createObjectStore(CONTENT);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    connection.catch(() => {
      connection = null;
    });
  }
  return connection;
}

async function withContent<T>(
  mode: IDBTransactionMode,
  work: (content: IDBObjectStore) => IDBRequest<T> | undefined,
): Promise<T | undefined> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CONTENT, mode);
    const request = work(transaction.objectStore(CONTENT));
    transaction.oncomplete = () => resolve(request?.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function addProjectFile(
  document: string,
  projectId: string,
  draft: { name: string; description: string; file: File },
): Promise<boolean> {
  const record: ProjectFile = {
    id: newId(),
    document,
    projectId,
    name: normalizeName(draft.name),
    description: draft.description.trim(),
    fileName: draft.file.name,
    type: draft.file.type,
    size: draft.file.size,
    createdAt: new Date().toISOString(),
  };

  try {
    await withContent("readwrite", (content) => content.put(draft.file, record.id));
  } catch {
    return false;
  }

  if (!store.save(record)) {
    await withContent("readwrite", (content) => content.delete(record.id)).catch(() => undefined);
    return false;
  }

  return true;
}

export async function downloadProjectFile(file: ProjectFile): Promise<boolean> {
  let blob: unknown;
  try {
    blob = await withContent("readonly", (content) => content.get(file.id));
  } catch {
    return false;
  }
  if (!(blob instanceof Blob)) return false;

  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = file.fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export async function removeProjectFile(file: ProjectFile): Promise<boolean> {
  if (!store.remove(file.id)) return false;
  await withContent("readwrite", (content) => content.delete(file.id)).catch(() => undefined);
  return true;
}

export async function removeProjectFiles(document: string, projectId: string): Promise<void> {
  const files = listFilesOf(document).filter((file) => file.projectId === projectId);
  if (files.length === 0) return;

  store.removeMany(files.map((file) => file.id));
  await withContent("readwrite", (content) => {
    for (const file of files) content.delete(file.id);
    return undefined;
  }).catch(() => undefined);
}

export const PROJECT_FILE_MAX_BYTES = 25 * 1024 * 1024;
export const PROJECT_FILE_NAME_MAX_LENGTH = 120;
export const PROJECT_FILE_DESCRIPTION_MAX_LENGTH = 500;

export function projectFileError(file: File | null): string | null {
  if (!file) return t("file.val.choose");
  if (file.size === 0) return t("file.val.empty");
  if (file.size > PROJECT_FILE_MAX_BYTES) {
    return t("file.val.tooBig", { size: formatFileSize(PROJECT_FILE_MAX_BYTES) });
  }
  return null;
}

export function projectFileNameError(value: string): string | null {
  const name = normalizeName(value);
  if (name.length === 0) return t("file.val.nameEmpty");
  if (name.length < 2) return t("proj.val.tooShort");
  if (name.length > PROJECT_FILE_NAME_MAX_LENGTH) {
    return t("proj.val.tooLong", { n: PROJECT_FILE_NAME_MAX_LENGTH });
  }
  return null;
}

export function projectFileDescriptionError(value: string): string | null {
  const description = value.trim();
  if (description.length === 0) return t("file.val.descEmpty");
  if (description.length < 5) return t("file.val.descShort");
  return null;
}

export function suggestedName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  return normalizeName(withoutExtension.replace(/[_-]+/g, " ")).slice(0, PROJECT_FILE_NAME_MAX_LENGTH);
}
