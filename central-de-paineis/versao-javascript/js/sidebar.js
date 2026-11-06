const STORAGE_KEY = "central-de-paineis:barra-recolhida";

export function readCollapsed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function storeCollapsed(collapsed) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  } catch {}
}
