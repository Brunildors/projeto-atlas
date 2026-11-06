interface SparklineProps {
  values: number[];
  color?: string;
}

export function Sparkline({ values, color = "currentColor" }: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;

  const points = values
    .map((value, index) => {
      const x = ((index / (values.length - 1)) * 100).toFixed(2);
      const y = (26 - ((value - min) / range) * 22).toFixed(2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="sparkline"
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        style={{ stroke: color }}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
