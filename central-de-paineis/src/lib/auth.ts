import { t, type MessageKey } from "../i18n";
import type { Employee, Session } from "../types";
import { isEmployee } from "./employees";
import { isObject } from "./records";
import { formatDocument } from "./validation";

const STORAGE_KEY = "central-de-paineis:sessao";

const API_URL = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly retryInSeconds?: number,
  ) {
    super(message);
  }
}

function isSession(value: unknown): value is Session {
  return (
    isObject(value) &&
    (value.docType === "cpf" || value.docType === "cnpj") &&
    typeof value.document === "string" &&
    typeof value.since === "string" &&
    typeof value.token === "string" &&
    value.token.length > 0
  );
}

export function readSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function storeSession(session: Session): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {}
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function createSession(employee: Employee, token: string): Session {
  return {
    docType: employee.docType,
    document: employee.document,
    since: new Date().toISOString(),
    token,
    fullName: employee.fullName,
    socialName: employee.socialName,
  };
}

export function sessionDisplayName(session: Session): string {
  if (session.socialName && session.socialName.length > 0) return session.socialName;
  if (session.fullName && session.fullName.length > 0) return session.fullName;
  return formatDocument(session.docType, session.document);
}

export interface SignedIn {
  session: Session;
  employee: Employee;
}

export interface PendingVerification {
  document: string;
  phone: string;
  validMinutes: number;
  resendInSeconds: number;
  sms: { to: string; code: string } | null;
}

export type AuthResult = { kind: "signedIn"; signedIn: SignedIn } | { kind: "verify"; pending: PendingVerification };

async function post(path: string, body: unknown, token?: string): Promise<Response> {
  if (API_URL === "") throw new AuthError(t("err.notConfigured"));

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(`${API_URL}/${path}`, {
      method: "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new AuthError(t("err.network"));
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function refusal(response: Response, data: unknown): AuthError {
  const body = isObject(data) ? data : {};
  const code = typeof body.codigo === "string" ? body.codigo : undefined;
  const left = typeof body.tentativasRestantes === "number" ? body.tentativasRestantes : undefined;
  const wait = typeof body.reenvioEmSegundos === "number" ? body.reenvioEmSegundos : undefined;

  let message: string;
  if (code === "CODIGO_INCORRETO" && left !== undefined) message = t("err.CODIGO_INCORRETO_RESTAM", { n: left });
  else if (code === "AGUARDE") message = t("err.AGUARDE", { s: wait ?? 60 });
  else if (code && `err.${code}` in KNOWN_CODES) message = t(`err.${code}` as MessageKey);
  else if (typeof body.erro === "string") message = body.erro;
  else message = t("err.http", { status: response.status });

  return new AuthError(message, response.status, code, wait);
}

const KNOWN_CODES: Record<string, true> = Object.fromEntries(
  [
    "CREDENCIAIS_INVALIDAS",
    "MUITAS_TENTATIVAS",
    "DOCUMENTO_EXISTE",
    "DADOS_INVALIDOS",
    "INDISPONIVEL",
    "CODIGO_INCORRETO",
    "CODIGO_EXPIRADO",
    "CODIGO_BLOQUEADO",
    "JA_VERIFICADO",
    "INVALIDO",
  ].map((code) => [`err.${code}`, true]),
);

function toSignedIn(data: unknown): SignedIn {
  if (!isObject(data) || typeof data.token !== "string" || !isEmployee(data.usuario)) {
    throw new AuthError(t("err.unexpected"));
  }
  const { docType, document, fullName, socialName, birthDate, phone, address, registeredAt } = data.usuario;
  const employee: Employee = { docType, document, fullName, socialName, birthDate, phone, address, registeredAt };
  return { session: createSession(employee, data.token), employee };
}

function toPending(data: unknown): PendingVerification {
  if (!isObject(data) || data.verificar !== true || typeof data.documento !== "string") {
    throw new AuthError(t("err.unexpected"));
  }
  const sms = isObject(data.sms) && typeof data.sms.codigo === "string" ? data.sms : null;
  return {
    document: data.documento,
    phone: typeof data.telefone === "string" ? data.telefone : "",
    validMinutes: typeof data.validoMinutos === "number" ? data.validoMinutos : 10,
    resendInSeconds: typeof data.reenvioEmSegundos === "number" ? data.reenvioEmSegundos : 0,
    sms: sms ? { to: String(sms.para ?? ""), code: String(sms.codigo) } : null,
  };
}

// 202 = a conta ainda não confirmou o telefone, então vai pra tela do código
async function readAuthResult(response: Response): Promise<AuthResult> {
  const data = await readJson(response);
  if (!response.ok) throw refusal(response, data);
  return response.status === 202
    ? { kind: "verify", pending: toPending(data) }
    : { kind: "signedIn", signedIn: toSignedIn(data) };
}

export async function signIn(document: string, password: string): Promise<AuthResult> {
  return readAuthResult(await post("auth/login", { document, password }));
}

export async function signUp(employee: Employee, password: string): Promise<AuthResult> {
  const { docType, document, fullName, socialName, birthDate, phone, address } = employee;
  return readAuthResult(
    await post("auth/cadastro", { docType, document, fullName, socialName, birthDate, phone, address, password }),
  );
}

export async function verifyPhone(document: string, code: string): Promise<SignedIn> {
  const response = await post("auth/verificar", { document, code });
  const data = await readJson(response);
  if (!response.ok) throw refusal(response, data);
  return toSignedIn(data);
}

export async function resendCode(document: string): Promise<PendingVerification> {
  const response = await post("auth/reenviar", { document });
  const data = await readJson(response);
  if (!response.ok) throw refusal(response, data);
  return toPending(data);
}

export function signOut(session: Session): void {
  // nem espera o servidor, sair tem que ser na hora
  post("auth/sair", undefined, session.token).catch(() => {});
}
