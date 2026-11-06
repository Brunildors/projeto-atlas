export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export const latest = (values) => (values.length > 0 ? values[values.length - 1] : null);

export function latestChange(values) {
  if (values.length < 2) return null;

  const previous = values[values.length - 2];
  if (previous === 0) return null;

  return ((values[values.length - 1] - previous) / previous) * 100;
}

export const safeDivide = (dividend, divisor) =>
  dividend === null || divisor === null || divisor === 0 ? null : dividend / divisor;

export const sum = (values) => values.reduce((total, value) => total + value, 0);

export const sumBy = (rows, pick) => rows.reduce((total, row) => total + pick(row), 0);
