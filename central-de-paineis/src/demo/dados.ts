/**
 * Dados fictícios do modo demonstração.
 *
 * Tudo é calculado a partir de uma pequena base (pessoas, projetos, sprints, itens e ausências),
 * sempre relativa ao dia de hoje, para a demonstração nunca ficar "no passado".
 * Nada aqui vem do servidor do time (n8n, Supabase ou Azure DevOps).
 */
import { faixaOf, type Faixa, type Uso } from "../lib/capacity";

// ---------------------------------------------------------------- datas

const pad = (n: number): string => String(n).padStart(2, "0");
export const iso = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s: string): Date => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
export const soma = (s: string, dias: number): string => {
  const d = parse(s);
  d.setDate(d.getDate() + dias);
  return iso(d);
};
export const segundaDe = (s: string): string => soma(s, -((parse(s).getDay() + 6) % 7));

export const HOJE = iso(new Date());
export const SEMANA_ATUAL = segundaDe(HOJE);
const ANO = new Date().getFullYear();

const FERIADOS_FIXOS: [string, string][] = [
  ["01-01", "Confraternização Universal"],
  ["04-21", "Tiradentes"],
  ["05-01", "Dia do Trabalho"],
  ["09-07", "Independência do Brasil"],
  ["10-12", "Nossa Senhora Aparecida"],
  ["11-02", "Finados"],
  ["11-15", "Proclamação da República"],
  ["11-20", "Consciência Negra"],
  ["12-25", "Natal"],
];

export const FERIADOS = [ANO - 1, ANO, ANO + 1].flatMap((ano) =>
  FERIADOS_FIXOS.map(([md, nome]) => ({ data: `${ano}-${md}`, nome })),
);
const feriadoDe = new Map(FERIADOS.map((f) => [f.data, f.nome]));

const diaUtil = (s: string): boolean => {
  const dow = parse(s).getDay();
  return dow >= 1 && dow <= 5;
};

/** Dias úteis (segunda a sexta) entre duas datas, inclusive. */
function diasUteis(ini: string, fim: string): string[] {
  const dias: string[] = [];
  for (let d = ini; d <= fim; d = soma(d, 1)) if (diaUtil(d)) dias.push(d);
  return dias;
}

// ---------------------------------------------------------------- cadastro

export type Cargo = "COLABORADOR" | "COORDENADOR" | "GERENTE" | "DIRETOR";

export interface Pessoa {
  id: number;
  nome: string;
  cargo: Cargo;
  equipes: string[];
}

export const PESSOAS: Pessoa[] = [
  { id: 1, nome: "Ana Ribeiro", cargo: "COORDENADOR", equipes: ["web"] },
  { id: 2, nome: "Bruno Matos", cargo: "COLABORADOR", equipes: ["web"] },
  { id: 3, nome: "Carla Nunes", cargo: "COLABORADOR", equipes: ["web"] },
  { id: 4, nome: "Diego Farias", cargo: "COLABORADOR", equipes: ["web", "dados"] },
  { id: 5, nome: "Elisa Prado", cargo: "COORDENADOR", equipes: ["dados"] },
  { id: 6, nome: "Felipe Costa", cargo: "COLABORADOR", equipes: ["dados"] },
  { id: 7, nome: "Gabriela Lima", cargo: "COLABORADOR", equipes: ["dados"] },
  { id: 8, nome: "Heitor Alves", cargo: "GERENTE", equipes: ["web", "dados"] },
];

export const EQUIPES = [
  { id: "web", nome: "Equipe Web", projeto: "ATLAS" },
  { id: "dados", nome: "Equipe Dados", projeto: "PORTAL" },
];

export const PROJETOS = [
  { id: "ATLAS", nome: "Projeto Atlas", origem: "ADO", estado: "Ativo" },
  { id: "PORTAL", nome: "Portal do Cliente", origem: "ADO", estado: "Ativo" },
];

export interface Ausencia {
  pessoa: number;
  inicio: string;
  fim: string;
  motivo: string;
  horasDia: number;
}

export const AUSENCIAS: Ausencia[] = [
  { pessoa: 6, inicio: soma(SEMANA_ATUAL, 14), fim: soma(SEMANA_ATUAL, 25), motivo: "Férias", horasDia: 8 },
  { pessoa: 3, inicio: soma(SEMANA_ATUAL, 22), fim: soma(SEMANA_ATUAL, 23), motivo: "Treinamento", horasDia: 8 },
  { pessoa: 7, inicio: soma(SEMANA_ATUAL, 3), fim: soma(SEMANA_ATUAL, 3), motivo: "Consulta médica", horasDia: 4 },
];

// ---------------------------------------------------------------- sprints

export interface Sprint {
  id: string;
  nome: string;
  inicio: string;
  fim: string;
  projeto: string;
  encerrada: boolean;
}

function sprintsDe(projeto: string, primeira: number, base: string): Sprint[] {
  return [-1, 0, 1, 2, 3].map((k, i) => {
    const inicio = soma(base, 14 * k);
    const fim = soma(inicio, 11);
    return {
      id: `${projeto}-S${primeira + i}`,
      nome: `Sprint ${primeira + i}`,
      inicio,
      fim,
      projeto,
      encerrada: fim < HOJE,
    };
  });
}

// o Portal começa uma semana depois do Atlas, então as sprints se sobrepõem
export const SPRINTS: Sprint[] = [
  ...sprintsDe("ATLAS", 12, SEMANA_ATUAL),
  ...sprintsDe("PORTAL", 7, soma(SEMANA_ATUAL, -7)),
];
const sprintPorId = new Map(SPRINTS.map((s) => [s.id, s]));
const idDaSprint = (projeto: string, indice: number): string =>
  SPRINTS.filter((s) => s.projeto === projeto)[indice].id;

// ---------------------------------------------------------------- itens

export interface ItemBase {
  id: number;
  projeto: string;
  sprint: string;
  titulo: string;
  tipo: string;
  estado: string;
  esforco: number;
  responsavel: number;
}

const item = (
  id: number,
  projeto: string,
  indice: number,
  titulo: string,
  tipo: string,
  esforco: number,
  responsavel: number,
  estado = "Novo",
): ItemBase => ({ id, projeto, sprint: idDaSprint(projeto, indice), titulo, tipo, estado, esforco, responsavel });

export const ITENS: ItemBase[] = [
  item(101, "ATLAS", 0, "Modelagem do banco de capacidade", "Task", 18, 1, "Concluído"),
  item(102, "ATLAS", 0, "Telas de login e cadastro", "Feature", 22, 2, "Concluído"),
  item(103, "ATLAS", 0, "Importação do Azure DevOps", "Feature", 26, 4, "Concluído"),
  item(104, "ATLAS", 1, "Mapa de calor de utilização", "Feature", 24, 2, "Em andamento"),
  item(105, "ATLAS", 1, "Filtro por cenário", "Feature", 20, 2, "Em andamento"),
  item(106, "ATLAS", 1, "Corrigir cálculo com feriados", "Bug", 12, 2),
  item(107, "ATLAS", 1, "Alertas de sobrecarga", "Feature", 28, 2),
  item(108, "ATLAS", 1, "Ajustes de acessibilidade", "Task", 14, 2),
  item(109, "ATLAS", 1, "Revisão dos textos em 7 idiomas", "Task", 10, 3, "Em andamento"),
  item(110, "ATLAS", 1, "API de previsão de capacidade", "Feature", 30, 1, "Em andamento"),
  item(111, "ATLAS", 1, "Testes da simulação", "Task", 16, 4, "Em andamento"),
  item(112, "ATLAS", 2, "Planejamento por arrastar e soltar", "Feature", 30, 1),
  item(113, "ATLAS", 2, "Assistente de IA no n8n", "Feature", 28, 4),
  item(114, "ATLAS", 2, "Exportar relatório em PDF", "Feature", 16, 3),
  item(115, "ATLAS", 2, "Notificações por e-mail", "Task", 12, 3),
  item(116, "ATLAS", 2, "Painel do gerente", "Feature", 24, 2),
  item(117, "ATLAS", 3, "Integração com calendário", "Feature", 20, 1),
  item(118, "ATLAS", 3, "Revisão de segurança", "Task", 16, 4),
  item(119, "ATLAS", 3, "Documentação", "Task", 12, 3),
  item(120, "ATLAS", 4, "Preparar a apresentação final", "Task", 14, 1),

  item(201, "PORTAL", 0, "Levantamento de requisitos", "Task", 16, 5, "Concluído"),
  item(202, "PORTAL", 0, "Protótipo das telas", "Feature", 20, 7, "Concluído"),
  item(203, "PORTAL", 1, "Pipeline de dados", "Feature", 32, 6, "Em andamento"),
  item(204, "PORTAL", 1, "Dashboard de vendas", "Feature", 28, 7, "Em andamento"),
  item(205, "PORTAL", 1, "Modelo de previsão", "Feature", 24, 5, "Em andamento"),
  item(206, "PORTAL", 1, "Qualidade dos dados", "Task", 16, 4, "Em andamento"),
  item(207, "PORTAL", 1, "Painel de acompanhamento", "Feature", 14, 8),
  item(208, "PORTAL", 2, "Relatórios semanais", "Feature", 26, 6),
  item(209, "PORTAL", 2, "Autenticação do portal", "Feature", 22, 7),
  item(210, "PORTAL", 2, "Revisão do modelo", "Task", 18, 5),
  item(211, "PORTAL", 2, "API de consulta", "Feature", 24, 4),
  item(212, "PORTAL", 3, "Testes de carga", "Task", 20, 6),
  item(213, "PORTAL", 3, "Treinamento dos usuários", "Task", 12, 7),
  item(214, "PORTAL", 3, "Migração dos dados", "Feature", 30, 5),
  item(215, "PORTAL", 4, "Entrega final", "Task", 16, 8),
];

export const concluido = (estado: string): boolean => estado.toLowerCase().startsWith("conclu");

// ---------------------------------------------------------------- cenários (simulações guardadas no navegador)

export const BASELINE = 1;
const CHAVE = "atlas-demo:remanejamentos";

export interface Remanejamento {
  sprint: string;
  responsavel: number;
}

type Remanejamentos = Record<string, Remanejamento>;

function lerRemanejamentos(): Remanejamentos {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as Remanejamentos) : {};
  } catch {
    return {};
  }
}

export function gravarRemanejamento(itemId: number, destino: Remanejamento | null): void {
  const atual = lerRemanejamentos();
  if (destino) atual[String(itemId)] = destino;
  else delete atual[String(itemId)];
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(atual));
  } catch {}
}

export const totalRemanejamentos = (): number => Object.keys(lerRemanejamentos()).length;

export interface ItemEfetivo extends ItemBase {
  movido: boolean;
  sprintOriginal: string | null;
  responsavelOriginal: number | null;
}

/** Itens como ficam em cada cenário: o real (1) nunca muda, os demais aplicam os remanejamentos guardados. */
export function itensDoCenario(cenario: number): ItemEfetivo[] {
  const remanejados = cenario === BASELINE ? {} : lerRemanejamentos();
  return ITENS.map((base) => {
    const r = remanejados[String(base.id)];
    if (!r || (r.sprint === base.sprint && r.responsavel === base.responsavel)) {
      return { ...base, movido: false, sprintOriginal: null, responsavelOriginal: null };
    }
    return { ...base, sprint: r.sprint, responsavel: r.responsavel, movido: true, sprintOriginal: base.sprint, responsavelOriginal: base.responsavel };
  });
}

// ---------------------------------------------------------------- capacidade

const arredonda1 = (n: number): number => Math.round(n * 10) / 10;

/** Horas disponíveis de uma pessoa entre duas datas (8 h por dia útil, menos feriados e ausências). */
export function disponiveis(pessoa: number, ini: string, fim: string): number {
  let total = 0;
  for (const dia of diasUteis(ini, fim)) {
    if (feriadoDe.has(dia)) continue;
    const ausente = AUSENCIAS.filter((a) => a.pessoa === pessoa && a.inicio <= dia && a.fim >= dia).reduce((s, a) => s + a.horasDia, 0);
    total += Math.max(0, 8 - ausente);
  }
  return total;
}

/** Horas alocadas: o esforço de cada item é espalhado pelos dias úteis da sprint dele. */
export function alocadas(pessoa: number, ini: string, fim: string, itens: ItemEfetivo[]): number {
  let total = 0;
  for (const it of itens) {
    if (it.responsavel !== pessoa) continue;
    const sprint = sprintPorId.get(it.sprint);
    if (!sprint) continue;
    const dias = diasUteis(sprint.inicio, sprint.fim);
    if (dias.length === 0) continue;
    const noPeriodo = dias.filter((d) => d >= ini && d <= fim).length;
    total += (it.esforco * noPeriodo) / dias.length;
  }
  return total;
}

export function usoDe(pessoa: number, ini: string, fim: string, itens: ItemEfetivo[]): Uso {
  const disp = disponiveis(pessoa, ini, fim);
  const aloc = alocadas(pessoa, ini, fim, itens);
  return {
    pct: disp > 0 ? Math.round((100 * aloc) / disp) : null,
    faixa: faixaOf(disp, aloc),
    alocadas: arredonda1(aloc),
    disponiveis: arredonda1(disp),
  };
}

export const RANK: Record<Faixa, number> = { Ausente: 0, Ocioso: 1, Saudavel: 2, "Em risco": 3, Sobrecarregado: 4, Conflito: 5 };

export const sextaDe = (segunda: string): string => soma(segunda, 4);
export const semanas = (inicio: string, n: number): string[] => Array.from({ length: n }, (_, i) => soma(inicio, 7 * i));
export const buscarSprint = (id: string): Sprint | undefined => sprintPorId.get(id);
export const buscarPessoa = (id: number): Pessoa | undefined => PESSOAS.find((p) => p.id === id);
export const projetoDaPessoa = (pessoa: Pessoa): string[] => EQUIPES.filter((e) => pessoa.equipes.includes(e.id)).map((e) => e.projeto);
export const nomeDoProjeto = (id: string): string => PROJETOS.find((p) => p.id === id)?.nome ?? id;
export const feriadosEntre = (ini: string, fim: string) => FERIADOS.filter((f) => f.data >= ini && f.data <= fim && diaUtil(f.data));
export const ausenciasDe = (pessoa: number): Ausencia[] => AUSENCIAS.filter((a) => a.pessoa === pessoa);
