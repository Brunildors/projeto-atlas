import { useEffect, useMemo, useState } from "react";
import { KpiCard } from "../components/KpiCard";
import { Panel } from "../components/Panel";
import { t } from "../i18n";
import {
  cargoLabel,
  faixaClass,
  faixaLabel,
  fetchHeatmap,
  formatHoras,
  formatPct,
  type Heatmap,
} from "../lib/capacity";
import type { DashboardPageProps } from "../types";
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

const SEMANAS = 10;
const PASSO = 4;

type Ordem = "nome" | "carga";

function shiftWeek(iso: string, weeks: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

function averagePct(celulas: Heatmap["pessoas"][number]["celulas"]): number {
  const values = Object.values(celulas)
    .map((uso) => uso.pct)
    .filter((pct): pct is number => pct !== null);
  return values.length === 0 ? 0 : values.reduce((sum, pct) => sum + pct, 0) / values.length;
}

export function UtilizacaoPage({ session }: DashboardPageProps) {
  const contexto = useCapacityContext(session);
  const [cenario, setCenario] = useScenario(contexto.data);

  const [inicio, setInicio] = useState<string | undefined>(undefined);
  const [equipe, setEquipe] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("carga");
  const [heatmap, setHeatmap] = useState<Loaded<Heatmap>>({ data: null, error: null, loading: true });

  useEffect(() => {
    if (!contexto.data) return;
    let cancelado = false;
    setHeatmap((atual) => ({ ...atual, loading: true }));
    fetchHeatmap(session, cenario, inicio, SEMANAS)
      .then((data) => !cancelado && setHeatmap({ data, error: null, loading: false }))
      .catch((failure) => !cancelado && setHeatmap({ data: null, error: toCapacityError(failure), loading: false }));
    return () => {
      cancelado = true;
    };
  }, [session, contexto.data, cenario, inicio]);

  const pessoas = useMemo(() => {
    const lista = (heatmap.data?.pessoas ?? []).filter((pessoa) => equipe === "" || pessoa.equipes.includes(equipe));
    return ordem === "nome"
      ? lista
      : [...lista].sort((a, b) => averagePct(b.celulas) - averagePct(a.celulas));
  }, [heatmap.data, equipe, ordem]);

  if (contexto.error) return <CapacityProblem error={contexto.error} />;
  if (!contexto.data) return <CapacityLoading />;
  if (heatmap.error) return <CapacityProblem error={heatmap.error} />;

  const data = heatmap.data;
  const resumo = data?.resumo;
  const primeiraSemana = data?.semanas[0];

  return (
    <>
      <div className="capacity-toolbar">
        <ScenarioPicker contexto={contexto.data} value={cenario} onChange={setCenario} />

        <div className="capacity-field">
          <label className="field-label" htmlFor="utilizacao-equipe">
            {t("util.team")}
          </label>
          <select
            id="utilizacao-equipe"
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
        <div className="capacity-field">
          <span className="field-label" id="utilizacao-periodo">
            {t("util.period")}
          </span>
          <div className="segmented" role="group" aria-labelledby="utilizacao-periodo">
            <button
              type="button"
              aria-label={t("util.weeksBefore", { n: PASSO })}
              disabled={!primeiraSemana}
              onClick={() => primeiraSemana && setInicio(shiftWeek(primeiraSemana, -PASSO))}
            >
              ‹
            </button>
            <button type="button" aria-pressed={inicio === undefined} onClick={() => setInicio(undefined)}>
              {t("util.today")}
            </button>
            <button
              type="button"
              aria-label={t("util.weeksAfter", { n: PASSO })}
              disabled={!primeiraSemana}
              onClick={() => primeiraSemana && setInicio(shiftWeek(primeiraSemana, PASSO))}
            >
              ›
            </button>
          </div>
        </div>
      </div>
      <div className="kpis">
        <KpiCard
          label={t("util.kpi.avg")}
          value={resumo?.media != null ? `${resumo.media}%` : undefined}
          detail={t("util.kpi.avgDetail")}
        />
        <KpiCard label={t("util.kpi.over")} value={resumo ? String(resumo.sobrecarregados) : undefined} detail={t("util.kpi.overDetail")} />
        <KpiCard label={t("util.kpi.risk")} value={resumo ? String(resumo.emRisco) : undefined} detail={t("util.kpi.riskDetail")} />
        <KpiCard label={t("util.kpi.conflict")} value={resumo ? String(resumo.conflitos) : undefined} detail={t("util.kpi.conflictDetail")} />
        <KpiCard label={t("util.kpi.idle")} value={resumo ? String(resumo.ociosos) : undefined} detail={t("util.kpi.idleDetail")} />
      </div>
      <div className="grid">
        <Panel
          title={t("util.panel")}
          note={t("util.panelNote")}
          span={12}
          actions={
            <div className="segmented" role="group" aria-label={t("util.sort")}>
              <button type="button" aria-pressed={ordem === "carga"} onClick={() => setOrdem("carga")}>
                {t("util.sortLoad")}
              </button>
              <button type="button" aria-pressed={ordem === "nome"} onClick={() => setOrdem("nome")}>
                {t("util.sortName")}
              </button>
            </div>
          }
        >
          <FaixaLegend />

          {!data ? (
            <p className="capacity-muted" aria-busy="true">
              {t("ui.loading")}
            </p>
          ) : pessoas.length === 0 ? (
            <p className="capacity-muted">{t("util.empty")}</p>
          ) : (
            <div className={heatmap.loading ? "heatmap-scroll is-loading" : "heatmap-scroll"}>
              <table className="heatmap">
                <caption className="sr-only">{t("util.caption", { data: shortDate(data.semanas[0]) })}</caption>
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
                  {pessoas.map((pessoa) => (
                    <tr key={pessoa.id}>
                      <th scope="row" className="heatmap-person">
                        <span className="heatmap-name">{pessoa.nome}</span>
                        <span className="heatmap-role">{cargoLabel(pessoa.cargo)}</span>
                      </th>
                      {data.semanas.map((semana) => {
                        const uso = pessoa.celulas[semana];
                        const resumoCelula = uso
                          ? t("util.cell", {
                              nome: pessoa.nome,
                              data: shortDate(semana),
                              pct: formatPct(uso),
                              faixa: faixaLabel(uso.faixa),
                              horas: formatHoras(uso),
                            })
                          : t("util.cellEmpty", { nome: pessoa.nome, data: shortDate(semana) });
                        return (
                          <td
                            key={semana}
                            className={`heat ${uso ? faixaClass(uso.faixa) : "heat--empty"} ${semana === data.semanaAtual ? "is-current" : ""}`}
                            title={resumoCelula}
                            tabIndex={0}
                            aria-label={resumoCelula}
                          >
                            {uso ? formatPct(uso) : ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
