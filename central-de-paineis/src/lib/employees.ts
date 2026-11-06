import type { Address, DocType, Employee } from "../types";
import { isObject } from "./records";
import { normalizeDocument, normalizeName, onlyDigits } from "./validation";

const STORAGE_KEY = "central-de-paineis:funcionarios";

const EMPTY_ADDRESS: Address = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

function isAddress(value: unknown): value is Address {
  return isObject(value) && Object.keys(EMPTY_ADDRESS).every((key) => typeof value[key] === "string");
}

export function isEmployee(value: unknown): value is Employee {
  return (
    isObject(value) &&
    (value.docType === "cpf" || value.docType === "cnpj") &&
    typeof value.document === "string" &&
    typeof value.fullName === "string" &&
    typeof value.socialName === "string" &&
    typeof value.birthDate === "string" &&
    typeof value.phone === "string" &&
    isAddress(value.address) &&
    typeof value.registeredAt === "string"
  );
}

function upgradeLegacy(value: unknown): unknown {
  if (!isObject(value) || typeof value.document === "string" || typeof value.cpf !== "string") {
    return value;
  }

  const { cpf, ...rest } = value;
  return { birthDate: "", address: EMPTY_ADDRESS, ...rest, docType: "cpf", document: cpf };
}

export function listEmployees(): Employee[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(upgradeLegacy).filter(isEmployee);
  } catch {
    return [];
  }
}

export function findEmployee(document: string): Employee | null {
  const key = normalizeDocument(document);
  return listEmployees().find((employee) => employee.document === key) ?? null;
}

export function saveEmployee(employee: Employee): boolean {
  const others = listEmployees().filter((item) => item.document !== employee.document);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...others, employee]));
    return true;
  } catch {
    return false;
  }
}

export function createEmployee(draft: {
  docType: DocType;
  document: string;
  fullName: string;
  socialName: string;
  birthDate: string;
  phone: string;
  address: Address;
}): Employee {
  const { address } = draft;

  return {
    docType: draft.docType,
    document: normalizeDocument(draft.document),
    fullName: normalizeName(draft.fullName),
    socialName: normalizeName(draft.socialName),
    birthDate: draft.birthDate,
    phone: onlyDigits(draft.phone),
    address: {
      cep: onlyDigits(address.cep),
      street: normalizeName(address.street),
      number: address.number.trim().toUpperCase(),
      complement: normalizeName(address.complement),
      district: normalizeName(address.district),
      city: normalizeName(address.city),
      state: address.state,
    },
    registeredAt: new Date().toISOString(),
  };
}

export const displayName = (employee: Employee): string =>
  employee.socialName.length > 0 ? employee.socialName : employee.fullName;
