import { useEffect, useState } from "react";
import { applyTheme, readStoredTheme, storeTheme } from "../lib/theme";
import type { Theme } from "../types";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const dark = theme === "dark";

  useEffect(() => applyTheme(theme), [theme]);

  function toggle() {
    const next: Theme = dark ? "light" : "dark";
    storeTheme(next);
    setTheme(next);
  }

  const hint = dark ? "Mudar para o tema claro" : "Mudar para o tema escuro";

  return (
    <button
      type="button"
      role="switch"
      className="theme-switch"
      aria-checked={dark}
      aria-label="Tema escuro"
      title={hint}
      onClick={toggle}
    >
      <span className="theme-switch-thumb" aria-hidden="true">
        {dark ? "☾" : "☀"}
      </span>
    </button>
  );
}
