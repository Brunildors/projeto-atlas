import type { Theme } from "../types";

const STORAGE_KEY = "central-de-paineis:tema";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const systemTheme = (): Theme => (window.matchMedia(DARK_QUERY).matches ? "dark" : "light");

export function readStoredTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return systemTheme();
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
