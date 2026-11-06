export type Lang = "pt-BR" | "en" | "es" | "zh-CN" | "ja" | "de" | "fr";

export interface Language {
  id: Lang;
  label: string;
  agentName: string;
}

export const LANGUAGES: Language[] = [
  { id: "pt-BR", label: "Português (Brasil)", agentName: "português do Brasil" },
  { id: "en", label: "English", agentName: "inglês" },
  { id: "es", label: "Español", agentName: "espanhol" },
  { id: "zh-CN", label: "中文（简体）", agentName: "chinês simplificado" },
  { id: "ja", label: "日本語", agentName: "japonês" },
  { id: "de", label: "Deutsch", agentName: "alemão" },
  { id: "fr", label: "Français", agentName: "francês" },
];

export const DEFAULT_LANG: Lang = "pt-BR";

const isLang = (value: unknown): value is Lang => LANGUAGES.some((language) => language.id === value);

export type Messages<K extends string> = Record<Lang, Record<K, string>>;

// o pt-BR define as chaves e os outros 6 idiomas são obrigados a ter as mesmas.
// se esquecer uma tradução o tsc já reclama
export function defineMessages<K extends string>(
  ptBR: Record<K, string>,
  others: Record<Exclude<Lang, "pt-BR">, Record<K, string>>,
): Messages<K> {
  return { "pt-BR": ptBR, ...others };
}

const STORAGE_KEY = "central-de-paineis:idioma";

function readStored(): Lang {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {}
  return DEFAULT_LANG;
}

let current: Lang = readStored();
const listeners = new Set<() => void>();

export const getLang = (): Lang => current;

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
  document.documentElement.lang = lang;
  for (const listener of listeners) listener();
}

export function subscribeLang(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

document.documentElement.lang = current;
