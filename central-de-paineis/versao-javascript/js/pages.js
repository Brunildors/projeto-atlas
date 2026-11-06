import {
  buildMonthGrid,
  clampYear,
  MONTH_NAMES,
  shiftMonth,
  todayIso,
  toWeeks,
  weekdayOf,
  WEEKDAYS,
} from "./calendar.js";
import { BarChart, DonutChart, LineChart } from "./charts.js";
import { Badge, EmptyState, Funnel, KpiCard, Meter, Panel } from "./components.js";
import {
  CAMPAIGNS,
  cash,
  EMPTY_LATENCY_WINDOW,
  expenses,
  expensesByCategory,
  fetchInfraSnapshot,
  FUNNEL_STAGES,
  LAST_30_DAYS,
  MONTHS,
  profit,
  REQUESTS_BY_SERVICE,
  revenue,
  roas,
  SALES_BY_CHANNEL,
  SERVER_TONE,
  SERVERS,
  sessions,
  STATUS_FILTERS,
  STATUS_TONE,
  transactions,
} from "./data.js";
import { displayName, findEmployee } from "./employees.js";
import {
  formatCompact,
  formatCurrency,
  formatCurrencyCompact,
  formatIsoDate,
  formatIsoDateLong,
  formatIsoDateTime,
  formatMaybe,
  formatNumber,
  formatPercent,
  NO_DATA,
} from "./format.js";
import { holidaysForYear, MAX_YEAR, MIN_YEAR, nextHoliday } from "./holidays.js";
import { latest, latestChange, safeDivide, sum, sumBy } from "./math.js";
import { Fragment, h, useEffect, useMemo, useState } from "./react.js";
import { DataTable } from "./table.js";
import { formatCpf, formatPhone } from "./validation.js";

const FONTE_FINANCAS = "Preencha as listas de Finanças em data.js.";

const TRANSACTION_COLUMNS = [
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
    render: (row) =>
      h(
        "span",
        { className: row.amount < 0 ? "text-negative" : "text-positive" },
        formatCurrency(row.amount),
      ),
    sortValue: (row) => row.amount,
  },
  {
    key: "status",
    header: "Situação",
    render: (row) => h(Badge, { tone: STATUS_TONE[row.status] }, row.status),
  },
];

export function FinancePage() {
  const [filter, setFilter] = useState("Todas");

  const visibleRows = useMemo(
    () => (filter === "Todas" ? transactions : transactions.filter((row) => row.status === filter)),
    [filter],
  );

  const totalExpenses = expensesByCategory.reduce((acc, item) => acc + item.value, 0);

  return h(
    Fragment,
    null,
    h(
      "div",
      { className: "kpis" },
      h(KpiCard, {
        label: "Receita no último mês",
        value: formatMaybe(latest(revenue), formatCurrency),
        delta: latestChange(revenue) ?? undefined,
        comparison: "vs. mês anterior",
        spark: revenue,
      }),
      h(KpiCard, {
        label: "Despesas",
        value: formatMaybe(latest(expenses), formatCurrency),
        delta: latestChange(expenses) ?? undefined,
        goodWhen: "down",
        comparison: "vs. mês anterior",
        spark: expenses,
      }),
      h(KpiCard, {
        label: "Lucro líquido",
        value: formatMaybe(latest(profit), formatCurrency),
        delta: latestChange(profit) ?? undefined,
        comparison: "vs. mês anterior",
        spark: profit,
      }),
      h(KpiCard, {
        label: "Caixa disponível",
        value: formatMaybe(latest(cash), formatCurrencyCompact),
        delta: latestChange(cash) ?? undefined,
        comparison: "vs. mês anterior",
        spark: cash,
      }),
    ),

    h(
      "div",
      { className: "grid" },
      h(
        Panel,
        { title: "Receita e despesas", note: "Últimos 12 meses", span: 8 },
        h(LineChart, {
          ariaLabel: "Receita e despesas mensais nos últimos 12 meses",
          labels: MONTHS,
          format: formatCurrencyCompact,
          series: [
            { name: "Receita", color: "var(--c1)", values: revenue },
            { name: "Despesas", color: "var(--c4)", values: expenses },
          ],
          emptyMessage: "Sem receita e despesas no período",
          emptyHint: FONTE_FINANCAS,
        }),
      ),

      h(
        Panel,
        { title: "Para onde foi o dinheiro", note: "Despesas por categoria", span: 4 },
        h(DonutChart, {
          data: expensesByCategory,
          centerValue: formatCurrencyCompact(totalExpenses),
          centerLabel: "em despesas",
          format: formatCurrencyCompact,
          emptyMessage: "Sem despesas por categoria",
          emptyHint: FONTE_FINANCAS,
        }),
      ),

      h(
        Panel,
        {
          title: "Movimentações recentes",
          span: 12,
          actions: h(
            "div",
            { className: "segmented", role: "group", "aria-label": "Filtrar por situação" },
            STATUS_FILTERS.map((option) =>
              h(
                "button",
                {
                  key: option,
                  type: "button",
                  "aria-pressed": filter === option,
                  onClick: () => setFilter(option),
                },
                option,
              ),
            ),
          ),
        },
        h(DataTable, {
          columns: TRANSACTION_COLUMNS,
          rows: visibleRows,
          getKey: (row) => row.id,
          emptyMessage:
            transactions.length === 0
              ? `Nenhuma movimentação cadastrada. ${FONTE_FINANCAS}`
              : "Nenhuma movimentação com essa situação.",
        }),
      ),
    ),
  );
}

const TICK_MS = 2_000;

const FONTE_INFRA = "Ligue a fonte em fetchInfraSnapshot(), em data.js.";

const SERVER_COLUMNS = [
  {
    key: "name",
    header: "Servidor",
    render: (row) => h("code", null, row.name),
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
    render: (row) => h(Badge, { tone: SERVER_TONE[row.status] }, row.status),
    sortValue: (row) => row.status,
  },
  {
    key: "cpu",
    header: "CPU",
    render: (row) => h(Meter, { value: row.cpu, label: `CPU de ${row.name}` }),
    sortValue: (row) => row.cpu,
  },
  {
    key: "memory",
    header: "Memória",
    render: (row) => h(Meter, { value: row.memory, label: `Memória de ${row.name}` }),
    sortValue: (row) => row.memory,
  },
  {
    key: "latency",
    header: "Latência",
    align: "right",
    render: (row) =>
      row.status === "Fora do ar" ? "sem resposta" : `${formatNumber(row.latency)} ms`,
    sortValue: (row) => row.latency,
  },
];

export function InfraPage() {
  const [paused, setPaused] = useState(false);

  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (paused) return;

    let cancelado = false;

    const atualizar = async () => {
      const proximo = await fetchInfraSnapshot();

      if (!cancelado && proximo) setSnapshot(proximo);
    };

    atualizar();
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

  return h(
    Fragment,
    null,
    h(
      "div",
      { className: "live-bar" },
      h("span", { className: `live-dot ${paused ? "is-paused" : ""}`, "aria-hidden": "true" }),
      h("span", null, paused ? "Atualização pausada" : "Atualizando a cada 2 segundos"),
      h(
        "button",
        { type: "button", className: "btn", onClick: () => setPaused((value) => !value) },
        paused ? "Retomar atualização" : "Pausar atualização",
      ),
    ),

    h(
      "div",
      { className: "kpis" },
      h(KpiCard, {
        label: "Disponibilidade, 30 dias",
        value: formatMaybe(availability, (value) => formatPercent(value, 2)),
        comparison: "vs. mês anterior",
      }),
      h(KpiCard, {
        label: "Latência p95",
        value: formatMaybe(latest(latency.p95), (value) => `${formatNumber(value)} ms`),
        delta: latestChange(latency.p95) ?? undefined,
        goodWhen: "down",
        comparison: "no último minuto",
        spark: latency.p95,
      }),
      h(KpiCard, {
        label: "Requisições por segundo",
        value: formatMaybe(requestsPerSecond, formatNumber),
      }),
      h(KpiCard, {
        label: "Servidores no ar",
        value: servers.length === 0 ? undefined : `${onlineCount} de ${servers.length}`,
      }),
    ),

    h(
      "div",
      { className: "grid" },
      h(
        Panel,
        { title: "Latência das requisições", note: "Último minuto, em milissegundos", span: 8 },
        h(LineChart, {
          ariaLabel: "Latência p50 e p95 no último minuto",
          labels: latency.labels,
          format: (value) => `${formatNumber(value)} ms`,
          series: [
            { name: "p95", color: "var(--c3)", values: latency.p95 },
            { name: "p50", color: "var(--c1)", values: latency.p50 },
          ],
          emptyMessage: "Aguardando medições de latência",
          emptyHint: FONTE_INFRA,
        }),
      ),

      h(
        Panel,
        { title: "Requisições por serviço", note: "Por segundo, média da última hora", span: 4 },
        h(BarChart, {
          data: REQUESTS_BY_SERVICE,
          color: "var(--c2)",
          format: (value) => formatNumber(value),
          ariaLabel: "Requisições por segundo de cada serviço",
          width: 380,
          height: 300,
          emptyMessage: "Nenhum serviço monitorado",
          emptyHint: "Preencha REQUESTS_BY_SERVICE em data.js.",
        }),
      ),

      h(
        Panel,
        { title: "Servidores", note: "Clique no título de uma coluna para ordenar", span: 12 },
        h(DataTable, {
          columns: SERVER_COLUMNS,
          rows: servers,
          getKey: (row) => row.id,
          emptyMessage: `Nenhum servidor na frota. ${FONTE_INFRA}`,
        }),
      ),
    ),
  );
}

const FONTE_MARKETING = "Preencha as listas de Marketing em data.js.";

const CAMPAIGN_COLUMNS = [
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

      return h(
        "span",
        { className: value < 2 ? "text-negative" : "text-positive" },
        `${formatNumber(value, 1)}×`,
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

  return h(
    Fragment,
    null,
    h(
      "div",
      { className: "kpis" },
      h(KpiCard, {
        label: "Sessões, 30 dias",
        value: formatMaybe(totalSessions, formatCompact),
        spark: sessions,
      }),
      h(KpiCard, {
        label: "Taxa de conversão",
        value: formatMaybe(conversionRate, (value) => formatPercent(value * 100, 2)),
      }),
      h(KpiCard, {
        label: "Custo por venda",
        value: formatMaybe(safeDivide(totalSpend, totalConversions), formatCurrency),
        goodWhen: "down",
      }),
      h(KpiCard, {
        label: "Retorno sobre anúncios",
        value: formatMaybe(
          safeDivide(totalRevenue, totalSpend),
          (value) => `${formatNumber(value, 1)}×`,
        ),
      }),
    ),

    h(
      "div",
      { className: "grid" },
      h(
        Panel,
        { title: "Sessões por dia", note: "Últimos 30 dias", span: 8 },
        h(LineChart, {
          ariaLabel: "Sessões diárias nos últimos 30 dias",
          labels: LAST_30_DAYS,
          series: [{ name: "Sessões", color: "var(--c2)", values: sessions }],
          format: formatCompact,
          area: true,
          emptyMessage: "Sem sessões no período",
          emptyHint: FONTE_MARKETING,
        }),
      ),

      h(
        Panel,
        { title: "Funil de compra", note: "Últimos 30 dias", span: 4 },
        h(Funnel, { stages: FUNNEL_STAGES }),
      ),

      h(
        Panel,
        { title: "Vendas por canal", note: "Últimos 30 dias", span: 12 },
        h(BarChart, {
          data: SALES_BY_CHANNEL,
          format: formatCompact,
          ariaLabel: "Vendas por canal de aquisição",
          width: 1_000,
          height: 240,
          emptyMessage: "Sem vendas por canal",
          emptyHint: FONTE_MARKETING,
        }),
      ),

      h(
        Panel,
        { title: "Campanhas", note: "Retorno abaixo de 2× aparece em vermelho", span: 12 },
        h(DataTable, {
          columns: CAMPAIGN_COLUMNS,
          rows: CAMPAIGNS,
          getKey: (row) => row.id,
          emptyMessage: `Nenhuma campanha cadastrada. ${FONTE_MARKETING}`,
        }),
      ),
    ),
  );
}

export function HomePage({ dashboards, activeId }) {
  const shortcuts = dashboards.filter((item) => item.id !== activeId);

  return h(
    "div",
    { className: "grid" },
    h(
      Panel,
      { title: "Atalhos", note: "Escolha a área que você quer abrir", span: 12 },
      h(
        "nav",
        { className: "shortcuts", "aria-label": "Atalhos para as áreas do sistema" },
        shortcuts.map((item) =>
          h(
            "a",
            { key: item.id, className: "shortcut", href: `#${item.id}` },
            h("span", { className: "shortcut-icon", "aria-hidden": "true" }, item.icon),
            h(
              "span",
              { className: "shortcut-body" },
              h("span", { className: "shortcut-name" }, item.name),
              h("span", { className: "shortcut-text" }, item.description),
            ),
            h("span", { className: "shortcut-go", "aria-hidden": "true" }, "→"),
          ),
        ),
      ),
    ),
  );
}

function DataRow({ label, children }) {
  const filled = children !== undefined && children !== null && children !== "";

  return h(
    "div",
    { className: "data-row" },
    h("dt", null, label),
    h("dd", { className: filled ? undefined : "muted" }, filled ? children : NO_DATA),
  );
}

function initialsOf(name) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";

  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

  return (first + last).toUpperCase();
}

export function ProfilePage({ session }) {
  const employee = findEmployee(session.cpf);

  const title = employee ? displayName(employee) : formatCpf(session.cpf);

  let subtitle = "Cadastro não encontrado neste navegador";
  if (employee) {
    subtitle = employee.socialName.length > 0 ? employee.fullName : "Funcionário";
  }

  return h(
    "div",
    { className: "grid" },

    h(
      Panel,
      { title: "Funcionário", span: 12 },
      h(
        "div",
        { className: "profile-head" },
        h("span", { className: "profile-avatar", "aria-hidden": "true" }, initialsOf(title)),
        h(
          "div",
          { className: "profile-id" },
          h("p", { className: "profile-name" }, title),
          h("p", { className: "profile-sub" }, subtitle),
        ),
      ),
    ),

    h(
      Panel,
      { title: "Dados do cadastro", note: "Informações do funcionário atual", span: 7 },
      employee
        ? h(
            "dl",
            { className: "data-list" },
            h(DataRow, { label: "Nome completo" }, employee.fullName),
            h(DataRow, { label: "Nome social" }, employee.socialName),
            h(DataRow, { label: "CPF" }, formatCpf(employee.cpf)),
            h(DataRow, { label: "Telefone" }, formatPhone(employee.phone)),
            h(DataRow, { label: "Cadastrado em" }, formatIsoDateTime(employee.registeredAt)),
          )
        : h(EmptyState, {
            message: "Nenhum cadastro para este CPF",
            hint:
              "O cadastro fica no navegador deste computador. Saia e crie um cadastro com " +
              "este CPF para ver os dados aqui.",
            minHeight: 200,
          }),
    ),

    h(
      Panel,
      { title: "Acesso", note: "Esta sessão", span: 5 },
      h(
        "dl",
        { className: "data-list" },
        h(DataRow, { label: "CPF de entrada" }, formatCpf(session.cpf)),
        h(DataRow, { label: "Entrou em" }, formatIsoDateTime(session.since)),
        h(DataRow, { label: "Exibido como" }, title),
      ),
      h(
        "p",
        { className: "panel-foot" },
        "O nome que aparece no sistema é o nome social, quando há; na falta dele, o nome completo.",
      ),
    ),
  );
}

const KIND_TONE = { feriado: "negative", facultativo: "warning" };

const KIND_LABEL = { feriado: "Feriado", facultativo: "Ponto facultativo" };

const SCOPE_LABEL = {
  nacional: "Nacional",
  estadual: "Estadual (SP)",
  municipal: "Municipal (Santos)",
};

const HOLIDAY_COLUMNS = [
  {
    key: "date",
    header: "Data",
    render: (row) => formatIsoDate(row.date),
    sortValue: (row) => row.date,
  },
  {
    key: "weekday",
    header: "Dia",
    render: (row) => weekdayOf(row.date).short,
  },
  {
    key: "name",
    header: "Data comemorativa",
    render: (row) => row.name,
    sortValue: (row) => row.name,
  },
  {
    key: "kind",
    header: "Tipo",
    render: (row) => h(Badge, { tone: KIND_TONE[row.kind] }, KIND_LABEL[row.kind]),
    sortValue: (row) => KIND_LABEL[row.kind],
  },
  {
    key: "scope",
    header: "Abrangência",
    render: (row) => SCOPE_LABEL[row.scope],
    sortValue: (row) => SCOPE_LABEL[row.scope],
  },
  {
    key: "note",
    header: "Observação",
    render: (row) => h("span", { className: "muted" }, row.note ?? ""),
  },
];

const CALENDAR_LEGEND = [
  { className: "is-holiday", label: "Feriado" },
  { className: "is-optional", label: "Ponto facultativo" },
  { className: "is-today", label: "Hoje" },
  { className: "is-weekend", label: "Fim de semana" },
];

function HolidayItem({ holiday, withDate }) {
  return h(
    "li",
    { key: `${holiday.date}-${holiday.name}` },
    withDate && h("span", { className: "holiday-date" }, formatIsoDate(holiday.date)),
    h("span", { className: "holiday-name" }, holiday.name),
    h(Badge, { tone: KIND_TONE[holiday.kind] }, KIND_LABEL[holiday.kind]),
    h("span", { className: "holiday-scope" }, SCOPE_LABEL[holiday.scope]),
    holiday.note && h("span", { className: "holiday-note" }, holiday.note),
  );
}

export function CalendarPage() {
  const [today] = useState(todayIso);

  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)));

  const [selected, setSelected] = useState(null);

  const [yearDraft, setYearDraft] = useState(null);

  const grid = useMemo(() => buildMonthGrid(year, month, today), [year, month, today]);
  const weeks = useMemo(() => toWeeks(grid), [grid]);
  const yearHolidays = useMemo(() => holidaysForYear(year), [year]);

  const monthHolidays = useMemo(() => {
    const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
    return yearHolidays.filter((holiday) => holiday.date.startsWith(prefix));
  }, [yearHolidays, year, month]);

  const holidayCount = yearHolidays.filter((item) => item.kind === "feriado").length;
  const optionalCount = yearHolidays.length - holidayCount;

  const businessDays = grid.filter(
    (day) =>
      day.inMonth &&
      !day.isWeekend &&
      !day.holidays.some((holiday) => holiday.kind === "feriado"),
  ).length;

  const upcoming = nextHoliday(today);

  const selectedDay = selected ? grid.find((day) => day.iso === selected) : undefined;

  function goToMonth(delta) {
    const next = shiftMonth(year, month, delta);

    setYear(next.year);
    setMonth(next.month);
    setSelected(null);
    setYearDraft(null);
  }

  function goToToday() {
    setYear(Number(today.slice(0, 4)));
    setMonth(Number(today.slice(5, 7)));
    setSelected(today);
    setYearDraft(null);
  }

  function commitYear() {
    const typed = Number(yearDraft);

    if (yearDraft !== null && typed >= MIN_YEAR && typed <= MAX_YEAR) {
      setYear(clampYear(typed));
      setSelected(null);
    }

    setYearDraft(null);
  }

  const monthLabel = `${MONTH_NAMES[month - 1]} de ${year}`;
  const monthTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const navButton = (label, title, delta) =>
    h(
      "button",
      { type: "button", title, "aria-label": title, onClick: () => goToMonth(delta) },
      h("span", { "aria-hidden": "true" }, label),
    );

  const navigation = h(
    "div",
    { className: "calendar-nav" },
    h(
      "div",
      { className: "segmented", role: "group", "aria-label": "Navegar no calendário" },
      navButton("«", "Ano anterior", -12),
      navButton("‹", "Mês anterior", -1),
      navButton("›", "Mês seguinte", 1),
      navButton("»", "Ano seguinte", 12),
    ),

    h("label", { className: "sr-only", htmlFor: "calendario-mes" }, "Mês"),
    h(
      "select",
      {
        id: "calendario-mes",
        className: "input select",
        value: month,
        onChange: (event) => {
          setMonth(Number(event.target.value));
          setSelected(null);
        },
      },
      MONTH_NAMES.map((name, index) => h("option", { key: name, value: index + 1 }, name)),
    ),

    h("label", { className: "sr-only", htmlFor: "calendario-ano" }, "Ano"),
    h("input", {
      id: "calendario-ano",
      className: "input input--year",
      type: "number",
      inputMode: "numeric",
      min: MIN_YEAR,
      max: MAX_YEAR,
      value: yearDraft ?? String(year),
      onChange: (event) => setYearDraft(event.target.value),
      onBlur: commitYear,
      onKeyDown: (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commitYear();
        }
      },
    }),

    h("button", { type: "button", className: "btn", onClick: goToToday }, "Hoje"),
  );

  return h(
    Fragment,
    null,

    h(
      "div",
      { className: "kpis" },
      h(KpiCard, {
        label: "Feriados no ano",
        value: formatNumber(holidayCount),
        detail: `Nacionais, estaduais e municipais em ${year}`,
      }),
      h(KpiCard, {
        label: "Pontos facultativos",
        value: formatNumber(optionalCount),
        detail: `Dispensa opcional em ${year}`,
      }),
      h(KpiCard, {
        label: "Dias úteis no mês",
        value: formatNumber(businessDays),
        detail: `${MONTH_NAMES[month - 1]}, sem fins de semana e feriados`,
      }),
      h(KpiCard, {
        label: "Próximo feriado",
        value: upcoming ? formatIsoDate(upcoming.date) : undefined,
        detail: upcoming?.name,
      }),
    ),

    h(
      "div",
      { className: "grid" },

      h(
        Panel,
        { title: monthTitle, note: "Santos — SP", span: 8, actions: navigation },

        h(
          "table",
          { className: "calendar" },
          h("caption", { className: "sr-only" }, `Calendário de ${monthLabel}`),
          h(
            "thead",
            null,
            h(
              "tr",
              null,
              WEEKDAYS.map((weekday) =>
                h(
                  "th",
                  { key: weekday.short, scope: "col" },
                  h("abbr", { title: weekday.long }, weekday.short),
                ),
              ),
            ),
          ),
          h(
            "tbody",
            null,
            weeks.map((week) =>
              h(
                "tr",
                { key: week[0].iso },
                week.map((day) => {
                  const holiday = day.holidays[0];

                  const classes = ["day"];
                  if (!day.inMonth) classes.push("is-outside");
                  if (day.isWeekend) classes.push("is-weekend");
                  if (day.isToday) classes.push("is-today");
                  if (day.holidays.some((item) => item.kind === "feriado")) {
                    classes.push("is-holiday");
                  } else if (day.holidays.length > 0) {
                    classes.push("is-optional");
                  }
                  if (day.iso === selected) classes.push("is-selected");

                  if (!day.inMonth) {
                    return h(
                      "td",
                      { key: day.iso },
                      h("span", { className: classes.join(" "), "aria-hidden": "true" }, day.day),
                    );
                  }

                  const label = holiday
                    ? `${formatIsoDateLong(day.iso)} — ${holiday.name} (${KIND_LABEL[
                        holiday.kind
                      ].toLowerCase()} ${SCOPE_LABEL[holiday.scope].toLowerCase()})`
                    : formatIsoDateLong(day.iso);

                  return h(
                    "td",
                    { key: day.iso },
                    h(
                      "button",
                      {
                        type: "button",
                        className: classes.join(" "),
                        "aria-pressed": day.iso === selected,
                        "aria-label": label,
                        title: holiday ? holiday.name : undefined,
                        onClick: () =>
                          setSelected((current) => (current === day.iso ? null : day.iso)),
                      },
                      h("span", { className: "day-number" }, day.day),
                      day.holidays.length > 0 &&
                        h("span", { className: "day-mark", "aria-hidden": "true" }),
                    ),
                  );
                }),
              ),
            ),
          ),
        ),

        h(
          "ul",
          { className: "calendar-legend" },
          CALENDAR_LEGEND.map((item) =>
            h(
              "li",
              { key: item.className },
              h("span", {
                className: `legend-swatch ${item.className}`,
                "aria-hidden": "true",
              }),
              item.label,
            ),
          ),
        ),
      ),

      h(
        Panel,
        { title: "No mês", note: monthTitle, span: 4 },

        selectedDay &&
          h(
            "div",
            { className: "day-detail" },
            h("p", { className: "day-detail-date" }, formatIsoDateLong(selectedDay.iso)),
            selectedDay.holidays.length > 0
              ? h(
                  "ul",
                  { className: "holiday-list" },
                  selectedDay.holidays.map((holiday) =>
                    h(HolidayItem, { key: holiday.name, holiday, withDate: false }),
                  ),
                )
              : h(
                  "p",
                  { className: "muted" },
                  selectedDay.isWeekend ? "Fim de semana." : "Dia útil, sem data marcada.",
                ),
          ),

        h("h3", { className: "panel-subtitle" }, "Datas do mês"),

        monthHolidays.length > 0
          ? h(
              "ul",
              { className: "holiday-list" },
              monthHolidays.map((holiday) =>
                h(HolidayItem, {
                  key: `${holiday.date}-${holiday.name}`,
                  holiday,
                  withDate: true,
                }),
              ),
            )
          : h("p", { className: "empty" }, "Nenhum feriado ou ponto facultativo neste mês."),
      ),

      h(
        Panel,
        {
          title: `Todas as datas de ${year}`,
          note:
            "Feriados nacionais e estaduais, feriados municipais de Santos e pontos facultativos",
          span: 12,
        },
        h(DataTable, {
          columns: HOLIDAY_COLUMNS,
          rows: yearHolidays,
          getKey: (row) => `${row.date}-${row.name}`,
          emptyMessage: `Sem datas calculadas para ${year}. O calendário vai de ${MIN_YEAR} a ${MAX_YEAR}.`,
        }),
        h(
          "p",
          { className: "panel-foot" },
          "As datas municipais e os pontos facultativos de Santos saem de decreto anual da " +
            "Prefeitura, que pode somar datas ou mudar horário de expediente. Confira o decreto " +
            "do ano antes de fechar uma escala — veja ",
          h("code", null, "js/holidays.js"),
          ".",
        ),
      ),
    ),
  );
}
