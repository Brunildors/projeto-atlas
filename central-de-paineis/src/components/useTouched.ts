import { useState } from "react";

export function useTouched<F extends string>() {
  const [touched, setTouched] = useState<Partial<Record<F, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  return {
    touch: (field: F) => setTouched((current) => ({ ...current, [field]: true })),
    submit: () => setSubmitted(true),
    reset: () => {
      setTouched({});
      setSubmitted(false);
    },
    shown: (field: F, error: string | null): string | null =>
      submitted || touched[field] ? error : null,
  };
}
