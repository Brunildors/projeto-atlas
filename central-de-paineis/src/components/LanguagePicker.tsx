import { useId } from "react";
import { LANGUAGES, setLang, t, useLang, type Lang } from "../i18n";
import { Icon } from "./Icon";

export function LanguagePicker({ variant }: { variant: "sidebar" | "login" }) {
  const lang = useLang();
  const id = useId();

  return (
    <div className={`lang-picker lang-picker--${variant}`}>
      <label htmlFor={id} className="lang-picker-icon" title={t("app.language")}>
        <Icon name="globe" size={16} />
        <span className="sr-only">{t("app.language.choose")}</span>
      </label>
      <select id={id} className="lang-picker-select" value={lang} onChange={(event) => setLang(event.target.value as Lang)}>
        {LANGUAGES.map((language) => (
          <option key={language.id} value={language.id} lang={language.id}>
            {language.label}
          </option>
        ))}
      </select>
    </div>
  );
}
