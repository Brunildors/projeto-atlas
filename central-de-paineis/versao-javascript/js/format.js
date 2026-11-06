const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatCurrency = (value) => currencyFormatter.format(value);

export const formatCurrencyCompact = (value) => `R$ ${compactFormatter.format(value)}`;

export const formatCompact = (value) => compactFormatter.format(value);

export function formatNumber(value, decimals = 0) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export const formatPercent = (value, decimals = 1) => `${formatNumber(value, decimals)}%`;

export function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatIsoDate(iso) {
  return new Date(`${iso}T12:00`).toLocaleDateString("pt-BR");
}

export function formatIsoDateLong(iso) {
  return new Date(`${iso}T12:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatIsoDateTime(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatToday(date = new Date()) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export const NO_DATA = "—";

export const formatMaybe = (value, format) =>
  value === null || value === undefined ? undefined : format(value);
