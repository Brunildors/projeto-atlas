import { useEffect, useState } from "react";
import { Badge } from "../components/Badge";
import { BarChart } from "../components/BarChart";
import { DataTable } from "../components/DataTable";
import { KpiCard } from "../components/KpiCard";
import { LineChart } from "../components/LineChart";
import { Meter } from "../components/Meter";
import { Panel } from "../components/Panel";
import {
  EMPTY_LATENCY_WINDOW,
  fetchInfraSnapshot,
  REQUESTS_BY_SERVICE,
  SERVER_TONE,
  SERVERS,
} from "../data/infra";
import { formatMaybe, formatNumber, formatPercent } from "../lib/format";
import { latest, latestChange } from "../lib/math";
import type { Column, InfraSnapshot, Server } from "../types";

const TICK_MS = 2_000;

const FONTE = "Ligue a fonte em fetchInfraSnapshot(), em data/infra.ts.";

const COLUMNS: Column<Server>[] = [
  {
    key: "name",
    header: "Servidor",
    render: (row) => <code>{row.name}</code>,
    sortValue: (row) => row.name,
  },
  {
    key: "region",
    header: "Região",
    render: (row) => row.region,
    sortValue: (row) => row.region,
  },
  {
    key: "status",
    header: "Situação",
    render: (row) => <Badge tone={SERVER_TONE[row.status]}>{row.status}</Badge>,
    sortValue: (row) => row.status,
  },
  {
    key: "cpu",
    header: "CPU",
    render: (row) => <Meter value={row.cpu} label={`CPU de ${row.name}`} />,
    sortValue: (row) => row.cpu,
  },
  {
    key: "memory",
    header: "Memória",
    render: (row) => <Meter value={row.memory} label={`Memória de ${row.name}`} />,
    sortValue: (row) => row.memory,
  },
  {
    key: "latency",
    header: "Latência",
    align: "right",
    render: (row) => (row.status === "Fora do ar" ? "sem resposta" : `${formatNumber(row.latency)} ms`),
    sortValue: (row) => row.latency,
  },
];

export function InfraPage() {
  const [paused, setPaused] = useState(false);

  const [snapshot, setSnapshot] = useState<InfraSnapshot | null>(null);

  useEffect(() => {
    if (paused) return;

    let cancelado = false;

    const atualizar = async () => {
      const proximo = await fetchInfraSnapshot();

      if (!cancelado && proximo) setSnapshot(proximo);
    };

    void atualizar();
    const timer = window.setInterval(atualizar, TICK_MS);

    return () => {
      cancelado = true;
      window.clearInterval(timer);
    };
  }, [paused]);

  const latency = snapshot?.latency ?? EMPTY_LATENCY_WINDOW;
  const servers = snapshot?.servers ?? SERVERS;
  const requestsPerSecond = snapshot?.requestsPerSecond ?? null;
  const availability = snapshot?.availability ?? null;

  const onlineCount = servers.filter((server) => server.status !== "Fora do ar").length;

  return (
    <>
      <div className="live-bar">
        <span className={`live-dot ${paused ? "is-paused" : ""}`} aria-hidden="true" />
        <span>{paused ? "Atualização pausada" : "Atualizando a cada 2 segundos"}</span>
        <button type="button" className="btn" onClick={() => setPaused((value) => !value)}>
          {paused ? "Retomar atualização" : "Pausar atualização"}
        </button>
      </div>
      <div className="kpis">
        <KpiCard
          label="Disponibilidade, 30 dias"
          value={formatMaybe(availability, (value) => formatPercent(value, 2))}
          comparison="vs. mês anterior"
        />
        <KpiCard
          label="Latência p95"
          value={formatMaybe(latest(latency.p95), (value) => `${formatNumber(value)} ms`)}
          delta={latestChange(latency.p95) ?? undefined}
          goodWhen="down"
          comparison="no último minuto"
          spark={latency.p95}
        />
        <KpiCard
          label="Requisições por segundo"
          value={formatMaybe(requestsPerSecond, formatNumber)}
        />
        <KpiCard
          label="Servidores no ar"
          value={servers.length === 0 ? undefined : `${onlineCount} de ${servers.length}`}
        />
      </div>
      <div className="grid">
        <Panel title="Latência das requisições" note="Último minuto, em milissegundos" span={8}>
          <LineChart
            ariaLabel="Latência p50 e p95 no último minuto"
            labels={latency.labels}
            format={(value) => `${formatNumber(value)} ms`}
            series={[
              { name: "p95", color: "var(--c3)", values: latency.p95 },
              { name: "p50", color: "var(--c1)", values: latency.p50 },
            ]}
            emptyMessage="Aguardando medições de latência"
            emptyHint={FONTE}
          />
        </Panel>
        <Panel title="Requisições por serviço" note="Por segundo, média da última hora" span={4}>
          <BarChart
            data={REQUESTS_BY_SERVICE}
            color="var(--c2)"
            format={(value) => formatNumber(value)}
            ariaLabel="Requisições por segundo de cada serviço"
            width={380}
            height={300}
            emptyMessage="Nenhum serviço monitorado"
            emptyHint="Preencha REQUESTS_BY_SERVICE em data/infra.ts."
          />
        </Panel>
        <Panel title="Servidores" note="Clique no título de uma coluna para ordenar" span={12}>
          <DataTable
            columns={COLUMNS}
            rows={servers}
            getKey={(row) => row.id}
            emptyMessage={`Nenhum servidor na frota. ${FONTE}`}
          />
        </Panel>
      </div>
    </>
  );
}
