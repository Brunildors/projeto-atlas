import { normalizeName, onlyDigits } from "./validation.js";

const STORAGE_KEY = "central-de-paineis:funcionarios";

function isEmployee(value) {
  if (typeof value !== "object" || value === null) return false;

  return (
    typeof value.cpf === "string" &&
    typeof value.fullName === "string" &&
    typeof value.socialName === "string" &&
    typeof value.phone === "string" &&
    typeof value.registeredAt === "string"
  );
}

export function listEmployees() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isEmployee);
  } catch {
    return [];
  }
}

export function findEmployee(cpf) {
  const digits = onlyDigits(cpf);
  return listEmployees().find((employee) => employee.cpf === digits) ?? null;
}

export const isRegistered = (cpf) => findEmployee(cpf) !== null;

export function saveEmployee(employee) {
  const others = listEmployees().filter((item) => item.cpf !== employee.cpf);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...others, employee]));
    return true;
  } catch {
    return false;
  }
}

export function createEmployee(draft) {
  return {
    cpf: onlyDigits(draft.cpf),
    fullName: normalizeName(draft.fullName),
    socialName: normalizeName(draft.socialName),
    phone: onlyDigits(draft.phone),
    registeredAt: new Date().toISOString(),
  };
}

export const displayName = (employee) =>
  employee.socialName.length > 0 ? employee.socialName : employee.fullName;
