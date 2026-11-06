import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { DataTable } from "../components/DataTable";
import { DonutChart } from "../components/DonutChart";
import { KpiCard } from "../components/KpiCard";
import { LineChart } from "../components/LineChart";
import { Panel } from "../components/Panel";
import {
  cash,
  expenses,
  expensesByCategory,
  MONTHS,
  profit,
  revenue,
  STATUS_FILTERS,
  STATUS_TONE,
  transactions,
} from "../data/finance";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatIsoDate,
  formatMaybe,
} from "../lib/format";
import { latest, latestChange } from "../lib/math";
import type { Column, Transaction, TransactionFilter } from "../types";

const FONTE = "Preencha as listas em data/finance.ts.";

const COLUMNS: Column<Transaction>[] = [
  {
    key: "date",
    header: "Data",
    render: (row) => formatIsoDate(row.date),
    sortValue: (row) => row.date,
  },
  {
    key: "description",
    header: "Descrição",
    render: (row) => row.description,
    sortValue: (row) => row.description,
  },
  {
    key: "category",
    header: "Categoria",
    render: (row) => row.category,
  },
  {
    key: "amount",
    header: "Valor",
    align: "right",
    render: (row) => (
      <span className={row.amount < 0 ? "text-negative" : "text-positive"}>
        {formatCurrency(row.amount)}
      </span>
    ),
    sortValue: (row) => row.amount,
  },
  {
    key: "status",
    header: "Situação",
    render: (row) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
  },
];

export function FinancePage() {
  const [filter, setFilter] = useState<TransactionFilter>("Todas");

  const visibleRows = useMemo(
    () => (filter === "Todas" ? transactions : transactions.filter((row) => row.status === filter)),
    [filter],
  );

  const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.value, 0);

  return (
    <>
      <div className="kpis">
        <KpiCard
          label="Receita no último mês"
          value={formatMaybe(latest(revenue), formatCurrency)}
          delta={latestChange(revenue) ?? undefined}
          comparison="vs. mês anterior"
          spark={revenue}
        />
        <KpiCard
          label="Despesas"
          value={formatMaybe(latest(expenses), formatCurrency)}
          delta={latestChange(expenses) ?? undefined}
          goodWhen="down"
          comparison="vs. mês anterior"
          spark={expenses}
        />
        <KpiCard
          label="Lucro líquido"
          value={formatMaybe(latest(profit), formatCurrency)}
          delta={latestChange(profit) ?? undefined}
          comparison="vs. mês anterior"
          spark={profit}
        />
        <KpiCard
          label="Caixa disponível"
          value={formatMaybe(latest(cash), formatCurrencyCompact)}
          delta={latestChange(cash) ?? undefined}
          comparison="vs. mês anterior"
          spark={cash}
        />
      </div>
      <div className="grid">
        <Panel title="Receita e despesas" note="Últimos 12 meses" span={8}>
          <LineChart
            ariaLabel="Receita e despesas mensais nos últimos 12 meses"
            labels={MONTHS}
            format={formatCurrencyCompact}
            series={[
              { name: "Receita", color: "var(--c1)", values: revenue },
              { name: "Despesas", color: "var(--c4)", values: expenses },
            ]}
            emptyMessage="Sem receita e despesas no período"
            emptyHint={FONTE}
          />
        </Panel>
        <Panel title="Para onde foi o dinheiro" note="Despesas por categoria" span={4}>
          <DonutChart
            data={expensesByCategory}
            centerValue={formatCurrencyCompact(totalExpenses)}
            centerLabel="em despesas"
            format={formatCurrencyCompact}
            emptyMessage="Sem despesas por categoria"
            emptyHint={FONTE}
          />
        </Panel>
        <Panel
          title="Movimentações recentes"
          span={12}
          actions={
            <div className="segmented" role="group" aria-label="Filtrar por situação">
              {STATUS_FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={filter === option}
                  onClick={() => setFilter(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          }
        >
          <DataTable
            columns={COLUMNS}
            rows={visibleRows}
            getKey={(row) => row.id}
            emptyMessage={
              transactions.length === 0
                ? `Nenhuma movimentação cadastrada. ${FONTE}`
                : "Nenhuma movimentação com essa situação."
            }
          />
        </Panel>
      </div>
    </>
  );
}
