import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { KpiCard } from "../components/KpiCard";
import { Panel } from "../components/Panel";
import { t } from "../i18n";
import {
  cargoLabel,
  causeText,
  faixaClass,
  faixaLabel,
  faixaOf,
  fetchForecast,
  simulationHash,
  type PessoaPrevisao,
  type Previsao,
} from "../lib/capacity";
import { formatIsoDate, formatNumber1 } from "../lib/format";
import type { DashboardPageProps, Tone } from "../types";
import {
  CapacityLoading,
  CapacityProblem,
  FaixaLegend,
  ScenarioPicker,
  shortDate,
  toCapacityError,
  useCapacityContext,
  useScenario,
  type Loaded,
} from "./capacity/shared";

// a conta toda é feita no banco (central.api_previsao): o que não cabe num dia
// (acima de 120% ou em dia de ausência) passa pro dia seguinte da mesma pessoa.
// aqui só mostra e calcula os totais da equipe filtrada

type Mostrar = "todos" | "risco";

const NIVEL_TONE: Record<"alta" | "media", Tone> = { alta: "negative", media: "warning" };

const pctText = (pct: number | null | undefined): string => (pct == null ? "—" : `${pct}%`);

// 0.05 pra ignorar sobra de arredondamento
const chegaDeAntes = (horas: number): boolean => horas >= 0.05;

function ForecastItem({ pessoa }: { pessoa: PessoaPrevisao }) {
  const nivel = pessoa.nivel === "alta" ? "alta" : "media";
  const semanaQuando = pessoa.quando ? pessoa.semanas[pessoa.quando] : undefined;
  const sugestao = pessoa.sugestao;

  return (
    <li className={`forecast-item alert-item--${nivel}`}>
      <div className="forecast-head">
        <div>
          <p className="forecast-name">{pessoa.nome}</p>
          <p className="forecast-role">{cargoLabel(pessoa.cargo)}</p>
        </div>
        <div className="forecast-tags">
          <Badge tone={NIVEL_TONE[nivel]}>{t(`prev.nivel.${nivel}`)}</Badge>
          <span className="forecast-trend">{t(`prev.trend.${pessoa.tendencia}`)}</span>
        </div>
      </div>
      <div className="forecast-path">
        {pessoa.faixaAgora && (
          <span className={`forecast-chip ${faixaClass(pessoa.faixaAgora)}`}>
            {t("prev.now", { faixa: faixaLabel(pessoa.faixaAgora) })}
          </span>
        )}
        {pessoa.piora && pessoa.quando && semanaQuando && (
          <>
            <span className="forecast-arrow" aria-hidden="true">
              →
            </span>
            <span className={`forecast-chip ${faixaClass(semanaQuando.faixa)}`}>
              {t("prev.from", { data: shortDate(pessoa.quando), faixa: faixaLabel(semanaQuando.faixa) })}
            </span>
          </>
        )}
        {pessoa.pico && (
          <span className="forecast-peak">
            {pessoa.pico.pct !== null
              ? t("prev.peak", { pct: pessoa.pico.pct, data: shortDate(pessoa.pico.semana) })
              : t("prev.peakNoHours", { data: shortDate(pessoa.pico.semana) })}
          </span>
        )}
      </div>
      {pessoa.causas.length > 0 && (
        <div className="forecast-causes">
          <p className="forecast-label">{t("prev.why")}</p>
          <ul>
            {pessoa.causas.map((causa, index) => (
              <li key={`${causa.codigo}-${index}`}>{causeText(causa)}</li>
            ))}
          </ul>
        </div>
      )}

      {sugestao ? (
        <div className="forecast-suggestion">
          <p>
            {t("prev.suggest", {
              titulo: sugestao.item.titulo,
              horas: sugestao.item.esforco,
              sprint: sugestao.item.sprintNome,
              nome: sugestao.para.nome,
              pct: sugestao.para.pct ?? "—",
            })}
            {!sugestao.para.mesmaEquipe && <> {t("prev.suggestOtherTeam", { nome: sugestao.para.nome })}</>}
          </p>
          <a className="btn btn--with-icon" href={simulationHash(sugestao)}>
            {t("prev.simulate")}
          </a>
        </div>
      ) : (
        <p className="forecast-nosuggestion">{t("prev.noSuggestion")}</p>
      )}
    </li>
  );
}

export function PrevisaoPage({ session }: DashboardPageProps) {
  const contexto = useCapacityContext(session);
  const [cenario, setCenario] = useScenario(contexto.data);
  const [equipe, setEquipe] = useState("");
  const [mostrar, setMostrar] = useState<Mostrar>("todos");
  const [previsao, setPrevisao] = useState<Loaded<Previsao>>({ data: null, error: null, loading: true });

  useEffect(() => {
    if (!contexto.data) return;
    let cancelado = false;
    setPrevisao((atual) => ({ ...atual, loading: true }));
    fetchForecast(session, cenario)
      .then((data) => !cancelado && setPrevisao({ data, error: null, loading: false }))
      .catch((failure) => !cancelado && setPrevisao({ data: null, error: toCapacityError(failure), loading: false }));
    return () => {
      cancelado = true;
    };
  }, [session, contexto.data, cenario]);

  const data = previsao.data;

  const daEquipe = useMemo(
    () => (data?.pessoas ?? []).filter((pessoa) => equipe === "" || pessoa.equipes.includes(equipe)),
    [data, equipe],
  );
  const emRisco = daEquipe.filter((pessoa) => pessoa.nivel !== "ok");
  const naGrade = mostrar === "risco" ? emRisco : daEquipe;

  const resumo = useMemo(() => {
    const pioram = daEquipe.filter((pessoa) => pessoa.piora && pessoa.quando);
    const proximo = [...pioram].sort((a, b) => (a.quando ?? "").localeCompare(b.quando ?? ""))[0];
    return {
      alta: daEquipe.filter((pessoa) => pessoa.nivel === "alta").length,
      media: daEquipe.filter((pessoa) => pessoa.nivel === "media").length,
      pioram: pioram.length,
      proximo,
      horas: daEquipe.reduce((soma, pessoa) => soma + pessoa.acumuladoMax, 0),
    };
  }, [daEquipe]);

  const soma = useMemo(() => {
    const porSemana: Record<string, { disp: number; plano: number; previsto: number }> = {};
    for (const semana of data?.semanas ?? []) {
      const total = { disp: 0, plano: 0, previsto: 0 };
      for (const pessoa of naGrade) {
        const s = pessoa.semanas[semana];
        if (!s) continue;
        total.disp += s.disponiveis;
        total.plano += s.planejadas;
        total.previsto += s.planejadas + s.chega;
      }
      porSemana[semana] = total;
    }
    return porSemana;
  }, [data, naGrade]);

  if (contexto.error) return <CapacityProblem error={contexto.error} />;
  if (!contexto.data) return <CapacityLoading />;
  if (previsao.error) return <CapacityProblem error={previsao.error} />;

  const pct = (parte: number, todo: number): number | null => (todo > 0 ? Math.round((100 * parte) / todo) : null);

  return (
    <>
      <div className="capacity-toolbar">
        <ScenarioPicker contexto={contexto.data} value={cenario} onChange={setCenario} />

        <div className="capacity-field">
          <label className="field-label" htmlFor="previsao-equipe">
            {t("util.team")}
          </label>
          <select
            id="previsao-equipe"
            className="input input--compact"
            value={equipe}
            onChange={(event) => setEquipe(event.target.value)}
          >
            <option value="">{t("util.allPeople")}</option>
            {contexto.data.equipes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      {data && (
        <p className="capacity-note">
          {t("prev.model", { teto: data.teto, ate: data.ate ? formatIsoDate(data.ate) : "—" })}
        </p>
      )}

      <div className="kpis">
        <KpiCard label={t("prev.kpi.worse")} value={data ? String(resumo.pioram) : undefined} detail={t("prev.kpi.worseDetail")} />
        <KpiCard
          label={t("prev.kpi.next")}
          value={resumo.proximo?.quando ? shortDate(resumo.proximo.quando) : undefined}
          detail={data ? (resumo.proximo?.nome ?? t("prev.kpi.nextNone")) : undefined}
        />
        <KpiCard label={t("prev.kpi.high")} value={data ? String(resumo.alta) : undefined} detail={t("prev.kpi.highDetail")} />
        <KpiCard label={t("prev.kpi.limit")} value={data ? String(resumo.media) : undefined} detail={t("prev.kpi.limitDetail")} />
        <KpiCard
          label={t("prev.kpi.hours")}
          value={data ? `${formatNumber1(resumo.horas)} h` : undefined}
          detail={t("prev.kpi.hoursDetail")}
        />
      </div>
      <div className="grid">
        <Panel title={t("prev.list")} note={t("prev.listNote")} span={12}>
          {!data ? (
            <p className="capacity-muted" aria-busy="true">
              {t("ui.loading")}
            </p>
          ) : emRisco.length === 0 ? (
            <p className="capacity-muted">{t("prev.none")}</p>
          ) : (
            <ul className={previsao.loading ? "forecast-list is-loading" : "forecast-list"}>
              {emRisco.map((pessoa) => (
                <ForecastItem key={pessoa.id} pessoa={pessoa} />
              ))}
            </ul>
          )}
        </Panel>
        <Panel
          title={t("prev.grid")}
          note={t("prev.gridNote")}
          span={12}
          actions={
            <div className="segmented" role="group" aria-label={t("prev.show")}>
              <button type="button" aria-pressed={mostrar === "todos"} onClick={() => setMostrar("todos")}>
                {t("prev.showAll")}
              </button>
              <button type="button" aria-pressed={mostrar === "risco"} onClick={() => setMostrar("risco")}>
                {t("prev.showRisk")}
              </button>
            </div>
          }
        >
          <FaixaLegend />

          {!data ? (
            <p className="capacity-muted" aria-busy="true">
              {t("ui.loading")}
            </p>
          ) : naGrade.length === 0 ? (
            <p className="capacity-muted">{mostrar === "risco" ? t("prev.none") : t("prev.empty")}</p>
          ) : (
            <div className={previsao.loading ? "heatmap-scroll is-loading" : "heatmap-scroll"}>
              <table className="heatmap heatmap--forecast">
                <caption className="sr-only">{t("prev.caption", { data: shortDate(data.semanas[0] ?? data.semanaAtual) })}</caption>
                <thead>
                  <tr>
                    <th scope="col" className="heatmap-person">
                      {t("cap.person")}
                    </th>
                    {data.semanas.map((semana) => (
                      <th
                        key={semana}
                        scope="col"
                        className={semana === data.semanaAtual ? "is-current" : undefined}
                        title={semana === data.semanaAtual ? t("util.thisWeek") : t("util.weekOf", { data: shortDate(semana) })}
                      >
                        {shortDate(semana)}
                        {semana === data.semanaAtual && <span className="heatmap-now">{t("util.now")}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {naGrade.map((pessoa) => (
                    <tr key={pessoa.id}>
                      <th scope="row" className="heatmap-person">
                        <span className="heatmap-name">{pessoa.nome}</span>
                        <span className="heatmap-role">{cargoLabel(pessoa.cargo)}</span>
                      </th>
                      {data.semanas.map((semana) => {
                        const s = pessoa.semanas[semana];
                        const acima = s ? chegaDeAntes(s.chega) : false;
                        const texto = !s
                          ? t("prev.cellEmpty", { nome: pessoa.nome, data: shortDate(semana) })
                          : acima
                            ? t("prev.cell", {
                                nome: pessoa.nome,
                                data: shortDate(semana),
                                pct: pctText(s.pct),
                                faixa: faixaLabel(s.faixa),
                                plano: pctText(s.pctPlano),
                                chega: formatNumber1(s.chega),
                              })
                            : t("prev.cellSame", {
                                nome: pessoa.nome,
                                data: shortDate(semana),
                                pct: pctText(s.pct),
                                faixa: faixaLabel(s.faixa),
                              });
                        return (
                          <td
                            key={semana}
                            className={`heat ${s ? faixaClass(s.faixa) : "heat--empty"} ${semana === data.semanaAtual ? "is-current" : ""}`}
                            title={texto}
                            tabIndex={0}
                            aria-label={texto}
                          >
                            {s ? pctText(s.pct) : ""}
                            {acima && (
                              <span className="heat-ahead" aria-hidden="true">
                                ▲
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" className="heatmap-person">
                      <span className="heatmap-name">{t("prev.team")}</span>
                    </th>
                    {data.semanas.map((semana) => {
                      const total = soma[semana];
                      const previsto = total ? pct(total.previsto, total.disp) : null;
                      const plano = total ? pct(total.plano, total.disp) : null;
                      const faixa = total ? faixaOf(total.disp, total.previsto) : "Ausente";
                      const texto = t("prev.teamCell", {
                        data: shortDate(semana),
                        pct: pctText(previsto),
                        faixa: faixaLabel(faixa),
                        plano: pctText(plano),
                      });
                      return (
                        <td
                          key={semana}
                          className={`heat heat--total ${faixaClass(faixa)} ${semana === data.semanaAtual ? "is-current" : ""}`}
                          title={texto}
                          tabIndex={0}
                          aria-label={texto}
                        >
                          {pctText(previsto)}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
