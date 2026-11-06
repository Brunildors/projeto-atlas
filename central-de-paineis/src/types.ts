import type { ComponentType, ReactNode } from "react";

export interface Series {
  name: string;
  color: string;
  values: number[];
}

export interface Slice {
  label: string;
  value: number;
  color?: string;
}

export type Tone = "positive" | "warning" | "negative" | "neutral";

export type GoodWhen = "up" | "down";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
}

export interface SortState {
  key: string;
  dir: "asc" | "desc";
}

export type TransactionStatus = "Pago" | "Pendente" | "Atrasado";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  status: TransactionStatus;
}

export type TransactionFilter = TransactionStatus | "Todas";

export type ServerStatus = "Operando" | "Instável" | "Fora do ar";

export interface Server {
  id: string;
  name: string;
  region: string;
  status: ServerStatus;
  cpu: number;
  memory: number;
  latency: number;
}

export interface LatencyWindow {
  p50: number[];
  p95: number[];
  labels: string[];
}

export interface InfraSnapshot {
  latency: LatencyWindow;
  servers: Server[];
  requestsPerSecond: number | null;
  availability: number | null;
}

export interface Campaign {
  id: string;
  name: string;
  channel: string;
  spend: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface FunnelStage {
  label: string;
  value: number;
}

export type HolidayKind = "feriado" | "facultativo";

export type HolidayScope = "nacional" | "estadual" | "municipal";

export interface Holiday {
  date: string;
  name: string;
  kind: HolidayKind;
  scope: HolidayScope;
  note?: string;
}

export interface RuleYears {
  since?: number;
  until?: number;
  except?: number[];
  every?: number;
}

export type HolidayMove = "observado" | "segunda" | "segunda-proxima" | "domingo-sabado" | "substituto";

interface DateRuleBase extends RuleYears {
  name: string;
  kind: HolidayKind;
  note?: string;
}

export interface FixedDateRule extends DateRuleBase {
  month: number;
  day: number;
  move?: HolidayMove;
}

export interface EasterDateRule extends DateRuleBase {
  offset: number;
}

export interface WeekdayDateRule extends DateRuleBase {
  month: number;
  weekday: number;
  nth: number;
}

export interface LocalDateRules {
  fixed?: FixedDateRule[];
  easter?: EasterDateRule[];
  weekday?: WeekdayDateRule[];
}

export interface Country {
  code: string;
  name: string;
  regionLabel: string;
  rules: LocalDateRules;
}

export interface Region {
  label: string;
  rules: LocalDateRules;
}

export interface City {
  id: string;
  name: string;
  country: string;
  state: string;
  rules: LocalDateRules;
}

export interface CalendarDay {
  iso: string;
  day: number;
  inMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
  holidays: Holiday[];
}

export type CalendarView =
  | "periodo"
  | "dia"
  | "semana"
  | "mes"
  | "bimestre"
  | "trimestre"
  | "semestre"
  | "ano"
  | "personalizado";

export type DayPeriod = "manha" | "tarde" | "noite";

export interface DateRange {
  start: string;
  end: string;
}

export interface AbsenceEntry {
  id: string;
  name: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  from: string;
  to: string;
  status: RequestStatus;
}

export type Theme = "light" | "dark";

export type DocType = "cpf" | "cnpj";

export interface DocumentDraft {
  docType: DocType;
  value: string;
}

export interface Session {
  docType: DocType;
  document: string;
  since: string;
  token: string;
  fullName?: string;
  socialName?: string;
}

export type LoginField = "document" | "password";

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

export interface Employee {
  docType: DocType;
  document: string;
  fullName: string;
  socialName: string;
  birthDate: string;
  phone: string;
  address: Address;
  registeredAt: string;
}

export type SignupField =
  | "document"
  | "fullName"
  | "socialName"
  | "birthDate"
  | "phone"
  | keyof Address
  | "password";

export type ProjectStatus = "pendente" | "andamento" | "concluida";

export type ProjectPriority = "baixa" | "media" | "alta";

export interface Project {
  id: string;
  document: string;
  title: string;
  description: string;
  dueDate: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  order?: number;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  document: string;
  projectId: string;
  name: string;
  description: string;
  fileName: string;
  type: string;
  size: number;
  createdAt: string;
}

export type AbsenceType = "falta" | "atraso";

export type AbsenceReason = "saude" | "familia" | "transporte" | "pessoal" | "outro";

export type RequestStatus = "analise" | "aprovada" | "recusada" | "cancelada";

export interface AbsenceNotice {
  id: string;
  document: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  startTime: string;
  expectedTime: string;
  reason: AbsenceReason;
  details: string;
  status: RequestStatus;
  createdAt: string;
}

export type NoticeDraft = Pick<
  AbsenceNotice,
  "type" | "startDate" | "endDate" | "startTime" | "expectedTime" | "reason" | "details"
>;

export type ChatRole = "user" | "assistant";

export interface NoticeRequest {
  text: string;
  state: "asking" | "pending" | "sent" | "dropped";
  draft?: NoticeDraft;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
  request?: NoticeRequest;
}

export interface AssistantReply {
  text: string;
  request?: NoticeRequest;
}

export interface Conversation {
  id: string;
  document: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type IconName =
  | "home"
  | "finance"
  | "infra"
  | "marketing"
  | "calendar"
  | "projects"
  | "assistant"
  | "profile"
  | "chat"
  | "send"
  | "plus"
  | "chevron"
  | "check"
  | "trash"
  | "close"
  | "folder"
  | "grip"
  | "file"
  | "paperclip"
  | "upload"
  | "download"
  | "back"
  | "history"
  | "heatmap"
  | "timeline"
  | "forecast"
  | "alert"
  | "globe"
  | "phone";

export interface Dashboard {
  id: string;
  name: string;
  title: string;
  description: string;
  hideDescription?: boolean;
  hideFromMenu?: boolean;
  icon: IconName;
  Component: ComponentType<DashboardPageProps>;
}

export interface DashboardPageProps {
  dashboards: Dashboard[];
  activeId: string;
  session: Session;
}
