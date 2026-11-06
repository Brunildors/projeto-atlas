import { formatCompact, formatNumber, formatPercent, NO_DATA } from "./format.js";
import { safeDivide } from "./math.js";
import { h, useEffect, useState } from "./react.js";
import { applyTheme, readStoredMode, storeMode, watchSystemTheme } from "./theme.js";

export function EmptyState({ message = "Sem dados para mostrar", hint, minHeight = 180 }) {
  return h(
    "div",
    { className: "empty-state", style: { minHeight } },
    h("span", { className: "empty-state-mark", "aria-hidden": "true" }),
    h("p", { className: "empty-state-text" }, message),
    hint && h("p", { className: "empty-state-hint" }, hint),
  );
}

const LOGO_URL = new URL("../../src/assets/iport-logo.png", import.meta.url).href;

export function Brand({ variant, compact = false }) {
  const classes = ["brand", `brand--${variant}`];
  if (compact) classes.push("is-compact");

  return h(
    "div",
    { className: classes.join(" ") },
    h(
      "span",
      { className: "brand-clip" },
      h("img", { className: "brand-image", src: LOGO_URL, alt: "iPORT Solutions" }),
    ),
  );
}

const THEME_OPTIONS = [
  { mode: "light", icon: "☀", label: "Claro" },
  { mode: "dark", icon: "☾", label: "Escuro" },
  { mode: "system", icon: "◑", label: "Sistema" },
];

export function ThemeToggle() {
  const [mode, setMode] = useState(readStoredMode);

  useEffect(() => {
    applyTheme(mode);
    storeMode(mode);

    if (mode !== "system") return;

    return watchSystemTheme(() => applyTheme("system"));
  }, [mode]);

  return h(
    "div",
    { className: "theme-toggle segmented", role: "group", "aria-label": "Tema da interface" },
    THEME_OPTIONS.map((option) =>
      h(
        "button",
        {
          key: option.mode,
          type: "button",
          "aria-pressed": mode === option.mode,
          "aria-label": `Tema ${option.label.toLowerCase()}`,
          title: `Tema ${option.label.toLowerCase()}`,
          onClick: () => setMode(option.mode),
        },
        h("span", { className: "theme-icon", "aria-hidden": "true" }, option.icon),
        h("span", { className: "theme-text" }, option.label),
      ),
    ),
  );
}

export function Sparkline({ values, color = "currentColor" }) {
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

  return h(
    "svg",
    {
      className: "sparkline",
      viewBox: "0 0 100 28",
      preserveAspectRatio: "none",
      "aria-hidden": "true",
    },
    h("polyline", {
      points,
      fill: "none",
      style: { stroke: color },
      strokeWidth: 2,
      vectorEffect: "non-scaling-stroke",
    }),
  );
}

export function KpiCard({
  label,
  value,
  delta,
  goodWhen = "up",
  comparison = "vs. período anterior",
  spark,
  detail,
}) {
  const hasValue = typeof value === "string" && value.length > 0;
  const hasDelta = typeof delta === "number";
  const isGood = hasDelta && (goodWhen === "up" ? delta >= 0 : delta <= 0);

  return h(
    "div",
    { className: "kpi" },
    h("div", { className: "kpi-label" }, label),
    h("div", { className: `kpi-value ${hasValue ? "" : "is-empty"}` }, hasValue ? value : NO_DATA),
    hasDelta &&
      h(
        "div",
        { className: `kpi-delta ${isGood ? "is-good" : "is-bad"}` },
        delta >= 0 ? "▲" : "▼",
        " ",
        formatNumber(Math.abs(delta), 1),
        "% ",
        h("span", null, comparison),
      ),
    detail && h("div", { className: "kpi-detail" }, detail),
    spark &&
      spark.length > 1 &&
      h(Sparkline, {
        values: spark,
        color: isGood || !hasDelta ? "var(--positive)" : "var(--negative)",
      }),
  );
}

export function Panel({ title, note, actions, span = 6, children }) {
  return h(
    "section",
    { className: `panel span-${span}` },
    h(
      "header",
      { className: "panel-head" },
      h(
        "div",
        null,
        h("h2", null, title),
        note && h("p", { className: "panel-note" }, note),
      ),
      actions && h("div", { className: "panel-actions" }, actions),
    ),
    children,
  );
}

export function Badge({ tone, children }) {
  return h("span", { className: `badge badge--${tone}` }, children);
}

export function Meter({ value, label, warnAt = 70, dangerAt = 85 }) {
  const tone = value >= dangerAt ? "negative" : value >= warnAt ? "warning" : "positive";

  return h(
    "div",
    {
      className: "meter",
      role: "meter",
      "aria-label": label,
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-valuenow": Math.round(value),
    },
    h(
      "div",
      { className: "meter-track" },
      h("div", {
        className: `meter-fill meter-fill--${tone}`,
        style: { width: `${value}%` },
      }),
    ),
    h("span", { className: "meter-value" }, `${formatNumber(value)}%`),
  );
}

const MIN_WIDTH = 4;

export function Funnel({ stages }) {
  if (stages.length === 0) {
    return h(EmptyState, {
      message: "Funil sem etapas",
      hint: "Preencha FUNNEL_STAGES em data.js.",
    });
  }

  const top = stages[0].value;

  return h(
    "ol",
    { className: "funnel" },
    stages.map((stage, index) => {
      const previous = index > 0 ? stages[index - 1].value : null;

      const share = safeDivide(stage.value, top);
      const passRate = safeDivide(stage.value, previous);

      return h(
        "li",
        { key: stage.label },
        h(
          "div",
          { className: "funnel-row" },
          h("span", null, stage.label),
          h("strong", null, formatCompact(stage.value)),
        ),
        h("div", {
          className: "funnel-bar",
          style: { width: `${Math.max(MIN_WIDTH, (share ?? 0) * 100)}%` },
        }),
        index > 0 &&
          h(
            "div",
            { className: "funnel-rate" },
            `${passRate === null ? NO_DATA : formatPercent(passRate * 100)} da etapa anterior`,
          ),
      );
    }),
  );
}
