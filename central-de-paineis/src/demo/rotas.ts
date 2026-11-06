/**
 * Respostas fictícias da API de capacidade, no mesmo formato que o backend (n8n + Supabase) devolve.
 * Os tipos vêm de src/lib/capacity.ts, então o TypeScript confere se o formato bate.
 */
import {
  faixaOf,
  type Alerta,
  type Aviso,
  type CausaPrevisao,
  type Contexto,
  type Destino,
  type Faixa,
  type Heatmap,
  type Impacto,
  type PessoaPrevisao,
  type PessoaTimeline,
  type Previsao,
  type SemanaPrevista,
  type Simulacao,
  type SugestaoPrevisao,
  type Timeline,
} from "../lib/capacity";
import {
  AUSENCIAS,
  BASELINE,
  EQUIPES,
  FERIADOS,
  HOJE,
  ITENS,
  PESSOAS,
  PROJETOS,
  RANK,
  SEMANA_ATUAL,
  SPRINTS,
  alocadas,
  ausenciasDe,
  buscarPessoa,
  buscarSprint,
  concluido,
  disponiveis,
  feriadosEntre,
  gravarRemanejamento,
  itensDoCenario,
  nomeDoProjeto,
  segundaDe,
  semanas,
  sextaDe,
  soma,
  totalRemanejamentos,
  usoDe,
  type ItemEfetivo,
} from "./dados";

const arredonda1 = (n: number): number => Math.round(n * 10) / 10;

// ---------------------------------------------------------------- contexto

export function contexto(): Contexto {
  return {
    hoje: HOJE,
    cenarios: [
      { id: BASELINE, nome: "Plano atual", descricao: "Dados importados do Azure DevOps (demonstração). Este cenário não muda.", base: true, alteracoes: 0 },
      {
        id: 2,
        nome: "Remanejamento da sprint",
        descricao: "Teste mudanças no plano sem alterar o real. Elas ficam guardadas só neste navegador.",
        base: false,
        alteracoes: totalRemanejamentos(),
      },
    ],
    projetos: PROJETOS.map((p) => ({ ...p })),
    equipes: EQUIPES.map((e) => ({ ...e })),
    sincronizacao: PROJETOS.map((p) => ({ projeto: p.id, estado: "OK", em: `${HOJE}T08:00:00`, detalhes: null })),
  };
}

// ---------------------------------------------------------------- mapa de calor

export function heatmap(cenario: number, inicio: string | undefined, quantas: number): Heatmap {
  const itens = itensDoCenario(cenario);
  const lista = semanas(segundaDe(inicio ?? soma(SEMANA_ATUAL, -14)), quantas);
  const primeira = SPRINTS.reduce((menor, s) => (s.inicio < menor ? s.inicio : menor), SPRINTS[0].inicio);
  const ultima = SPRINTS.reduce((maior, s) => (s.fim > maior ? s.fim : maior), SPRINTS[0].fim);

  const pessoas = PESSOAS.map((p) => ({
    id: p.id,
    nome: p.nome,
    cargo: p.cargo,
    equipes: p.equipes,
    celulas: Object.fromEntries(
      lista.filter((semana) => sextaDe(semana) >= primeira && semana <= ultima).map((semana) => [semana, usoDe(p.id, semana, sextaDe(semana), itens)]),
    ),
  }));

  const agora = PESSOAS.map((p) => usoDe(p.id, SEMANA_ATUAL, sextaDe(SEMANA_ATUAL), itens));
  const percentuais = agora.map((u) => u.pct).filter((pct): pct is number => pct !== null);
  const contar = (faixa: Faixa) => agora.filter((u) => u.faixa === faixa).length;

  return {
    semanas: lista,
    semanaAtual: SEMANA_ATUAL,
    pessoas,
    resumo: {
      sobrecarregados: contar("Sobrecarregado"),
      emRisco: contar("Em risco"),
      ociosos: contar("Ocioso"),
      conflitos: contar("Conflito"),
      saudaveis: contar("Saudavel"),
      media: percentuais.length ? Math.round(percentuais.reduce((a, b) => a + b, 0) / percentuais.length) : null,
    },
  };
}

// ---------------------------------------------------------------- planejamento (sprints)

export function timeline(cenario: number, projetoId: string): Timeline {
  const projeto = PROJETOS.find((p) => p.id === projetoId) ?? null;
  const itens = itensDoCenario(cenario);
  const sprints = SPRINTS.filter((s) => s.projeto === projetoId);
  const equipes = EQUIPES.filter((e) => e.projeto === projetoId).map((e) => e.id);

  const pessoas: PessoaTimeline[] = PESSOAS.filter((p) => p.equipes.some((e) => equipes.includes(e))).map((p) => ({
    id: p.id,
    nome: p.nome,
    cargo: p.cargo,
    equipes: p.equipes,
    uso: Object.fromEntries(sprints.map((s) => [s.id, usoDe(p.id, s.inicio, s.fim, itens)])),
    ausencias: ausenciasDe(p.id).map(({ inicio, fim, motivo, horasDia }) => ({ inicio, fim, motivo, horasDia })),
  }));

  const inicio = sprints[0]?.inicio ?? HOJE;
  const fim = sprints[sprints.length - 1]?.fim ?? HOJE;

  return {
    projeto: projeto ? { ...projeto } : null,
    sprints: sprints.map(({ id, nome, inicio: i, fim: f, encerrada }) => ({ id, nome, inicio: i, fim: f, encerrada })),
    pessoas,
    itens: itens
      .filter((it) => it.projeto === projetoId)
      .map((it) => ({
        id: it.id,
        titulo: it.titulo,
        tipo: it.tipo,
        estado: it.estado,
        esforco: it.esforco,
        origem: "ADO",
        sprint: it.sprint,
        responsavel: it.responsavel,
        movido: it.movido,
        sprintOriginal: it.sprintOriginal,
        responsavelOriginal: it.responsavelOriginal,
      })),
    feriados: feriadosEntre(inicio, fim).map(({ data, nome }) => ({ data, nome })),
  };
}

// ---------------------------------------------------------------- alertas

const GRAVIDADE_RANK = { alta: 0, media: 1, baixa: 2 } as const;

export function alertas(cenario: number): Alerta[] {
  const itens = itensDoCenario(cenario);
  const horizonte = semanas(SEMANA_ATUAL, 10);
  const lista: Alerta[] = [];

  for (const p of PESSOAS) {
    const usos = horizonte.map((semana) => ({ semana, uso: usoDe(p.id, semana, sextaDe(semana), itens) }));
    const sobrecarga = usos.filter((x) => x.uso.faixa === "Sobrecarregado");
    const conflito = usos.filter((x) => x.uso.faixa === "Conflito");
    const risco = usos.filter((x) => x.uso.faixa === "Em risco");

    if (sobrecarga.length > 0) {
      lista.push({
        origem: "calculado", tipo: "SOBRECARGA", codigo: "SOBRECARGA",
        dados: { semanas: sobrecarga.length, pct: Math.max(...sobrecarga.map((x) => x.uso.pct ?? 0)), desde: sobrecarga[0].semana },
        gravidade: "alta", pessoa: p.id, nome: p.nome, data: sobrecarga[0].semana,
        mensagem: `Acima de 120% da capacidade em ${sobrecarga.length} semana(s).`,
      });
    }
    if (conflito.length > 0) {
      lista.push({
        origem: "calculado", tipo: "CONFLITO", codigo: "CONFLITO",
        dados: { dias: conflito.length * 5, desde: conflito[0].semana },
        gravidade: "alta", pessoa: p.id, nome: p.nome, data: conflito[0].semana,
        mensagem: "Há trabalho alocado em dias sem horas disponíveis.",
      });
    }
    if (sobrecarga.length === 0 && risco.length > 0) {
      lista.push({
        origem: "calculado", tipo: "CAPACIDADE", codigo: null, dados: {},
        gravidade: "media", pessoa: p.id, nome: p.nome, data: risco[0].semana,
        mensagem: `Perto do limite (entre 100% e 120%) em ${risco.length} semana(s).`,
      });
    }
    if (usos.slice(0, 4).every((x) => x.uso.faixa === "Ocioso")) {
      lista.push({
        origem: "calculado", tipo: "OCIOSIDADE", codigo: null, dados: {},
        gravidade: "baixa", pessoa: p.id, nome: p.nome, data: horizonte[0],
        mensagem: "Menos de 70% da capacidade usada nas próximas semanas. Há espaço para mais trabalho.",
      });
    }
  }

  for (const a of AUSENCIAS) {
    const pessoa = buscarPessoa(a.pessoa);
    for (const sprint of SPRINTS.filter((s) => !s.encerrada && s.inicio <= a.fim && s.fim >= a.inicio)) {
      const quantos = itens.filter((i) => i.responsavel === a.pessoa && i.sprint === sprint.id && !concluido(i.estado)).length;
      if (quantos === 0 || !pessoa) continue;
      lista.push({
        origem: "registrado", tipo: "AUSENCIA", codigo: "AUSENCIA",
        dados: { itens: quantos, motivo: a.motivo, inicio: a.inicio, fim: a.fim, sprint: sprint.nome, projeto: nomeDoProjeto(sprint.projeto) },
        gravidade: "media", pessoa: pessoa.id, nome: pessoa.nome, data: a.inicio,
        mensagem: `${a.motivo} com ${quantos} item(ns) planejado(s) na ${sprint.nome}.`,
      });
    }
  }

  for (const f of feriadosEntre(HOJE, soma(HOJE, 70))) {
    const sprints = SPRINTS.filter((s) => !s.encerrada && s.inicio <= f.data && s.fim >= f.data);
    if (sprints.length === 0) continue;
    lista.push({
      origem: "calculado", tipo: "FERIADO", codigo: "FERIADO",
      dados: { feriado: f.nome, data: f.data, sprints: sprints.map((s) => ({ sprint: s.nome, projeto: nomeDoProjeto(s.projeto) })) },
      gravidade: "baixa", pessoa: null, nome: null, data: f.data,
      mensagem: `${f.nome} cai dentro de uma sprint aberta.`,
    });
  }

  const abertas = SPRINTS.filter((s) => !s.encerrada);
  for (const a of abertas.filter((s) => s.projeto === "ATLAS")) {
    for (const b of abertas.filter((s) => s.projeto === "PORTAL")) {
      if (a.inicio > b.fim || b.inicio > a.fim) continue;
      lista.push({
        origem: "calculado", tipo: "SOBREPOSICAO", codigo: "SOBREPOSICAO",
        dados: { sprint1: a.nome, projeto1: nomeDoProjeto(a.projeto), sprint2: b.nome, projeto2: nomeDoProjeto(b.projeto) },
        gravidade: "media", pessoa: null, nome: null, data: a.inicio > b.inicio ? a.inicio : b.inicio,
        mensagem: `${a.nome} e ${b.nome} se sobrepõem e dividem pessoas.`,
      });
    }
  }

  return lista.sort((x, y) => GRAVIDADE_RANK[x.gravidade] - GRAVIDADE_RANK[y.gravidade] || x.data.localeCompare(y.data));
}

// ---------------------------------------------------------------- previsão

const TETO = 120;
const NUM_SEMANAS_PREVISAO = 10;

interface LinhaSemana {
  semana: string;
  disp: number;
  plano: number;
  chega: number;
  acumulado: number;
  pct: number | null;
  faixa: Faixa;
  pctPlano: number | null;
  faixaPlano: Faixa;
}

/** O que passa de 120% (ou cai em dia sem horas) vai para a semana seguinte da mesma pessoa. */
function linhasDa(pessoa: number, itens: ItemEfetivo[]): LinhaSemana[] {
  let sobra = 0;
  return semanas(SEMANA_ATUAL, NUM_SEMANAS_PREVISAO).map((semana) => {
    const disp = disponiveis(pessoa, semana, sextaDe(semana));
    const plano = alocadas(pessoa, semana, sextaDe(semana), itens);
    const chega = sobra;
    const carga = plano + chega;
    sobra = disp > 0 ? Math.max(0, carga - (TETO / 100) * disp) : carga;
    return {
      semana, disp, plano, chega, acumulado: sobra,
      pct: disp > 0 ? Math.round((100 * carga) / disp) : null,
      faixa: faixaOf(disp, carga),
      pctPlano: disp > 0 ? Math.round((100 * plano) / disp) : null,
      faixaPlano: faixaOf(disp, plano),
    };
  });
}

function causasDe(pessoa: number, linhas: LinhaSemana[]): CausaPrevisao[] {
  const causas: CausaPrevisao[] = [];
  const emRisco = linhas.filter((l) => RANK[l.faixa] >= 3 || l.acumulado > 0);
  const semanasRuins = new Set(emRisco.map((l) => l.semana));

  const ausencia = ausenciasDe(pessoa).find((a) => linhas.some((l) => semanasRuins.has(l.semana) && a.inicio <= sextaDe(l.semana) && a.fim >= l.semana));
  if (ausencia) {
    const maior = Math.max(0, ...emRisco.map((l) => l.acumulado));
    causas.push({ codigo: "AUSENCIA", dados: { motivo: ausencia.motivo, inicio: ausencia.inicio, fim: ausencia.fim, horas: arredonda1(maior) } });
  }

  const feriado = FERIADOS.find((f) => linhas.some((l) => semanasRuins.has(l.semana) && f.data >= l.semana && f.data <= sextaDe(l.semana)));
  if (feriado) causas.push({ codigo: "FERIADO", dados: { feriado: feriado.nome, data: feriado.data } });

  const acima = linhas.filter((l) => (l.pctPlano ?? 0) > 100);
  if (acima.length > 0) causas.push({ codigo: "PLANO_ACIMA", dados: { semanas: acima.length, pct: Math.max(...acima.map((l) => l.pctPlano ?? 0)) } });

  const maxAcumulo = Math.max(0, ...linhas.map((l) => l.acumulado));
  if (maxAcumulo >= 0.05) {
    const idxMax = linhas.findIndex((l) => l.acumulado === maxAcumulo);
    const normaliza = linhas.slice(idxMax + 1).find((l) => l.acumulado < 0.05)?.semana ?? null;
    causas.push({ codigo: "ACUMULO", dados: { horas: arredonda1(maxAcumulo), normaliza } });
  }
  return causas;
}

function sugestaoDe(pessoa: number, linhas: LinhaSemana[], itens: ItemEfetivo[], todas: Map<number, LinhaSemana[]>): SugestaoPrevisao | null {
  const problema = linhas.find((l) => RANK[l.faixa] >= 3);
  if (!problema) return null;

  const naSemana = itens
    .filter((i) => i.responsavel === pessoa && !concluido(i.estado))
    .filter((i) => {
      const s = buscarSprint(i.sprint);
      return s && s.inicio <= sextaDe(problema.semana) && s.fim >= problema.semana;
    })
    .sort((a, b) => b.esforco - a.esforco);
  const alvo = naSemana[0];
  if (!alvo) return null;

  const sprint = buscarSprint(alvo.sprint);
  const dono = buscarPessoa(pessoa);
  const equipesDoProjeto = EQUIPES.filter((e) => e.projeto === alvo.projeto).map((e) => e.id);
  if (!sprint || !dono) return null;

  const candidatos = PESSOAS.filter((p) => p.id !== pessoa && p.equipes.some((e) => equipesDoProjeto.includes(e)))
    .map((p) => ({ p, semana: todas.get(p.id)?.find((l) => l.semana === problema.semana) }))
    .filter((x): x is { p: (typeof PESSOAS)[number]; semana: LinhaSemana } => !!x.semana && x.semana.disp > 0 && RANK[x.semana.faixa] <= 2)
    .sort((a, b) => (a.semana.pct ?? 0) - (b.semana.pct ?? 0));
  const escolhido = candidatos[0];
  if (!escolhido) return null;

  return {
    item: { id: alvo.id, titulo: alvo.titulo, esforco: alvo.esforco, sprint: sprint.id, sprintNome: sprint.nome, projeto: alvo.projeto },
    para: {
      id: escolhido.p.id, nome: escolhido.p.nome, pct: escolhido.semana.pct, faixa: escolhido.semana.faixa,
      mesmaEquipe: escolhido.p.equipes.some((e) => dono.equipes.includes(e)),
    },
  };
}

export function previsao(cenario: number): Previsao {
  const itens = itensDoCenario(cenario);
  const todas = new Map(PESSOAS.map((p) => [p.id, linhasDa(p.id, itens)]));
  const lista = semanas(SEMANA_ATUAL, NUM_SEMANAS_PREVISAO);

  const pessoas: PessoaPrevisao[] = PESSOAS.map((p) => {
    const linhas = todas.get(p.id) ?? [];
    const agora = linhas[0];
    const ranks = linhas.map((l) => RANK[l.faixa]);
    const maxRank = Math.max(...ranks);
    const nivel = maxRank >= 4 ? "alta" : maxRank === 3 ? "media" : "ok";

    const piorou = linhas.find((l, i) => i > 0 && RANK[l.faixa] >= 3 && RANK[l.faixa] > RANK[agora.faixa]);
    const primeira = linhas.find((l) => RANK[l.faixa] >= 3);
    const pico = [...linhas].sort((a, b) => RANK[b.faixa] - RANK[a.faixa] || (b.pct ?? 0) - (a.pct ?? 0))[0];
    const maxAcumulo = Math.max(...linhas.map((l) => l.acumulado));
    const idxMax = linhas.findIndex((l) => l.acumulado === maxAcumulo);
    const normaliza = maxAcumulo >= 0.05 ? (linhas.slice(idxMax + 1).find((l) => l.acumulado < 0.05)?.semana ?? null) : null;

    const media = (parte: LinhaSemana[]) => parte.reduce((s, l) => s + (l.pct ?? 0), 0) / Math.max(1, parte.length);
    const diferenca = media(linhas.slice(-3)) - media(linhas.slice(0, 3));

    return {
      id: p.id, nome: p.nome, cargo: p.cargo, equipes: p.equipes,
      nivel,
      agora: RANK[agora.faixa] >= 3,
      piora: !!piorou,
      primeira: primeira?.semana ?? null,
      quando: piorou?.semana ?? null,
      faixaAgora: agora.faixa,
      pico: pico ? { pct: pico.pct, semana: pico.semana, faixa: pico.faixa } : null,
      acumuladoMax: arredonda1(maxAcumulo),
      acumuladoFim: arredonda1(linhas[linhas.length - 1].acumulado),
      normaliza,
      tendencia: diferenca > 5 ? "sobe" : diferenca < -5 ? "desce" : "estavel",
      causas: nivel === "ok" ? [] : causasDe(p.id, linhas),
      sugestao: nivel === "ok" ? null : sugestaoDe(p.id, linhas, itens, todas),
      semanas: Object.fromEntries(
        linhas.map((l): [string, SemanaPrevista] => [
          l.semana,
          {
            disponiveis: arredonda1(l.disp), planejadas: arredonda1(l.plano), chega: arredonda1(l.chega), acumulado: arredonda1(l.acumulado),
            pctPlano: l.pctPlano, faixaPlano: l.faixaPlano, pct: l.pct, faixa: l.faixa,
          },
        ]),
      ),
    };
  });

  const comPiora = pessoas.filter((p) => p.piora && p.quando).sort((a, b) => (a.quando ?? "").localeCompare(b.quando ?? ""));
  return {
    hoje: HOJE,
    semanaAtual: SEMANA_ATUAL,
    teto: TETO,
    ate: sextaDe(lista[lista.length - 1]),
    semanas: lista,
    resumo: {
      alta: pessoas.filter((p) => p.nivel === "alta").length,
      media: pessoas.filter((p) => p.nivel === "media").length,
      pioram: comPiora.length,
      horasAcumuladas: arredonda1(pessoas.reduce((s, p) => s + p.acumuladoMax, 0)),
      primeiro: comPiora[0] ? { pessoa: comPiora[0].id, nome: comPiora[0].nome, semana: comPiora[0].quando ?? "", nivel: comPiora[0].nivel } : null,
    },
    pessoas,
  };
}

// ---------------------------------------------------------------- simulação e remanejamento

function simular(cenario: number, destino: Destino): Simulacao | { erro: string; status: number } {
  const itens = itensDoCenario(cenario);
  const alvo = itens.find((i) => i.id === destino.item);
  if (!alvo) return { erro: "ITEM_NAO_ENCONTRADO", status: 404 };

  const sprint = buscarSprint(destino.sprint);
  const pessoa = buscarPessoa(destino.responsavel);
  const base: Simulacao = {
    item: { id: alvo.id, titulo: alvo.titulo, esforco: alvo.esforco, estado: alvo.estado },
    de: { sprint: alvo.sprint, responsavel: alvo.responsavel },
    para: { sprint: destino.sprint, responsavel: destino.responsavel },
    permitido: false,
    bloqueio: null,
    bloqueioCodigo: null,
    avisos: [],
    impacto: [],
  };
  const bloquear = (codigo: string, texto: string): Simulacao => ({ ...base, bloqueio: texto, bloqueioCodigo: codigo });

  if (!sprint) return bloquear("SPRINT_NAO_ENCONTRADA", "Sprint não encontrada.");
  if (!pessoa) return bloquear("PESSOA_NAO_ENCONTRADA", "Pessoa não encontrada.");
  if (concluido(alvo.estado)) return bloquear("CONCLUIDO", "Item concluído não pode ser movido.");
  if (sprint.projeto !== alvo.projeto) return bloquear("OUTRO_PROJETO", "A sprint é de outro projeto.");
  if (sprint.encerrada) return bloquear("SPRINT_ENCERRADA", "A sprint já foi encerrada.");
  if (alvo.sprint === destino.sprint && alvo.responsavel === destino.responsavel) return bloquear("MESMO_LUGAR", "O item já está aí.");

  // depois da mudança
  const depois = itens.map((i) => (i.id === alvo.id ? { ...i, sprint: destino.sprint, responsavel: destino.responsavel } : i));
  const linha = (idPessoa: number, idSprint: string): Impacto | null => {
    const p = buscarPessoa(idPessoa);
    const s = buscarSprint(idSprint);
    if (!p || !s) return null;
    return { pessoa: p.id, nome: p.nome, sprint: s.id, sprintNome: s.nome, antes: usoDe(p.id, s.inicio, s.fim, itens), depois: usoDe(p.id, s.inicio, s.fim, depois) };
  };
  const impacto = [linha(destino.responsavel, destino.sprint), alvo.responsavel !== destino.responsavel ? linha(alvo.responsavel, alvo.sprint) : null].filter((l): l is Impacto => l !== null);

  const avisos: Aviso[] = [];
  const equipesDoProjeto = EQUIPES.filter((e) => e.projeto === alvo.projeto).map((e) => e.id);
  if (!pessoa.equipes.some((e) => equipesDoProjeto.includes(e))) {
    avisos.push({ tipo: "EQUIPE", codigo: "FORA_DA_EQUIPE", dados: { pessoa: pessoa.nome, sprint: sprint.nome }, mensagem: `${pessoa.nome} não é da equipe deste projeto.` });
  }
  for (const a of ausenciasDe(pessoa.id).filter((x) => x.inicio <= sprint.fim && x.fim >= sprint.inicio)) {
    avisos.push({ tipo: "AUSENCIA", codigo: "AUSENCIA", dados: { motivo: a.motivo, inicio: a.inicio, fim: a.fim, sprint: sprint.nome }, mensagem: `${a.motivo} durante a ${sprint.nome}.` });
  }
  for (const f of feriadosEntre(sprint.inicio, sprint.fim)) {
    avisos.push({ tipo: "FERIADO", codigo: "FERIADO", dados: { feriado: f.nome, data: f.data, sprint: sprint.nome }, mensagem: `${f.nome} dentro da ${sprint.nome}.` });
  }

  return { ...base, permitido: true, avisos, impacto };
}

export type ResultadoAcao = { status: number; corpo: unknown };

export function acao(corpo: { rota?: string; cenario?: number; item?: number; sprint?: string; responsavel?: number }): ResultadoAcao {
  const cenario = Number(corpo.cenario ?? BASELINE);

  if (corpo.rota === "desfazer") {
    if (cenario === BASELINE) return { status: 400, corpo: { codigo: "BASELINE_FIXO" } };
    gravarRemanejamento(Number(corpo.item), null);
    return { status: 200, corpo: { salvo: true } };
  }

  const destino: Destino = { item: Number(corpo.item), sprint: String(corpo.sprint ?? ""), responsavel: Number(corpo.responsavel) };
  const resultado = simular(cenario, destino);
  if ("erro" in resultado) return { status: resultado.status, corpo: { codigo: resultado.erro } };
  if (corpo.rota !== "mover") return { status: 200, corpo: resultado };

  if (cenario === BASELINE) return { status: 400, corpo: { codigo: "BASELINE_FIXO" } };
  if (!resultado.permitido) return { status: 200, corpo: { ...resultado, salvo: false } };
  const original = ITENS.find((i) => i.id === destino.item);
  gravarRemanejamento(destino.item, original && original.sprint === destino.sprint && original.responsavel === destino.responsavel ? null : { sprint: destino.sprint, responsavel: destino.responsavel });
  return { status: 200, corpo: { ...resultado, salvo: true } };
}
