import type { InfraSnapshot, LatencyWindow, Server, ServerStatus, Slice, Tone } from "../types";

export const EMPTY_LATENCY_WINDOW: LatencyWindow = { p50: [], p95: [], labels: [] };

export const SERVERS: Server[] = [];

export const REQUESTS_BY_SERVICE: Slice[] = [];

export const SERVER_TONE: Record<ServerStatus, Tone> = {
  Operando: "positive",
  Instável: "warning",
  "Fora do ar": "negative",
};

export async function fetchInfraSnapshot(): Promise<InfraSnapshot | null> {
  return null;
}
