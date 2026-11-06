const PREFIX = "central-de-paineis:";

export interface RecordStore<T extends { id: string; document: string }> {
  listFor: (document: string) => T[];
  listAll: () => T[];
  save: (record: T) => boolean;
  saveMany: (records: T[]) => boolean;
  remove: (id: string) => boolean;
  removeMany: (ids: string[]) => boolean;
}

function upgradeOwner(value: Record<string, unknown>): Record<string, unknown> {
  if (typeof value.document === "string" || typeof value.cpf !== "string") return value;

  const { cpf, ...rest } = value;
  return { ...rest, document: cpf };
}

export function createRecordStore<T extends { id: string; document: string; createdAt: string }>(
  key: string,
  isValid: (value: unknown) => value is T,
  upgrade: (value: Record<string, unknown>) => Record<string, unknown> = (value) => value,
): RecordStore<T> {
  const storageKey = PREFIX + key;

  function readAll(): T[] {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return [];

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item: unknown) => (isObject(item) ? upgrade(upgradeOwner(item)) : item))
        .filter(isValid);
    } catch {
      return [];
    }
  }

  function writeAll(records: T[]): boolean {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(records));
      return true;
    } catch {
      return false;
    }
  }

  const newestFirst = (records: T[]): T[] =>
    records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    listFor: (document) => newestFirst(readAll().filter((record) => record.document === document)),

    listAll: () => newestFirst(readAll()),

    save: (record) => writeAll([...readAll().filter((item) => item.id !== record.id), record]),

    saveMany: (records) => {
      const ids = new Set(records.map((record) => record.id));
      return writeAll([...readAll().filter((item) => !ids.has(item.id)), ...records]);
    },

    remove: (id) => writeAll(readAll().filter((item) => item.id !== id)),

    removeMany: (ids) => {
      const gone = new Set(ids);
      return writeAll(readAll().filter((item) => !gone.has(item.id)));
    },
  };
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
