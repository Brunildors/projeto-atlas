export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const latest = (values: number[]): number | null =>
  values.length > 0 ? values[values.length - 1] : null;

export function latestChange(values: number[]): number | null {
  if (values.length < 2) return null;

  const previous = values[values.length - 2];
  if (previous === 0) return null;

  return ((values[values.length - 1] - previous) / previous) * 100;
}

export const safeDivide = (dividend: number | null, divisor: number | null): number | null =>
  dividend === null || divisor === null || divisor === 0 ? null : dividend / divisor;

export const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

export const sumBy = <T,>(rows: T[], pick: (row: T) => number): number =>
  rows.reduce((total, row) => total + pick(row), 0);
