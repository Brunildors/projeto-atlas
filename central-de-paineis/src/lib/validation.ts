import { formatList, t } from "../i18n";
import type { DocType } from "../types";
import { isStateUf } from "./states";

const CPF_LENGTH = 11;

export const onlyDigits = (value: string): string => value.replace(/\D/g, "");

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, CPF_LENGTH);

  let masked = digits.slice(0, 3);
  if (digits.length > 3) masked += `.${digits.slice(3, 6)}`;
  if (digits.length > 6) masked += `.${digits.slice(6, 9)}`;
  if (digits.length > 9) masked += `-${digits.slice(9, 11)}`;

  return masked;
}

function checkDigit(digits: string, weight: number): number {
  let sum = 0;

  for (let i = 0; i < digits.length; i += 1) {
    sum += Number(digits[i]) * (weight - i);
  }

  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);

  if (digits.length !== CPF_LENGTH) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // 111.111.111-11 e afins passam na conta mas não são cpf

  if (checkDigit(digits.slice(0, 9), 10) !== Number(digits[9])) return false;
  if (checkDigit(digits.slice(0, 10), 11) !== Number(digits[10])) return false;

  return true;
}

export function cpfError(value: string): string | null {
  const digits = onlyDigits(value);

  if (digits.length === 0) return t("val.cpf.empty");
  if (digits.length < CPF_LENGTH) return t("val.cpf.short");
  if (!isValidCpf(digits)) return t("val.cpf.invalid");

  return null;
}

const CNPJ_LENGTH = 14;

export const normalizeDocument = (value: string): string =>
  value.toUpperCase().replace(/[^0-9A-Z]/g, "");

export function formatCnpj(value: string): string {
  const chars = normalizeDocument(value).slice(0, CNPJ_LENGTH);

  let masked = chars.slice(0, 2);
  if (chars.length > 2) masked += `.${chars.slice(2, 5)}`;
  if (chars.length > 5) masked += `.${chars.slice(5, 8)}`;
  if (chars.length > 8) masked += `/${chars.slice(8, 12)}`;
  if (chars.length > 12) masked += `-${chars.slice(12, 14)}`;

  return masked;
}

// já aceita o cnpj alfanumérico novo: cada caractere vale o código ASCII menos 48,
// então pros números dá o mesmo resultado da conta antiga
function cnpjCheckDigit(chars: string): number {
  let sum = 0;
  let weight = 2;

  for (let i = chars.length - 1; i >= 0; i -= 1) {
    sum += (chars.charCodeAt(i) - 48) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCnpj(value: string): boolean {
  const chars = normalizeDocument(value);

  if (!/^[0-9A-Z]{12}\d{2}$/.test(chars)) return false;
  if (/^(.)\1{13}$/.test(chars)) return false;

  if (cnpjCheckDigit(chars.slice(0, 12)) !== Number(chars[12])) return false;
  if (cnpjCheckDigit(chars.slice(0, 13)) !== Number(chars[13])) return false;

  return true;
}

export function cnpjError(value: string): string | null {
  const chars = normalizeDocument(value);

  if (chars.length === 0) return t("val.cnpj.empty");
  if (chars.length < CNPJ_LENGTH) return t("val.cnpj.short");
  if (!/\d{2}$/.test(chars)) return t("val.cnpj.digits");
  if (!isValidCnpj(chars)) return t("val.cnpj.invalid");

  return null;
}

export const DOC_LABEL: Record<DocType, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
};

export const DOC_PLACEHOLDER: Record<DocType, string> = {
  cpf: "000.000.000-00",
  cnpj: "00.000.000/0000-00",
};

export const DOC_MASKED_LENGTH: Record<DocType, number> = {
  cpf: 14,
  cnpj: 18,
};

export const formatDocument = (type: DocType, value: string): string =>
  type === "cpf" ? formatCpf(value) : formatCnpj(value);

export const documentError = (type: DocType, value: string): string | null =>
  type === "cpf" ? cpfError(value) : cnpjError(value);

export const PASSWORD_MIN_LENGTH = 8;

export const SPECIAL_CHARACTERS = "!@#$%^&*()-_=+[]{};:'\",.<>/?\|`~";

export interface PasswordChecks {
  length: boolean;
  uppercase: boolean;
  special: boolean;
}

export function checkPassword(value: string): PasswordChecks {
  return {
    length: value.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-ZÀ-ÖØ-Þ]/.test(value),
    special: value.split("").some((char) => SPECIAL_CHARACTERS.includes(char)),
  };
}

export const isPasswordValid = (value: string): boolean =>
  Object.values(checkPassword(value)).every(Boolean);

export function passwordError(value: string): string | null {
  if (value.length === 0) return t("val.password.empty");

  const checks = checkPassword(value);
  const missing: string[] = [];

  if (!checks.length) missing.push(t("val.password.length", { n: PASSWORD_MIN_LENGTH }));
  if (!checks.uppercase) missing.push(t("val.password.upper"));
  if (!checks.special) missing.push(t("val.password.special"));

  if (missing.length === 0) return null;

  return t("val.password.needs", { list: formatList(missing) });
}

const NAME_LETTERS = "A-Za-zÀ-ÖØ-öø-ÿ";

const NAME_PATTERN = new RegExp(`^[${NAME_LETTERS} '.-]+$`);

const NAME_PART_MIN_LENGTH = 2;

export const normalizeName = (value: string): string => value.trim().replace(/\s+/g, " ");

export const plainText = (value: string): string =>
  normalizeName(value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase());

export function fullNameError(value: string): string | null {
  const name = normalizeName(value);

  if (name.length === 0) return t("val.name.empty");
  if (!NAME_PATTERN.test(name)) return t("val.name.chars");

  const parts = name.split(" ").filter((part) => part.length >= NAME_PART_MIN_LENGTH);
  if (parts.length < 2) return t("val.name.surname");

  return null;
}

export function socialNameError(value: string): string | null {
  const name = normalizeName(value);

  if (name.length === 0) return null;
  if (name.length < NAME_PART_MIN_LENGTH) return t("val.social.short");
  if (!NAME_PATTERN.test(name)) return t("val.social.chars");

  return null;
}

const PHONE_LANDLINE_LENGTH = 10;

const PHONE_MOBILE_LENGTH = 11;

export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, PHONE_MOBILE_LENGTH);

  if (digits.length <= 2) return digits;

  const ddd = `(${digits.slice(0, 2)}) `;
  const rest = digits.slice(2);

  if (rest.length <= 8) {
    if (rest.length <= 4) return ddd + rest;
    return `${ddd}${rest.slice(0, 4)}-${rest.slice(4)}`;
  }

  return `${ddd}${rest.slice(0, 5)}-${rest.slice(5)}`;
}

export function isValidPhone(value: string): boolean {
  const digits = onlyDigits(value);

  if (digits.length !== PHONE_LANDLINE_LENGTH && digits.length !== PHONE_MOBILE_LENGTH) {
    return false;
  }

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11) return false;

  const first = digits[2];
  return digits.length === PHONE_MOBILE_LENGTH ? first === "9" : first >= "2" && first <= "5";
}

export function phoneError(value: string): string | null {
  const digits = onlyDigits(value);

  if (digits.length === 0) return t("val.phone.empty");
  if (digits.length < PHONE_LANDLINE_LENGTH) return t("val.phone.short");
  if (!isValidPhone(digits)) return t("val.phone.invalid");

  return null;
}

export const MIN_AGE = 14;

const MAX_AGE = 120;

export function isRealIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function ageOn(birthIso: string, todayIso: string): number {
  const years = Number(todayIso.slice(0, 4)) - Number(birthIso.slice(0, 4));
  return todayIso.slice(5) < birthIso.slice(5) ? years - 1 : years;
}

export function birthDateError(value: string, todayIso: string): string | null {
  if (value === "") return t("val.birth.empty");
  if (!isRealIsoDate(value)) return t("val.birth.invalid");
  if (value > todayIso) return t("val.birth.future");

  const age = ageOn(value, todayIso);
  if (age < MIN_AGE) return t("val.birth.minAge", { n: MIN_AGE });
  if (age > MAX_AGE) return t("val.birth.maxAge");

  return null;
}

const CEP_LENGTH = 8;

export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, CEP_LENGTH);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function cepError(value: string): string | null {
  const digits = onlyDigits(value);

  if (digits.length === 0) return t("val.cep.empty");
  if (digits.length < CEP_LENGTH) return t("val.cep.short");
  if (digits.startsWith("00000")) return t("val.cep.invalid");

  return null;
}

export function addressTextError(value: string, field: "street" | "district"): string | null {
  const text = normalizeName(value);

  if (text.length === 0) return t(field === "street" ? "val.street.empty" : "val.district.empty");
  if (text.length < 3) return t(field === "street" ? "val.street.short" : "val.district.short");

  return null;
}

export function addressNumberError(value: string): string | null {
  const text = value.trim();

  if (text.length === 0) return t("val.number.empty");
  if (!/^(\d{1,6}[A-Za-z]?|[Ss]\/?[Nn])$/.test(text)) return t("val.number.invalid");

  return null;
}

export const COMPLEMENT_MAX_LENGTH = 60;

export function complementError(value: string): string | null {
  return value.trim().length > COMPLEMENT_MAX_LENGTH ? t("val.complement.long", { n: COMPLEMENT_MAX_LENGTH }) : null;
}

export function cityError(value: string): string | null {
  const name = normalizeName(value);

  if (name.length === 0) return t("val.city.empty");
  if (name.length < 2 || !NAME_PATTERN.test(name)) return t("val.city.invalid");

  return null;
}

export const stateError = (value: string): string | null => (isStateUf(value) ? null : t("val.state.empty"));
