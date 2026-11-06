import type { ReactNode } from "react";
import { t } from "../i18n";

export interface FieldControlProps {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

interface FormFieldProps {
  id: string;
  label: string;
  flag?: "required" | "optional";
  hint?: string;
  error?: string | null;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

export function FormField({ id, label, flag, hint, error, className, children }: FormFieldProps) {
  const hintId = hint ? `${id}-dica` : undefined;
  const errorId = error ? `${id}-erro` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className ? `field ${className}` : "field"}>
      <label htmlFor={id}>
        {label}
        {flag && (
          <span className="field-flag">{t(flag === "required" ? "auth.signup.required" : "auth.signup.optional")}</span>
        )}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}

      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}
