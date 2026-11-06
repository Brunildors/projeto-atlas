import type { Slice, Tone, Transaction, TransactionFilter, TransactionStatus } from "../types";

export const MONTHS: string[] = [];

export const revenue: number[] = [];

export const expenses: number[] = [];

export const profit: number[] = revenue.map((value, index) => value - expenses[index]);

export const cash: number[] = [];

export const expensesByCategory: Slice[] = [];

export const transactions: Transaction[] = [];

export const STATUS_FILTERS: TransactionFilter[] = ["Todas", "Pendente", "Atrasado", "Pago"];

export const STATUS_TONE: Record<TransactionStatus, Tone> = {
  Pago: "positive",
  Pendente: "warning",
  Atrasado: "negative",
};
