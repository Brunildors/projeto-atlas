import { EmptyState } from "./components.js";
import { formatPercent } from "./format.js";
import { clamp } from "./math.js";
import { h, useMemo, useRef, useState } from "./react.js";

const VIEW_WIDTH = 720;

const LINE_MARGIN = { top: 14, right: 12, bottom: 28, left: 80 };

export function LineChart({
  labels,
  series,
  height = 260,
  format = String,
  area = false,
  ariaLabel,
  emptyMessage = "Sem dados no período",
  emptyHint,
}) {
  const svgRef = useRef(null);

  const [hovered, setHovered] = useState(null);

  const pointCount = labels.length;

  const maxY = useMemo(() => {
    const values = series.flatMap((s) => s.values);

    if (values.length === 0) return 1;

    const peak = Math.max(...values) * 1.08 || 1;
    const step = 10 ** Math.floor(Math.log10(peak)) / 2;
    return Math.ceil(peak / step) * step;
  }, [series]);

  const hasData = pointCount > 0 && series.some((s) => s.values.length > 0);

  if (!hasData) {
    return h(EmptyState, { message: emptyMessage, hint: emptyHint, minHeight: height });
  }

  const plotWidth = VIEW_WIDTH - LINE_MARGIN.left - LINE_MARGIN.right;
  const plotHeight = height - LINE_MARGIN.top - LINE_MARGIN.bottom;

  const toX = (index) =>
    LINE_MARGIN.left + (pointCount <= 1 ? 0 : (index * plotWidth) / (pointCount - 1));

  const toY = (value) => LINE_MARGIN.top + plotHeight - (value / maxY) * plotHeight;

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ratio * maxY);

  const labelStep = Math.max(1, Math.ceil(pointCount / 8));

  function handlePointerMove(event) {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;

    const x = ((event.clientX - box.left) / box.width) * VIEW_WIDTH;
    const index = Math.round(((x - LINE_MARGIN.left) / plotWidth) * (pointCount - 1));
    setHovered(clamp(index, 0, pointCount - 1));
  }

  const toPath = (values) =>
    values
      .map((value, index) => `${index ? "L" : "M"}${toX(index).toFixed(1)},${toY(value).toFixed(1)}`)
      .join("");

  const firstSeries = series[0];
  const tipLeft = hovered === null ? 0 : (toX(hovered) / VIEW_WIDTH) * 100;

  return h(
    "div",
    { className: "chart" },
    h(
      "svg",
      {
        ref: svgRef,
        viewBox: `0 0 ${VIEW_WIDTH} ${height}`,
        role: "img",
        "aria-label": ariaLabel,
        onPointerMove: handlePointerMove,
        onPointerLeave: () => setHovered(null),
      },

      gridValues.map((value) =>
        h(
          "g",
          { key: value },
          h("line", {
            className: "grid",
            x1: LINE_MARGIN.left,
            x2: VIEW_WIDTH - LINE_MARGIN.right,
            y1: toY(value),
            y2: toY(value),
          }),
          h(
            "text",
            { className: "axis", x: LINE_MARGIN.left - 10, y: toY(value) + 4, textAnchor: "end" },
            format(value),
          ),
        ),
      ),

      labels.map((label, index) =>
        (pointCount - 1 - index) % labelStep === 0
          ? h(
              "text",
              {
                key: label + index,
                className: "axis",
                x: toX(index),
                y: height - 8,
                textAnchor: "middle",
              },
              label,
            )
          : null,
      ),

      area &&
        firstSeries &&
        h("path", {
          d: `${toPath(firstSeries.values)}L${toX(pointCount - 1)},${toY(0)}L${toX(0)},${toY(0)}Z`,
          style: { fill: firstSeries.color, fillOpacity: 0.12 },
        }),

      series.map((s) =>
        h("path", {
          key: s.name,
          d: toPath(s.values),
          fill: "none",
          style: { stroke: s.color },
          strokeWidth: 2.5,
          strokeLinejoin: "round",
        }),
      ),

      hovered !== null &&
        h(
          "g",
          null,
          h("line", {
            className: "cursor",
            x1: toX(hovered),
            x2: toX(hovered),
            y1: LINE_MARGIN.top,
            y2: LINE_MARGIN.top + plotHeight,
          }),
          series.map((s) =>
            h("circle", {
              key: s.name,
              cx: toX(hovered),
              cy: toY(s.values[hovered]),
              r: 4.5,
              style: { fill: s.color },
              className: "cursor-dot",
            }),
          ),
        ),
    ),

    hovered !== null &&
      h(
        "div",
        {
          className: "chart-tip",
          style: {
            left: `${tipLeft}%`,
            transform: `translateX(${tipLeft > 65 ? "-105%" : "5%"})`,
          },
        },
        h("strong", null, labels[hovered]),
        series.map((s) =>
          h(
            "span",
            { key: s.name },
            h("i", { style: { background: s.color } }),
            ` ${s.name}: ${format(s.values[hovered])}`,
          ),
        ),
      ),

    series.length > 1 &&
      h(
        "ul",
        { className: "legend" },
        series.map((s) =>
          h("li", { key: s.name }, h("i", { style: { background: s.color } }), s.name),
        ),
      ),
  );
}

const BAR_MARGIN = { top: 22, right: 8, bottom: 30, left: 8 };

export function BarChart({
  data,
  height = 240,
  width = 720,
  color = "var(--accent)",
  format = String,
  ariaLabel,
  emptyMessage = "Sem dados para comparar",
  emptyHint,
}) {
  const [hovered, setHovered] = useState(null);

  if (data.length === 0) {
    return h(EmptyState, { message: emptyMessage, hint: emptyHint, minHeight: height });
  }

  const plotWidth = width - BAR_MARGIN.left - BAR_MARGIN.right;
  const plotHeight = height - BAR_MARGIN.top - BAR_MARGIN.bottom;

  const maxValue = Math.max(...data.map((item) => item.value)) || 1;

  const slot = plotWidth / data.length;

  return h(
    "div",
    { className: "chart" },
    h(
      "svg",
      { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": ariaLabel },

      h("line", {
        className: "grid",
        x1: BAR_MARGIN.left,
        x2: width - BAR_MARGIN.right,
        y1: BAR_MARGIN.top + plotHeight,
        y2: BAR_MARGIN.top + plotHeight,
      }),

      data.map((item, index) => {
        const barHeight = (item.value / maxValue) * plotHeight;
        const x = BAR_MARGIN.left + index * slot + slot * 0.18;
        const dimmed = hovered !== null && hovered !== index;

        return h(
          "g",
          {
            key: item.label,
            onPointerEnter: () => setHovered(index),
            onPointerLeave: () => setHovered(null),
            opacity: dimmed ? 0.4 : 1,
            style: { transition: "opacity .15s" },
          },
          h("rect", {
            x,
            y: BAR_MARGIN.top + plotHeight - barHeight,
            width: slot * 0.64,
            height: barHeight,
            rx: 5,
            style: { fill: item.color ?? color },
          }),
          h(
            "text",
            {
              className: "bar-value",
              x: x + slot * 0.32,
              y: BAR_MARGIN.top + plotHeight - barHeight - 6,
              textAnchor: "middle",
            },
            format(item.value),
          ),
          h(
            "text",
            { className: "axis", x: x + slot * 0.32, y: height - 10, textAnchor: "middle" },
            item.label,
          ),
        );
      }),
    ),
  );
}

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DONUT_EMPTY_HEIGHT = 300;

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  format = String,
  emptyMessage = "Sem composição para mostrar",
  emptyHint,
}) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  if (total <= 0) {
    return h(EmptyState, {
      message: emptyMessage,
      hint: emptyHint,
      minHeight: DONUT_EMPTY_HEIGHT,
    });
  }

  let offset = 0;

  return h(
    "div",
    { className: "donut" },
    h(
      "svg",
      { viewBox: "0 0 200 200", role: "img", "aria-label": `${centerLabel}: ${centerValue}` },

      h(
        "g",
        { transform: "rotate(-90 100 100)" },
        data.map((item) => {
          const arc = (item.value / total) * CIRCUMFERENCE;

          const circle = h("circle", {
            key: item.label,
            cx: 100,
            cy: 100,
            r: RADIUS,
            fill: "none",
            style: { stroke: item.color },
            strokeWidth: 26,
            strokeDasharray: `${Math.max(0, arc - 2)} ${CIRCUMFERENCE}`,
            strokeDashoffset: -offset,
          });

          offset += arc;
          return circle;
        }),
      ),

      h("text", { x: 100, y: 98, textAnchor: "middle", className: "donut-value" }, centerValue),
      h("text", { x: 100, y: 120, textAnchor: "middle", className: "donut-label" }, centerLabel),
    ),

    h(
      "ul",
      { className: "donut-legend" },
      data.map((item) =>
        h(
          "li",
          { key: item.label },
          h("i", { style: { background: item.color } }),
          h("span", null, item.label),
          h("span", { className: "muted" }, formatPercent((item.value / total) * 100, 0)),
          h("span", { className: "strong" }, format(item.value)),
        ),
      ),
    ),
  );
}
