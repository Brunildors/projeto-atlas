import type { ReactNode } from "react";
import type { Tone } from "../types";

interface BadgeProps {
  tone: Tone;
  children: ReactNode;
}

export function Badge({ tone, children }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
