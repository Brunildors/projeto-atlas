const CPF_LENGTH = 11;

export const onlyDigits = (value) => value.replace(/\D/g, "");

export function formatCpf(value) {
  const digits = onlyDigits(value).slice(0, CPF_LENGTH);

  let masked = digits.slice(0, 3);
  if (digits.length > 3) masked += `.${digits.slice(3, 6)}`;
  if (digits.length > 6) masked += `.${digits.slice(6, 9)}`;
  if (digits.length > 9) masked += `-${digits.slice(9, 11)}`;

  return masked;
}

function checkDigit(digits, weight) {
  let sum = 0;

  for (let i = 0; i < digits.length; i += 1) {
    sum += Number(digits[i]) * (weight - i);
  }

  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCpf(value) {
  const digits = onlyDigits(value);

  if (digits.length !== CPF_LENGTH) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  if (checkDigit(digits.slice(0, 9), 10) !== Number(digits[9])) return false;
  if (checkDigit(digits.slice(0, 10), 11) !== Number(digits[10])) return false;

  return true;
}

export function cpfError(value) {
  const digits = onlyDigits(value);

  if (digits.length === 0) return "Informe o CPF do funcionário.";
  if (digits.length < CPF_LENGTH) return "O CPF está incompleto: faltam dígitos.";
  if (!isValidCpf(digits)) return "CPF inválido — confira os números digitados.";

  return null;
}

export const PASSWORD_MIN_LENGTH = 8;

export const SPECIAL_CHARACTERS = "!@#$%^&*()-_=+[]{};:'\",.<>/?\\|`~";

export function checkPassword(value) {
  return {
    length: value.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-ZÀ-ÖØ-Þ]/.test(value),
    special: value.split("").some((char) => SPECIAL_CHARACTERS.includes(char)),
  };
}

export const isPasswordValid = (value) => Object.values(checkPassword(value)).every(Boolean);

export function passwordError(value) {
  if (value.length === 0) return "Informe a senha.";

  const checks = checkPassword(value);
  const missing = [];

  if (!checks.length) missing.push(`${PASSWORD_MIN_LENGTH} caracteres`);
  if (!checks.uppercase) missing.push("1 letra maiúscula");
  if (!checks.special) missing.push("1 caractere especial");

  if (missing.length === 0) return null;

  const list =
    missing.length === 1
      ? missing[0]
      : `${missing.slice(0, -1).join(", ")} e ${missing[missing.length - 1]}`;

  return `A senha precisa de pelo menos ${list}.`;
}

const NAME_LETTERS = "A-Za-zÀ-ÖØ-öø-ÿ";

const NAME_PATTERN = new RegExp(`^[${NAME_LETTERS} '.-]+$`);

const NAME_PART_MIN_LENGTH = 2;

export const normalizeName = (value) => value.trim().replace(/\s+/g, " ");

export function fullNameError(value) {
  const name = normalizeName(value);

  if (name.length === 0) return "Informe o nome completo.";
  if (!NAME_PATTERN.test(name)) return "O nome aceita apenas letras, espaços, apóstrofo e hífen.";

  const parts = name.split(" ").filter((part) => part.length >= NAME_PART_MIN_LENGTH);
  if (parts.length < 2) return "Informe o nome e ao menos um sobrenome.";

  return null;
}

export function socialNameError(value) {
  const name = normalizeName(value);

  if (name.length === 0) return null;
  if (name.length < NAME_PART_MIN_LENGTH) return "O nome social está curto demais.";
  if (!NAME_PATTERN.test(name)) {
    return "O nome social aceita apenas letras, espaços, apóstrofo e hífen.";
  }

  return null;
}

const PHONE_LANDLINE_LENGTH = 10;

const PHONE_MOBILE_LENGTH = 11;

export function formatPhone(value) {
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

export function isValidPhone(value) {
  const digits = onlyDigits(value);

  if (digits.length !== PHONE_LANDLINE_LENGTH && digits.length !== PHONE_MOBILE_LENGTH) {
    return false;
  }

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11) return false;

  const first = digits[2];
  return digits.length === PHONE_MOBILE_LENGTH ? first === "9" : first >= "2" && first <= "5";
}

export function phoneError(value) {
  const digits = onlyDigits(value);

  if (digits.length === 0) return "Informe o telefone.";
  if (digits.length < PHONE_LANDLINE_LENGTH) {
    return "O telefone está incompleto: informe o DDD e o número.";
  }
  if (!isValidPhone(digits)) {
    return "Telefone inválido — confira o DDD e o número (celular começa com 9).";
  }

  return null;
}
