import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "../components/Badge";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { Panel } from "../components/Panel";
import { t } from "../i18n";
import {
  alertTypeLabel,
  applyMove,
  avisoText,
  BASELINE_ID,
  blockText,
  CapacityError,
  cargoLabel,
  faixaClass,
  fetchTimeline,
  formatHoras,
  readSimulationHash,
  simulateMove,
  undoMove,
  type Contexto,
  type Item,
  type PessoaTimeline,
  type Simulacao,
  type Sprint,
  type Timeline,
} from "../lib/capacity";
import type { DashboardPageProps, Session } from "../types";
import {
  CapacityLoading,
  CapacityProblem,
  FaixaLegend,
  ScenarioPicker,
  shortDate,
  toCapacityError,
  useCapacityContext,
  UsoBadge,
  useScenario,
  type Loaded,
} from "./capacity/shared";

const PROJETO_KEY = "central-de-paineis:planejamento-projeto";

function readProject(): string {
  try {
    return window.localStorage.getItem(PROJETO_KEY) ?? "";
  } catch {
    return "";
  }
}

function storeProject(id: string): void {
  try {
    window.localStorage.setItem(PROJETO_KEY, id);
  } catch {}
}

const absencesIn = (pessoa: PessoaTimeline, sprint: Sprint) =>
  pessoa.ausencias.filter((ausencia) => ausencia.inicio <= sprint.fim && ausencia.fim >= sprint.inicio);

const absenceLabel = (ausencia: PessoaTimeline["ausencias"][number]): string =>
  ausencia.inicio === ausencia.fim
    ? `${ausencia.motivo} ${shortDate(ausencia.inicio)}`
    : `${ausencia.motivo} ${shortDate(ausencia.inicio)}–${shortDate(ausencia.fim)}`;

const isDone = (item: Item): boolean => item.estado.toLowerCase().startsWith("conclu");

// quem tem a menor carga na sprint. quem não tem carga registrada vai pro fim,
// sem registro não quer dizer que tem folga
function suggestPerson(timeline: Timeline, sprint: string, atual: number | null): PessoaTimeline | undefined {
  const candidatos = timeline.pessoas.filter((pessoa) => pessoa.id !== atual);
  const carga = (pessoa: PessoaTimeline) => pessoa.uso[sprint]?.pct ?? Number.POSITIVE_INFINITY;
  return [...candidatos].sort((a, b) => carga(a) - carga(b))[0];
}

function ItemCard({
  item,
  nomeDe,
  sprintDe,
  podeDesfazer,
  onMove,
  onUndo,
  onDragStart,
  onDragEnd,
}: {
  item: Item;
  nomeDe: (id: number | null) => string;
  sprintDe: (id: string | null) => string;
  podeDesfazer: boolean;
  onMove: () => void;
  onUndo: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const movable = !isDone(item);

  return (
    <article
      className={`work-card ${isDone(item) ? "is-done" : ""} ${item.movido ? "is-moved" : ""}`}
      draggable={movable}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", String(item.id));
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      aria-label={t("plan.card", { titulo: item.titulo, horas: item.esforco, estado: item.estado })}
    >
      <div className="work-card-top">
        {movable && (
          <span className="work-card-grip" aria-hidden="true">
            <Icon name="grip" size={14} />
          </span>
        )}
        <span className="work-card-type">{item.tipo}</span>
        <span className="work-card-hours">{item.esforco > 0 ? `${item.esforco}h` : "—"}</span>
      </div>
      <p className="work-card-title">{item.titulo}</p>
      <div className="work-card-foot">
        <span className="work-card-state">{item.estado}</span>
        {movable && (
          <button type="button" className="link-btn" onClick={onMove}>
            {t("plan.move")}
          </button>
        )}
      </div>
      {item.movido && (
        <p className="work-card-moved">
          {t("plan.moved", { pessoa: nomeDe(item.responsavelOriginal), sprint: sprintDe(item.sprintOriginal) })}
          {podeDesfazer && (
            <>
              {" "}
              <button type="button" className="link-btn" onClick={onUndo}>
                {t("plan.undo")}
              </button>
            </>
          )}
        </p>
      )}
    </article>
  );
}

function MoveDialog({
  session,
  contexto,
  cenario,
  timeline,
  item,
  destinoInicial,
  sugestao,
  onClose,
  onApplied,
}: {
  session: Session;
  contexto: Contexto;
  cenario: number;
  timeline: Timeline;
  item: Item;
  destinoInicial: { sprint: string; responsavel: number };
  sugestao?: string;
  onClose: () => void;
  onApplied: (mensagem: string) => void;
}) {
  const [sprint, setSprint] = useState(destinoInicial.sprint);
  const [responsavel, setResponsavel] = useState(destinoInicial.responsavel);
  const [simulacao, setSimulacao] = useState<Loaded<Simulacao>>({ data: null, error: null, loading: true });
  const [gravando, setGravando] = useState(false);
  const [erroGravar, setErroGravar] = useState<string | null>(null);

  const baseline = cenario === BASELINE_ID;
  const nomeCenario = contexto.cenarios.find((item) => item.id === cenario)?.nome ?? `#${cenario}`;
  const sprintsAbertas = timeline.sprints.filter((item) => !item.encerrada);

  useEffect(() => {
    let cancelado = false;
    setSimulacao((atual) => ({ ...atual, loading: true }));
    setErroGravar(null);
    simulateMove(session, cenario, { item: item.id, sprint, responsavel })
      .then((data) => !cancelado && setSimulacao({ data, error: null, loading: false }))
      .catch((failure) => !cancelado && setSimulacao({ data: null, error: toCapacityError(failure), loading: false }));
    return () => {
      cancelado = true;
    };
  }, [session, cenario, item.id, sprint, responsavel]);

  async function confirmar() {
    setGravando(true);
    setErroGravar(null);
    try {
      const resultado = await applyMove(session, cenario, { item: item.id, sprint, responsavel });
      if (!resultado.salvo) {
        setErroGravar(blockText(resultado) ?? t("plan.notSaved"));
        setGravando(false);
        return;
      }
      const pessoa = timeline.pessoas.find((p) => p.id === responsavel)?.nome ?? t("plan.chosenPerson");
      const nomeSprint = timeline.sprints.find((s) => s.id === sprint)?.nome ?? sprint;
      onApplied(t("plan.applied", { titulo: item.titulo, pessoa, sprint: nomeSprint, cenario: nomeCenario }));
    } catch (failure) {
      setErroGravar(failure instanceof CapacityError ? failure.message : t("plan.saveFailed"));
      setGravando(false);
    }
  }

  const sim = simulacao.data;
  const piora = sim?.impacto.filter(
    (linha) =>
      linha.pessoa === responsavel && (linha.depois.faixa === "Sobrecarregado" || linha.depois.faixa === "Conflito"),
  );

  return (
    <Modal open title={t("plan.dialog")} note={`${item.titulo} · ${item.esforco}h`} onClose={onClose}>
      <div className="move-form">
        <div className="capacity-field">
          <label className="field-label" htmlFor="mover-pessoa">
            {t("plan.toWhom")}
          </label>
          <select
            id="mover-pessoa"
            className="input input--compact"
            value={responsavel}
            data-autofocus
            onChange={(event) => setResponsavel(Number(event.target.value))}
          >
            {timeline.pessoas.map((pessoa) => (
              <option key={pessoa.id} value={pessoa.id}>
                {pessoa.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="capacity-field">
          <label className="field-label" htmlFor="mover-sprint">
            {t("plan.whichSprint")}
          </label>
          <select
            id="mover-sprint"
            className="input input--compact"
            value={sprint}
            onChange={(event) => setSprint(event.target.value)}
          >
            {sprintsAbertas.map((item) => (
              <option key={item.id} value={item.id}>
                {t("plan.sprintOption", { sprint: item.nome, inicio: shortDate(item.inicio), fim: shortDate(item.fim) })}
              </option>
            ))}
          </select>
        </div>
      </div>
      {sugestao && <p className="capacity-note">{sugestao}</p>}

      <section className="impact" aria-live="polite" aria-busy={simulacao.loading}>
        <h3 className="impact-title">{t("plan.impact")}</h3>
        {simulacao.error ? (
          <p className="form-error">{simulacao.error.message}</p>
        ) : !sim ? (
          <p className="capacity-muted">{t("plan.computing")}</p>
        ) : (
          <>
            {sim.bloqueio && <p className="form-error">{blockText(sim)}</p>}

            {sim.impacto.length > 0 && (
              <table className="impact-table">
                <thead>
                  <tr>
                    <th scope="col">{t("cap.person")}</th>
                    <th scope="col">Sprint</th>
                    <th scope="col">{t("plan.before")}</th>
                    <th scope="col">{t("plan.after")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sim.impacto.map((linha) => (
                    <tr key={`${linha.pessoa}-${linha.sprint}`}>
                      <th scope="row">{linha.nome}</th>
                      <td>{linha.sprintNome}</td>
                      <td>
                        <UsoBadge uso={linha.antes.faixa ? linha.antes : undefined} />
                        <span className="impact-hours">{formatHoras(linha.antes.faixa ? linha.antes : undefined)}</span>
                      </td>
                      <td>
                        <UsoBadge uso={linha.depois.faixa ? linha.depois : undefined} />
                        <span className="impact-hours">{formatHoras(linha.depois.faixa ? linha.depois : undefined)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {piora && piora.length > 0 && (
              <p className="impact-alert">
                <strong>{t("plan.warning")}</strong>{" "}
                {t(piora[0].depois.faixa === "Conflito" ? "plan.becomesConflict" : "plan.becomesOver", {
                  nome: piora[0].nome,
                  sprint: piora[0].sprintNome,
                  pct: piora[0].depois.pct ?? "—",
                })}
              </p>
            )}

            {sim.avisos.length > 0 && (
              <ul className="impact-warnings">
                {sim.avisos.map((aviso, index) => (
                  <li key={index}>
                    <Badge tone="warning">{alertTypeLabel(aviso.tipo)}</Badge> {avisoText(aviso)}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
      {baseline && <p className="capacity-note">{t("plan.baselineDialog")}</p>}
      {erroGravar && <p className="form-error">{erroGravar}</p>}

      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>
          {baseline ? t("ui.close") : t("ui.cancel")}
        </button>
        {!baseline && (
          <button
            type="button"
            className="btn btn--primary"
            disabled={gravando || simulacao.loading || !sim?.permitido}
            onClick={() => void confirmar()}
          >
            {gravando ? t("plan.saving") : t("plan.confirm", { nome: nomeCenario })}
          </button>
        )}
      </div>
    </Modal>
  );
}

export function PlanejamentoPage({ session }: DashboardPageProps) {
  const contexto = useCapacityContext(session);
  const [cenario, setCenario] = useScenario(contexto.data);
  const [pedido, setPedido] = useState(() => readSimulationHash(window.location.hash));
  const [projetoEscolhido, setProjetoEscolhido] = useState(() => {
    if (!pedido) return readProject();
    storeProject(pedido.projeto);
    return pedido.projeto;
  });
  const [timeline, setTimeline] = useState<Loaded<Timeline>>({ data: null, error: null, loading: true });
  const [recarga, setRecarga] = useState(0);

  const [arrastando, setArrastando] = useState<number | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);
  const [movendo, setMovendo] = useState<{
    item: Item;
    destino: { sprint: string; responsavel: number };
    sugestao?: string;
  } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const rolagem = useRef<HTMLDivElement>(null);

  const projetos = contexto.data?.projetos ?? [];
  const projeto = projetos.some((item) => item.id === projetoEscolhido) ? projetoEscolhido : (projetos[0]?.id ?? "");

  useEffect(() => {
    if (!projeto) return;
    let cancelado = false;
    setTimeline((atual) => ({ ...atual, loading: true }));
    fetchTimeline(session, cenario, projeto)
      .then((data) => !cancelado && setTimeline({ data, error: null, loading: false }))
      .catch((failure) => !cancelado && setTimeline({ data: null, error: toCapacityError(failure), loading: false }));
    return () => {
      cancelado = true;
    };
  }, [session, cenario, projeto, recarga]);

  const data = timeline.data;

  const projetoCarregado = data?.projeto?.id;
  useEffect(() => {
    const caixa = rolagem.current;
    const aberta = caixa?.querySelector<HTMLElement>(".timeline-head:not(.is-closed)");
    const canto = caixa?.querySelector<HTMLElement>(".timeline-corner");
    if (caixa && aberta && canto) caixa.scrollLeft = Math.max(0, aberta.offsetLeft - canto.offsetWidth - 6);
  }, [projetoCarregado]);

  const porCelula = useMemo(() => {
    const mapa = new Map<string, Item[]>();
    for (const item of data?.itens ?? []) {
      const chave = `${item.responsavel ?? "sem"}:${item.sprint ?? "sem"}`;
      mapa.set(chave, [...(mapa.get(chave) ?? []), item]);
    }
    return mapa;
  }, [data]);

  // veio da previsão: abre a simulação assim que a timeline do projeto carregar
  useEffect(() => {
    if (!pedido || !data || data.projeto?.id !== pedido.projeto) return;
    setPedido(null);
    window.history.replaceState(null, "", "#planejamento"); // senão um F5 abre a janela de novo
    const { destino } = pedido;
    const item = data.itens.find((candidato) => candidato.id === destino.item);
    if (!item || isDone(item)) {
      setAviso(t("plan.forecastMissing"));
      return;
    }
    const pessoa = data.pessoas.find((candidato) => candidato.id === destino.responsavel);
    const sprint = data.sprints.find((candidato) => candidato.id === destino.sprint);
    setMovendo({
      item,
      destino: { sprint: destino.sprint, responsavel: destino.responsavel },
      sugestao: t("plan.fromForecast", { nome: pessoa?.nome ?? `#${destino.responsavel}`, sprint: sprint?.nome ?? destino.sprint }),
    });
  }, [pedido, data]);

  if (contexto.error) return <CapacityProblem error={contexto.error} />;
  if (!contexto.data) return <CapacityLoading />;
  if (timeline.error) return <CapacityProblem error={timeline.error} />;

  const baseline = cenario === BASELINE_ID;
  const nomes = new Map((data?.pessoas ?? []).map((pessoa) => [pessoa.id, pessoa.nome]));
  const nomeDe = (id: number | null) => (id === null ? t("plan.nobody") : (nomes.get(id) ?? `#${id}`));
  const sprintNome = new Map((data?.sprints ?? []).map((sprint) => [sprint.id, sprint.nome]));
  const sprintDe = (id: string | null) => (id === null ? t("plan.noSprint") : (sprintNome.get(id) ?? id));
  const semResponsavel = (data?.sprints ?? []).flatMap((sprint) => porCelula.get(`sem:${sprint.id}`) ?? []);
  const semSprint = (data?.itens ?? []).filter((item) => item.sprint === null || !sprintNome.has(item.sprint));

  function soltar(pessoa: PessoaTimeline, sprint: Sprint, idTexto: string) {
    setAlvo(null);
    setArrastando(null);
    const item = data?.itens.find((candidato) => String(candidato.id) === idTexto);
    if (!item || sprint.encerrada) return;
    if (item.responsavel === pessoa.id && item.sprint === sprint.id) return;
    setMovendo({ item, destino: { sprint: sprint.id, responsavel: pessoa.id } });
  }

  // o botão Mover é a alternativa ao arrastar pra quem usa teclado ou celular
  function abrirMover(item: Item) {
    if (!data) return;
    const primeiraAberta = data.sprints.find((sprint) => !sprint.encerrada);
    const sprintAtual = data.sprints.find((sprint) => sprint.id === item.sprint && !sprint.encerrada);
    const sprint = sprintAtual ?? primeiraAberta;
    if (!sprint) {
      setAviso(t("plan.noOpenSprint"));
      return;
    }
    const sugerida = suggestPerson(data, sprint.id, item.responsavel);
    const responsavel = sugerida?.id ?? item.responsavel ?? data.pessoas[0]?.id;
    if (responsavel === undefined) return;
    const uso = sugerida?.uso[sprint.id];
    setMovendo({
      item,
      destino: { sprint: sprint.id, responsavel },
      sugestao:
        sugerida && uso?.pct != null
          ? t("plan.suggestion", { nome: sugerida.nome, sprint: sprint.nome, pct: uso.pct })
          : undefined,
    });
  }

  async function desfazer(item: Item) {
    try {
      await undoMove(session, cenario, item.id);
      setAviso(
        t("plan.undone", { titulo: item.titulo, pessoa: nomeDe(item.responsavelOriginal), sprint: sprintDe(item.sprintOriginal) }),
      );
      setRecarga((n) => n + 1);
    } catch (failure) {
      setAviso(failure instanceof CapacityError ? failure.message : t("plan.undoFailed"));
    }
  }

  const card = (item: Item) => (
    <ItemCard
      key={item.id}
      item={item}
      nomeDe={nomeDe}
      sprintDe={sprintDe}
      podeDesfazer={!baseline}
      onMove={() => abrirMover(item)}
      onUndo={() => void desfazer(item)}
      onDragStart={() => setArrastando(item.id)}
      onDragEnd={() => {
        setArrastando(null);
        setAlvo(null);
      }}
    />
  );

  return (
    <>
      <div className="capacity-toolbar">
        <ScenarioPicker contexto={contexto.data} value={cenario} onChange={setCenario} />

        <div className="capacity-field">
          <label className="field-label" htmlFor="planejamento-projeto">
            {t("plan.project")}
          </label>
          <select
            id="planejamento-projeto"
            className="input input--compact"
            value={projeto}
            onChange={(event) => {
              storeProject(event.target.value);
              setProjetoEscolhido(event.target.value);
            }}
          >
            {projetos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome} {item.origem === "ADO" ? t("plan.fromAdo") : t("plan.manual")}
              </option>
            ))}
          </select>
        </div>
      </div>
      {baseline ? (
        <p className="capacity-note">
          <strong>{t("plan.baselineLabel")}</strong> {t("plan.baselineNote")}
        </p>
      ) : (
        <p className="capacity-note capacity-note--sim">
          <strong>{t("plan.simLabel")}</strong> {t("plan.simNote")}
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {aviso ?? ""}
      </p>
      {aviso && (
        <div className="capacity-status" role="status">
          <span>{aviso}</span>
          <button type="button" className="icon-btn" aria-label={t("plan.dismiss")} onClick={() => setAviso(null)}>
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      <div className="grid">
        <Panel
          title={data?.projeto ? t("plan.timelineOf", { projeto: data.projeto.nome }) : t("plan.timeline")}
          note={t("plan.timelineNote")}
          span={12}
          actions={<FaixaLegend />}
        >
          {!data ? (
            <p className="capacity-muted" aria-busy="true">
              {t("ui.loading")}
            </p>
          ) : data.sprints.length === 0 ? (
            <p className="capacity-muted">{t("plan.noSprints")}</p>
          ) : (
            <div ref={rolagem} className={timeline.loading ? "timeline-scroll is-loading" : "timeline-scroll"}>
              <div
                className={arrastando !== null ? "timeline is-dragging" : "timeline"}
                style={{ gridTemplateColumns: `190px repeat(${data.sprints.length}, minmax(230px, 270px))` }}
                role="table"
                aria-label={t("plan.tableLabel", { projeto: data.projeto?.nome ?? "" })}
              >
                <div className="timeline-row" role="row">
                  <div className="timeline-corner" role="columnheader">
                    {t("cap.person")}
                  </div>
                  {data.sprints.map((sprint) => {
                    const feriados = data.feriados.filter((f) => f.data >= sprint.inicio && f.data <= sprint.fim);
                    return (
                      <div
                        key={sprint.id}
                        className={sprint.encerrada ? "timeline-head is-closed" : "timeline-head"}
                        role="columnheader"
                      >
                        <span className="timeline-sprint">{sprint.nome}</span>
                        <span className="timeline-dates">
                          {t("plan.dates", { inicio: shortDate(sprint.inicio), fim: shortDate(sprint.fim) })}
                        </span>
                        {sprint.encerrada && <Badge tone="neutral">{t("plan.closed")}</Badge>}
                        {feriados.map((feriado) => (
                          <span key={feriado.data} className="chip chip--holiday" title={feriado.nome}>
                            {feriado.nome} · {shortDate(feriado.data)}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>
                {data.pessoas.map((pessoa) => (
                  <div key={pessoa.id} className="timeline-row" role="row">
                    <div className="timeline-person" role="rowheader">
                      <span className="timeline-name">{pessoa.nome}</span>
                      <span className="timeline-role">
                        {cargoLabel(pessoa.cargo)}
                        {pessoa.equipes.length > 0 ? ` · ${pessoa.equipes.join(", ")}` : ""}
                      </span>
                    </div>
                    {data.sprints.map((sprint) => {
                      const chave = `${pessoa.id}:${sprint.id}`;
                      const uso = pessoa.uso[sprint.id];
                      const itens = porCelula.get(chave) ?? [];
                      const ausencias = absencesIn(pessoa, sprint);
                      const aceita = !sprint.encerrada && arrastando !== null;
                      return (
                        <div
                          key={sprint.id}
                          role="cell"
                          className={[
                            "timeline-cell",
                            uso ? faixaClass(uso.faixa) : "",
                            sprint.encerrada ? "is-closed" : "",
                            alvo === chave ? "is-target" : "",
                          ].join(" ")}
                          onDragOver={(event) => {
                            if (!aceita) return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            if (alvo !== chave) setAlvo(chave);
                          }}
                          onDragLeave={() => alvo === chave && setAlvo(null)}
                          onDrop={(event) => {
                            event.preventDefault();
                            soltar(pessoa, sprint, event.dataTransfer.getData("text/plain"));
                          }}
                        >
                          <div className="timeline-load">
                            <UsoBadge uso={uso} />
                            <span className="timeline-hours">{uso ? formatHoras(uso) : t("plan.noLoad")}</span>
                          </div>
                          {ausencias.map((ausencia) => (
                            <span key={`${ausencia.inicio}-${ausencia.motivo}`} className="chip chip--absence">
                              {absenceLabel(ausencia)}
                            </span>
                          ))}
                          {itens.map(card)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
        {data && (semResponsavel.length > 0 || semSprint.length > 0) && (
          <Panel
            title={t("plan.orphans")}
            note={t("plan.orphansNote")}
            span={12}
          >
            <div className="work-list">{[...semResponsavel, ...semSprint].map(card)}</div>
          </Panel>
        )}
      </div>
      {movendo && data && (
        <MoveDialog
          session={session}
          contexto={contexto.data}
          cenario={cenario}
          timeline={data}
          item={movendo.item}
          destinoInicial={movendo.destino}
          sugestao={movendo.sugestao}
          onClose={() => setMovendo(null)}
          onApplied={(mensagem) => {
            setMovendo(null);
            setAviso(mensagem);
            setRecarga((n) => n + 1);
          }}
        />
      )}
    </>
  );
}
