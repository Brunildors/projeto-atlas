const STORAGE_KEY = "central-de-paineis:tema";

const DEFAULT_MODE = "system";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const isThemeMode = (value) => value === "light" || value === "dark" || value === "system";

export function readStoredMode() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isThemeMode(saved) ? saved : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function storeMode(mode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {}
}

export function resolveTheme(mode) {
  if (mode !== "system") return mode;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function applyTheme(mode) {
  const theme = resolveTheme(mode);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function watchSystemTheme(onChange) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
