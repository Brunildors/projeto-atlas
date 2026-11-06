import { t } from "../i18n";
import { DOC_LABEL, DOC_MASKED_LENGTH, DOC_PLACEHOLDER, formatDocument } from "../lib/validation";
import type { DocType } from "../types";
import type { FieldControlProps } from "./FormField";

const DOC_TYPES: DocType[] = ["cpf", "cnpj"];

const docAudience = (type: DocType): string => t(type === "cpf" ? "auth.doc.individual" : "auth.doc.company");

export function DocTypeSwitch({
  id,
  value,
  onChange,
}: {
  id: string;
  value: DocType;
  onChange: (type: DocType) => void;
}) {
  // pílula discreta só com as siglas; "pessoa física/jurídica" aparece no hover e no leitor de tela
  return (
    <div className="doc-switch" role="group" aria-labelledby={id}>
      <span className="sr-only" id={id}>
        {t("auth.doc.type")}
      </span>
      {DOC_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          className="doc-switch-option"
          aria-pressed={value === type}
          title={docAudience(type)}
          onClick={() => {
            if (type !== value) onChange(type);
          }}
        >
          {DOC_LABEL[type]}
          <span className="sr-only"> ({docAudience(type)})</span>
        </button>
      ))}
    </div>
  );
}

export function DocumentInput({
  control,
  type,
  value,
  onChange,
  onBlur,
}: {
  control: FieldControlProps;
  type: DocType;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <input
      {...control}
      className="input"
      type="text"
      inputMode={type === "cpf" ? "numeric" : "text"}
      autoCapitalize={type === "cpf" ? "off" : "characters"}
      autoComplete="username"
      spellCheck={false}
      placeholder={DOC_PLACEHOLDER[type]}
      maxLength={DOC_MASKED_LENGTH[type]}
      value={value}
      onChange={(event) => onChange(formatDocument(type, event.target.value))}
      onBlur={onBlur}
    />
  );
}
