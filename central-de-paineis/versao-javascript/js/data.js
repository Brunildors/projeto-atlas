import { safeDivide } from "./math.js";

export const MONTHS = [];

export const revenue = [];

export const expenses = [];

export const profit = revenue.map((value, index) => value - expenses[index]);

export const cash = [];

export const expensesByCategory = [];

export const transactions = [];

export const STATUS_FILTERS = ["Todas", "Pendente", "Atrasado", "Pago"];

export const STATUS_TONE = {
  Pago: "positive",
  Pendente: "warning",
  Atrasado: "negative",
};

export const EMPTY_LATENCY_WINDOW = { p50: [], p95: [], labels: [] };

export const SERVERS = [];

export const REQUESTS_BY_SERVICE = [];

export const SERVER_TONE = {
  Operando: "positive",
  Instável: "warning",
  "Fora do ar": "negative",
};

export async function fetchInfraSnapshot() {
  return null;
}

export const LAST_30_DAYS = [];

export const sessions = [];

export const FUNNEL_STAGES = [];

export const SALES_BY_CHANNEL = [];

export const CAMPAIGNS = [];

export const roas = (campaign) => safeDivide(campaign.revenue, campaign.spend);
