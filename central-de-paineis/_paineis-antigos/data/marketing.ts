import { safeDivide } from "../lib/math";
import type { Campaign, FunnelStage, Slice } from "../types";

export const LAST_30_DAYS: string[] = [];

export const sessions: number[] = [];

export const FUNNEL_STAGES: FunnelStage[] = [];

export const SALES_BY_CHANNEL: Slice[] = [];

export const CAMPAIGNS: Campaign[] = [];

export const roas = (campaign: Campaign): number | null =>
  safeDivide(campaign.revenue, campaign.spend);
