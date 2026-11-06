import { findEmployee } from "./employees.js";
import { formatCpf, onlyDigits } from "./validation.js";

const STORAGE_KEY = "central-de-paineis:sessao";

function isSession(value) {
  if (typeof value !== "object" || value === null) return false;
  return typeof value.cpf === "string" && typeof value.since === "string";
}

export function readSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function storeSession(session) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}

export function createSession(cpf) {
  const digits = onlyDigits(cpf);
  const employee = findEmployee(digits);

  return {
    cpf: digits,
    since: new Date().toISOString(),
    fullName: employee?.fullName,
    socialName: employee?.socialName,
  };
}

export function sessionDisplayName(session) {
  if (session.socialName && session.socialName.length > 0) return session.socialName;
  if (session.fullName && session.fullName.length > 0) return session.fullName;
  return formatCpf(session.cpf);
}
