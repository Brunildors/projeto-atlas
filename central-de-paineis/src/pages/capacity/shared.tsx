import { useEffect, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { t } from "../../i18n";
import {
  BASELINE_ID,
  CapacityError,
  FAIXAS,
  faixaClass,
  faixaHint,
  faixaLabel,
  fetchContext,
  formatPct,
  readScenario,
  storeScenario,
  type Contexto,
  type Uso,
} from "../../lib/capacity";
import { formatDayMonth } from "../../lib/format";
import type { Session } from "../../types";

export interface Loaded<T> {
  data: T | null;
  error: CapacityError | null;
  loading: boolean;
}

export const toCapacityError = (failure: unknown): CapacityError =>
  failure instanceof CapacityError ? failure : new CapacityError(t("capErr.load"));

export function useCapacityContext(session: Session): Loaded<Contexto> {
  const [state, setState] = useState<Loaded<Contexto>>({ data: null, error: null, loading: true });

  useEffect(() => {
    let cancelado = false;
    fetchContext(session)
      .then((data) => !cancelado && setState({ data, error: null, loading: false }))
      .catch((failure) => !cancelado && setState({ data: null, error: toCapacityError(failure), loading: false }));
    return () => {
      cancelado = true;
    };
  }, [session]);

  return state;
}

export function useScenario(contexto: Contexto | null): [number, (id: number) => void] {
  const [cenario, setCenario] = useState(readScenario);

  const valido = !contexto || contexto.cenarios.some((item) => item.id === cenario) ? cenario : BASELINE_ID;

  const escolher = (id: number) => {
    storeScenario(id);
    setCenario(id);
  };

  return [valido, escolher];
}

export function ScenarioPicker({
  contexto,
  value,
  onChange,
}: {
  contexto: Contexto;
  value: number;
  onChange: (id: number) => void;
}) {
  const atual = contexto.cenarios.find((item) => item.id === value);

  return (
    <div className="capacity-field">
      <label className="field-label" htmlFor="capacidade-cenario">
        {t("cap.scenario")}
      </label>
      <select
        id="capacidade-cenario"
        className="input input--compact"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {contexto.cenarios.map((item) => (
          <option key={item.id} value={item.id}>
            {item.base ? t("cap.scenarioReal", { nome: item.nome }) : t("cap.scenarioSim", { nome: item.nome })}
          </option>
        ))}
      </select>
      {atual?.descricao && <p className="capacity-field-hint">{atual.descricao}</p>}
    </div>
  );
}

export function FaixaLegend() {
  return (
    <ul className="faixa-legend" aria-label={t("cap.legend")}>
      {FAIXAS.map((faixa) => (
        <li key={faixa} title={faixaHint(faixa)}>
          <span className={`faixa-swatch ${faixaClass(faixa)}`} aria-hidden="true" />
          {faixaLabel(faixa)}
        </li>
      ))}
    </ul>
  );
}

export function UsoBadge({ uso }: { uso: Uso | undefined }) {
  if (!uso) return <span className="uso-badge">—</span>;
  return (
    <span className={`uso-badge ${faixaClass(uso.faixa)}`} title={faixaLabel(uso.faixa)}>
      {formatPct(uso)}
      <span className="sr-only"> ({faixaLabel(uso.faixa)})</span>
    </span>
  );
}

export function CapacityProblem({ error }: { error: CapacityError }) {
  return (
    <div className="grid">
      <section className="panel span-12" role="alert">
        <EmptyState
          message={error.status === 403 ? t("cap.forbidden") : error.message}
          hint={error.status === 403 ? t("cap.forbiddenHint") : t("cap.problemHint")}
          minHeight={220}
        />
      </section>
    </div>
  );
}

export function CapacityLoading({ message = t("cap.loading") }: { message?: string }) {
  return (
    <div className="grid">
      <section className="panel span-12" aria-busy="true">
        <EmptyState message={message} minHeight={220} />
      </section>
    </div>
  );
}

export const shortDate = (iso: string): string => formatDayMonth(iso.slice(0, 10));
