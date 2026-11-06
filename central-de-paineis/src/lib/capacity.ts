import { formatList, t, tn, type MessageKey } from "../i18n";
import type { Session } from "../types";
import { formatDayMonth, formatNumber1 } from "./format";
import { isObject } from "./records";

const API_URL = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");

// cenário 1 = o estado real (o que veio do azure devops). esse nunca muda,
// as mudanças do planejamento só são gravadas nos cenários de simulação
export const BASELINE_ID = 1;

export class CapacityError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export type Faixa = "Ocioso" | "Saudavel" | "Em risco" | "Sobrecarregado" | "Conflito" | "Ausente";

export interface Uso {
  pct: number | null;
  faixa: Faixa;
  alocadas: number;
  disponiveis: number;
}

export interface Cenario {
  id: number;
  nome: string;
  descricao: string | null;
  base: boolean;
  alteracoes: number;
}

export interface Projeto {
  id: string;
  nome: string;
  origem: string;
  estado: string;
}

export interface Contexto {
  hoje: string;
  cenarios: Cenario[];
  projetos: Projeto[];
  equipes: { id: string; nome: string; projeto: string }[];
  sincronizacao: { projeto: string; estado: string; em: string; detalhes: string | null }[];
}

export interface Heatmap {
  semanas: string[];
  semanaAtual: string;
  pessoas: {
    id: number;
    nome: string;
    cargo: string;
    equipes: string[];
    celulas: Record<string, Uso>;
  }[];
  resumo: {
    sobrecarregados: number;
    emRisco: number;
    ociosos: number;
    conflitos: number;
    saudaveis: number;
    media: number | null;
  };
}

export interface Sprint {
  id: string;
  nome: string;
  inicio: string;
  fim: string;
  encerrada: boolean;
}

export interface Ausencia {
  inicio: string;
  fim: string;
  motivo: string;
  horasDia: number;
}

export interface PessoaTimeline {
  id: number;
  nome: string;
  cargo: string;
  equipes: string[];
  uso: Record<string, Uso>;
  ausencias: Ausencia[];
}

export interface Item {
  id: number;
  titulo: string;
  tipo: string;
  estado: string;
  esforco: number;
  origem: string;
  sprint: string | null;
  responsavel: number | null;
  movido: boolean;
  sprintOriginal: string | null;
  responsavelOriginal: number | null;
}

export interface Timeline {
  projeto: Projeto | null;
  sprints: Sprint[];
  pessoas: PessoaTimeline[];
  itens: Item[];
  feriados: { data: string; nome: string }[];
}

export type Gravidade = "alta" | "media" | "baixa";

export interface Alerta {
  origem: "registrado" | "calculado";
  tipo: string;
  codigo: string | null;
  dados: Record<string, unknown>;
  gravidade: Gravidade;
  pessoa: number | null;
  nome: string | null;
  data: string;
  mensagem: string;
}

export interface Aviso {
  tipo: string;
  codigo?: string;
  dados?: Record<string, unknown>;
  mensagem: string;
}

export interface Impacto {
  pessoa: number;
  nome: string;
  sprint: string;
  sprintNome: string;
  antes: Uso;
  depois: Uso;
}

export interface Simulacao {
  item: { id: number; titulo: string; esforco: number; estado: string };
  de: { sprint: string | null; responsavel: number | null };
  para: { sprint: string; responsavel: number };
  permitido: boolean;
  bloqueio: string | null;
  bloqueioCodigo?: string | null;
  avisos: Aviso[];
  impacto: Impacto[];
  salvo?: boolean;
}

export interface Destino {
  item: number;
  sprint: string;
  responsavel: number;
}

export interface SemanaPrevista {
  disponiveis: number;
  planejadas: number;
  chega: number;
  acumulado: number;
  pctPlano: number | null;
  faixaPlano: Faixa;
  pct: number | null;
  faixa: Faixa;
}

export interface CausaPrevisao {
  codigo: string;
  dados: Record<string, unknown>;
}

export interface SugestaoPrevisao {
  item: { id: number; titulo: string; esforco: number; sprint: string; sprintNome: string; projeto: string };
  para: { id: number; nome: string; pct: number | null; faixa: Faixa; mesmaEquipe: boolean };
}

export type NivelPrevisao = "alta" | "media" | "ok";

export interface PessoaPrevisao {
  id: number;
  nome: string;
  cargo: string;
  equipes: string[];
  nivel: NivelPrevisao;
  agora: boolean;
  piora: boolean;
  primeira: string | null;
  quando: string | null;
  faixaAgora: Faixa | null;
  pico: { pct: number | null; semana: string; faixa: Faixa } | null;
  acumuladoMax: number;
  acumuladoFim: number;
  normaliza: string | null;
  tendencia: "sobe" | "estavel" | "desce";
  causas: CausaPrevisao[];
  sugestao: SugestaoPrevisao | null;
  semanas: Record<string, SemanaPrevista>;
}

export interface Previsao {
  hoje: string;
  semanaAtual: string;
  teto: number;
  ate: string | null;
  semanas: string[];
  resumo: {
    alta: number;
    media: number;
    pioram: number;
    horasAcumuladas: number;
    primeiro: { pessoa: number; nome: string; semana: string; nivel: NivelPrevisao } | null;
  };
  pessoas: PessoaPrevisao[];
}

export const FAIXAS: Faixa[] = ["Ausente", "Ocioso", "Saudavel", "Em risco", "Sobrecarregado", "Conflito"];

export const faixaLabel = (faixa: Faixa): string => t(`faixa.${faixa}` as MessageKey);
export const faixaHint = (faixa: Faixa): string => t(`faixaHint.${faixa}` as MessageKey);

export const faixaClass = (faixa: Faixa): string => `faixa--${faixa.toLowerCase().replace(/\s+/g, "-")}`;

export const cargoLabel = (cargo: string): string =>
  KNOWN_CARGOS.includes(cargo) ? t(`cargo.${cargo}` as MessageKey) : cargo.toLowerCase();
const KNOWN_CARGOS = ["COLABORADOR", "COORDENADOR", "GERENTE", "DIRETOR"];

const KNOWN_ALERT_TYPES = ["SOBRECARGA", "CONFLITO", "AUSENCIA", "FERIADO", "SOBREPOSICAO", "OCIOSIDADE", "PRAZO", "SINCRONIZACAO", "CAPACIDADE", "EQUIPE"];
export const alertTypeLabel = (tipo: string): string =>
  KNOWN_ALERT_TYPES.includes(tipo) ? t(`alertType.${tipo}` as MessageKey) : tipo;

export const gravidadeLabel = (gravidade: Gravidade): string => t(`gravidade.${gravidade}`);

export const formatPct = (uso: Uso | undefined): string => (uso && uso.pct !== null ? `${uso.pct}%` : "—");

export const formatHoras = (uso: Uso | undefined): string =>
  uso ? t("cap.hours", { a: formatNumber1(uso.alocadas), d: formatNumber1(uso.disponiveis) }) : t("cap.noRecord");

const str = (value: unknown): string => (typeof value === "string" ? value : value == null ? "" : String(value));
const num = (value: unknown): number => (typeof value === "number" ? value : Number(value) || 0);
const day = (value: unknown): string => (typeof value === "string" && value.length >= 10 ? formatDayMonth(value.slice(0, 10)) : str(value));

const period = (inicio: unknown, fim: unknown): string =>
  str(inicio).slice(0, 10) === str(fim).slice(0, 10) ? day(inicio) : `${day(inicio)}–${day(fim)}`;

export function alertText(alerta: Alerta): string {
  const d = alerta.dados ?? {};
  switch (alerta.codigo) {
    case "SOBRECARGA":
      return tn("alert.SOBRECARGA", num(d.semanas), { pct: num(d.pct), desde: day(d.desde) });
    case "CONFLITO":
      return tn("alert.CONFLITO", num(d.dias), { desde: day(d.desde) });
    case "AUSENCIA":
      return tn("alert.AUSENCIA", num(d.itens), {
        motivo: str(d.motivo), periodo: period(d.inicio, d.fim), sprint: str(d.sprint), projeto: str(d.projeto),
      });
    case "AUSENCIA_EQUIPE":
      return t("alert.AUSENCIA_EQUIPE", {
        motivo: str(d.motivo), equipe: str(d.equipe), periodo: period(d.inicio, d.fim), horas: num(d.horasDia),
      });
    case "FERIADO": {
      const sprints = Array.isArray(d.sprints)
        ? d.sprints.map((s) => t("alert.sprintOf", { sprint: str((s as Record<string, unknown>).sprint), projeto: str((s as Record<string, unknown>).projeto) }))
        : [];
      return t("alert.FERIADO", { feriado: str(d.feriado), data: day(d.data), sprints: formatList(sprints) });
    }
    case "SOBREPOSICAO":
      return t("alert.SOBREPOSICAO", {
        sprint1: str(d.sprint1), projeto1: str(d.projeto1), sprint2: str(d.sprint2), projeto2: str(d.projeto2),
      });
    default:
      return alerta.mensagem;
  }
}

export function avisoText(aviso: Aviso): string {
  const d = aviso.dados ?? {};
  switch (aviso.codigo) {
    case "FORA_DA_EQUIPE":
      return t("aviso.FORA_DA_EQUIPE", { pessoa: str(d.pessoa), sprint: str(d.sprint) });
    case "AUSENCIA":
      return t("aviso.AUSENCIA", { motivo: str(d.motivo), periodo: period(d.inicio, d.fim), sprint: str(d.sprint) });
    case "AUSENCIA_EQUIPE":
      return t("aviso.AUSENCIA_EQUIPE", {
        equipe: str(d.equipe), motivo: str(d.motivo), periodo: period(d.inicio, d.fim), sprint: str(d.sprint),
      });
    case "FERIADO":
      return t("aviso.FERIADO", { feriado: str(d.feriado), data: day(d.data), sprint: str(d.sprint) });
    default:
      return aviso.mensagem;
  }
}

const KNOWN_BLOCKS = ["SPRINT_NAO_ENCONTRADA", "PESSOA_NAO_ENCONTRADA", "OUTRO_PROJETO", "CONCLUIDO", "SPRINT_ENCERRADA", "MESMO_LUGAR"];

export const blockText = (sim: Simulacao): string | null =>
  sim.bloqueioCodigo && KNOWN_BLOCKS.includes(sim.bloqueioCodigo)
    ? t(`bloqueio.${sim.bloqueioCodigo}` as MessageKey)
    : sim.bloqueio;

export function causeText(causa: CausaPrevisao): string {
  const d = causa.dados ?? {};
  const ausencia = { motivo: str(d.motivo), equipe: str(d.equipe), periodo: period(d.inicio, d.fim), horas: num(d.horas) };
  switch (causa.codigo) {
    case "AUSENCIA":
      return t(num(d.horas) > 0 ? "prev.cause.AUSENCIA" : "prev.cause.AUSENCIA_TIGHT", ausencia);
    case "AUSENCIA_EQUIPE":
      return t(num(d.horas) > 0 ? "prev.cause.AUSENCIA_EQUIPE" : "prev.cause.AUSENCIA_EQUIPE_TIGHT", ausencia);
    case "PLANO_ACIMA":
      return tn("prev.cause.PLANO_ACIMA", num(d.semanas), { pct: num(d.pct) });
    case "ACUMULO":
      return d.normaliza
        ? t("prev.cause.ACUMULO", { horas: num(d.horas), data: day(d.normaliza) })
        : t("prev.cause.ACUMULO_SEMPRE", { horas: num(d.horas) });
    case "FERIADO":
      return t("prev.cause.FERIADO", { feriado: str(d.feriado), data: day(d.data) });
    default:
      return causa.codigo;
  }
}

// mesma regra do central.faixa no banco, se mudar lá tem que mudar aqui também
export function faixaOf(disponiveis: number, alocadas: number): Faixa {
  if (disponiveis <= 0) return alocadas > 0 ? "Conflito" : "Ausente";
  const pct = (100 * alocadas) / disponiveis;
  if (pct < 70) return "Ocioso";
  if (pct <= 100) return "Saudavel";
  if (pct <= 120) return "Em risco";
  return "Sobrecarregado";
}

const CENARIO_KEY = "central-de-paineis:cenario";

export function readScenario(): number {
  try {
    const value = Number(window.localStorage.getItem(CENARIO_KEY));
    return Number.isInteger(value) && value > 0 ? value : BASELINE_ID;
  } catch {
    return BASELINE_ID;
  }
}

export function storeScenario(id: number): void {
  try {
    window.localStorage.setItem(CENARIO_KEY, String(id));
  } catch {}
}

const KNOWN_ERRORS = [
  "SESSAO_EXPIRADA", "SEM_ACESSO", "SO_GESTAO_EDITA", "DADO_INVALIDO", "ROTA_DESCONHECIDA",
  "BASELINE_FIXO", "ITEM_NAO_ENCONTRADO", "CENARIO_NAO_ENCONTRADO", "INDISPONIVEL",
];

async function request<T>(session: Session, path: string, init?: { body: unknown }): Promise<T> {
  if (API_URL === "") throw new CapacityError(t("err.notConfigured"));

  let response: Response;
  try {
    response = await fetch(`${API_URL}/${path}`, {
      method: init ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${session.token}`,
        ...(init ? { "Content-Type": "application/json" } : {}),
      },
      body: init ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new CapacityError(t("err.network"));
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    const code = isObject(data) && typeof data.codigo === "string" ? data.codigo : undefined;
    const message =
      code && KNOWN_ERRORS.includes(code)
        ? t(`capErr.${code}` as MessageKey)
        : response.status === 401
          ? t("capErr.SESSAO_EXPIRADA")
          : isObject(data) && typeof data.erro === "string"
            ? data.erro
            : t("err.http", { status: response.status });
    throw new CapacityError(message, response.status);
  }
  return data as T;
}

const query = (params: Record<string, string | number | undefined>): string =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");

export const fetchContext = (session: Session) => request<Contexto>(session, `capacidade?${query({ rota: "contexto" })}`);

export const fetchHeatmap = (session: Session, cenario: number, inicio?: string, semanas = 10) =>
  request<Heatmap>(session, `capacidade?${query({ rota: "heatmap", cenario, inicio, semanas })}`);

export const fetchTimeline = (session: Session, cenario: number, projeto: string) =>
  request<Timeline>(session, `capacidade?${query({ rota: "timeline", cenario, projeto })}`);

export const fetchAlerts = (session: Session, cenario: number) =>
  request<Alerta[]>(session, `capacidade?${query({ rota: "alertas", cenario })}`);

export const fetchForecast = (session: Session, cenario: number) =>
  request<Previsao>(session, `capacidade?${query({ rota: "previsao", cenario })}`);

// o "Simular" da previsão abre o planejamento com o destino já escolhido:
// #planejamento/simular/<projeto>/<item>/<sprint>/<pessoa>
export const simulationHash = (s: SugestaoPrevisao): string =>
  `#planejamento/simular/${[s.item.projeto, s.item.id, s.item.sprint, s.para.id].map((p) => encodeURIComponent(String(p))).join("/")}`;

export function readSimulationHash(hash: string): { projeto: string; destino: Destino } | null {
  let partes: string[];
  try {
    partes = hash.replace(/^#/, "").split("/").map(decodeURIComponent);
  } catch {
    return null;
  }
  const [painel, acao, projeto, item, sprint, pessoa] = partes;
  if (painel !== "planejamento" || acao !== "simular" || !projeto || !sprint) return null;
  const itemId = Number(item);
  const pessoaId = Number(pessoa);
  if (!Number.isInteger(itemId) || !Number.isInteger(pessoaId)) return null;
  return { projeto, destino: { item: itemId, sprint, responsavel: pessoaId } };
}

export const simulateMove = (session: Session, cenario: number, destino: Destino) =>
  request<Simulacao>(session, "capacidade/acao", { body: { rota: "simular", cenario, ...destino } });

export const applyMove = (session: Session, cenario: number, destino: Destino) =>
  request<Simulacao>(session, "capacidade/acao", { body: { rota: "mover", cenario, ...destino } });

export const undoMove = (session: Session, cenario: number, item: number) =>
  request<{ salvo: boolean }>(session, "capacidade/acao", { body: { rota: "desfazer", cenario, item } });
