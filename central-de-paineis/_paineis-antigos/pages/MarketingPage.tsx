import { BarChart } from "../components/BarChart";
import { DataTable } from "../components/DataTable";
import { Funnel } from "../components/Funnel";
import { KpiCard } from "../components/KpiCard";
import { LineChart } from "../components/LineChart";
import { Panel } from "../components/Panel";
import {
  CAMPAIGNS,
  FUNNEL_STAGES,
  LAST_30_DAYS,
  roas,
  SALES_BY_CHANNEL,
  sessions,
} from "../data/marketing";
import {
  formatCompact,
  formatCurrency,
  formatMaybe,
  formatNumber,
  formatPercent,
  NO_DATA,
} from "../lib/format";
import { safeDivide, sum, sumBy } from "../lib/math";
import type { Campaign, Column } from "../types";

const FONTE = "Preencha as listas em data/marketing.ts.";

const COLUMNS: Column<Campaign>[] = [
  {
    key: "name",
    header: "Campanha",
    render: (row) => row.name,
    sortValue: (row) => row.name,
  },
  {
    key: "channel",
    header: "Canal",
    render: (row) => row.channel,
    sortValue: (row) => row.channel,
  },
  {
    key: "spend",
    header: "Investimento",
    align: "right",
    render: (row) => formatCurrency(row.spend),
    sortValue: (row) => row.spend,
  },
  {
    key: "conversions",
    header: "Vendas",
    align: "right",
    render: (row) => formatNumber(row.conversions),
    sortValue: (row) => row.conversions,
  },
  {
    key: "cpa",
    header: "Custo por venda",
    align: "right",
    render: (row) => formatMaybe(safeDivide(row.spend, row.conversions), formatCurrency) ?? NO_DATA,
    sortValue: (row) => safeDivide(row.spend, row.conversions) ?? 0,
  },
  {
    key: "roas",
    header: "Retorno",
    align: "right",
    render: (row) => {
      const value = roas(row);
      if (value === null) return NO_DATA;

      return (
        <span className={value < 2 ? "text-negative" : "text-positive"}>
          {formatNumber(value, 1)}×
        </span>
      );
    },
    sortValue: (row) => roas(row) ?? 0,
  },
];

export function MarketingPage() {
  const totalSpend = sumBy(CAMPAIGNS, (c) => c.spend);
  const totalRevenue = sumBy(CAMPAIGNS, (c) => c.revenue);
  const totalConversions = sumBy(CAMPAIGNS, (c) => c.conversions);

  const totalSessions = sessions.length === 0 ? null : sum(sessions);

  const hasFunnel = FUNNEL_STAGES.length > 0;
  const visitors = hasFunnel ? FUNNEL_STAGES[0].value : null;
  const buyers = hasFunnel ? FUNNEL_STAGES[FUNNEL_STAGES.length - 1].value : null;
  const conversionRate = safeDivide(buyers, visitors);

  return (
    <>
      <div className="kpis">
        <KpiCard
          label="Sessões, 30 dias"
          value={formatMaybe(totalSessions, formatCompact)}
          spark={sessions}
        />
        <KpiCard
          label="Taxa de conversão"
          value={formatMaybe(conversionRate, (value) => formatPercent(value * 100, 2))}
        />
        <KpiCard
          label="Custo por venda"
          value={formatMaybe(safeDivide(totalSpend, totalConversions), formatCurrency)}
          goodWhen="down"
        />
        <KpiCard
          label="Retorno sobre anúncios"
          value={formatMaybe(
            safeDivide(totalRevenue, totalSpend),
            (value) => `${formatNumber(value, 1)}×`,
          )}
        />
      </div>
      <div className="grid">
        <Panel title="Sessões por dia" note="Últimos 30 dias" span={8}>
          <LineChart
            ariaLabel="Sessões diárias nos últimos 30 dias"
            labels={LAST_30_DAYS}
            series={[{ name: "Sessões", color: "var(--c2)", values: sessions }]}
            format={formatCompact}
            area
            emptyMessage="Sem sessões no período"
            emptyHint={FONTE}
          />
        </Panel>
        <Panel title="Funil de compra" note="Últimos 30 dias" span={4}>
          <Funnel stages={FUNNEL_STAGES} />
        </Panel>
        <Panel title="Vendas por canal" note="Últimos 30 dias" span={12}>
          <BarChart
            data={SALES_BY_CHANNEL}
            format={formatCompact}
            ariaLabel="Vendas por canal de aquisição"
            width={1_000}
            height={240}
            emptyMessage="Sem vendas por canal"
            emptyHint={FONTE}
          />
        </Panel>
        <Panel title="Campanhas" note="Retorno abaixo de 2× aparece em vermelho" span={12}>
          <DataTable
            columns={COLUMNS}
            rows={CAMPAIGNS}
            getKey={(row) => row.id}
            emptyMessage={`Nenhuma campanha cadastrada. ${FONTE}`}
          />
        </Panel>
      </div>
    </>
  );
}
