import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { KpiCard } from "../components/KpiCard";
import { Panel } from "../components/Panel";
import { t } from "../i18n";
import { alertText, alertTypeLabel, fetchAlerts, gravidadeLabel, type Alerta, type Gravidade } from "../lib/capacity";
import type { DashboardPageProps, Tone } from "../types";
import {
  CapacityLoading,
  CapacityProblem,
  ScenarioPicker,
  shortDate,
  toCapacityError,
  useCapacityContext,
  useScenario,
  type Loaded,
} from "./capacity/shared";

const GRAVIDADE_TONE: Record<Gravidade, Tone> = { alta: "negative", media: "warning", baixa: "neutral" };

type Filtro = "todas" | Gravidade;

export function AlertasPage({ session }: DashboardPageProps) {
  const contexto = useCapacityContext(session);
  const [cenario, setCenario] = useScenario(contexto.data);
  const [alertas, setAlertas] = useState<Loaded<Alerta[]>>({ data: null, error: null, loading: true });
  const [gravidade, setGravidade] = useState<Filtro>("todas");
  const [tipo, setTipo] = useState("");

  useEffect(() => {
    if (!contexto.data) return;
    let cancelado = false;
    setAlertas((atual) => ({ ...atual, loading: true }));
    fetchAlerts(session, cenario)
      .then((data) => !cancelado && setAlertas({ data, error: null, loading: false }))
      .catch((failure) => !cancelado && setAlertas({ data: null, error: toCapacityError(failure), loading: false }));
    return () => {
      cancelado = true;
    };
  }, [session, contexto.data, cenario]);

  const lista = alertas.data ?? [];
  const tipos = useMemo(() => [...new Set(lista.map((alerta) => alerta.tipo))].sort(), [lista]);
  const visiveis = lista.filter(
    (alerta) => (gravidade === "todas" || alerta.gravidade === gravidade) && (tipo === "" || alerta.tipo === tipo),
  );
  const contar = (g: Gravidade) => lista.filter((alerta) => alerta.gravidade === g).length;

  if (contexto.error) return <CapacityProblem error={contexto.error} />;
  if (!contexto.data) return <CapacityLoading />;
  if (alertas.error) return <CapacityProblem error={alertas.error} />;

  return (
    <>
      <div className="capacity-toolbar">
        <ScenarioPicker contexto={contexto.data} value={cenario} onChange={setCenario} />

        <div className="capacity-field">
          <label className="field-label" htmlFor="alertas-tipo">
            {t("alerts.type")}
          </label>
          <select id="alertas-tipo" className="input input--compact" value={tipo} onChange={(event) => setTipo(event.target.value)}>
            <option value="">{t("alerts.allTypes")}</option>
            {tipos.map((item) => (
              <option key={item} value={item}>
                {alertTypeLabel(item)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="kpis">
        <KpiCard label={t("alerts.kpi.total")} value={alertas.data ? String(lista.length) : undefined} detail={t("alerts.kpi.totalDetail")} />
        <KpiCard label={t("alerts.kpi.high")} value={alertas.data ? String(contar("alta")) : undefined} detail={t("alerts.kpi.highDetail")} />
        <KpiCard label={t("alerts.kpi.medium")} value={alertas.data ? String(contar("media")) : undefined} detail={t("alerts.kpi.mediumDetail")} />
        <KpiCard label={t("alerts.kpi.low")} value={alertas.data ? String(contar("baixa")) : undefined} detail={t("alerts.kpi.lowDetail")} />
      </div>
      <div className="grid">
        <Panel
          title={t("alerts.panel")}
          note={t("alerts.panelNote")}
          span={12}
          actions={
            <div className="segmented" role="group" aria-label={t("alerts.filter")}>
              {(["todas", "alta", "media", "baixa"] as Filtro[]).map((item) => (
                <button key={item} type="button" aria-pressed={gravidade === item} onClick={() => setGravidade(item)}>
                  {item === "todas" ? t("alerts.all") : gravidadeLabel(item)}
                </button>
              ))}
            </div>
          }
        >
          {!alertas.data ? (
            <p className="capacity-muted" aria-busy="true">
              {t("ui.loading")}
            </p>
          ) : visiveis.length === 0 ? (
            <p className="capacity-muted">{t("alerts.none")}</p>
          ) : (
            <ul className={alertas.loading ? "alert-list is-loading" : "alert-list"}>
              {visiveis.map((alerta, index) => (
                <li key={`${alerta.tipo}-${alerta.pessoa}-${alerta.data}-${index}`} className={`alert-item alert-item--${alerta.gravidade}`}>
                  <div className="alert-tags">
                    <Badge tone={GRAVIDADE_TONE[alerta.gravidade]}>{gravidadeLabel(alerta.gravidade)}</Badge>
                    <span className="alert-type">{alertTypeLabel(alerta.tipo)}</span>
                  </div>
                  <div className="alert-body">
                    <p className="alert-message">
                      {alerta.nome && <strong>{alerta.nome}: </strong>}
                      {alertText(alerta)}
                    </p>
                    <p className="alert-meta">
                      {shortDate(alerta.data)} · {alerta.origem === "calculado" ? t("alerts.computed") : t("alerts.recorded")}
                      {alerta.pessoa !== null && (
                        <>
                          {" · "}
                          <a href="#planejamento">{t("alerts.seePlan")}</a>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
