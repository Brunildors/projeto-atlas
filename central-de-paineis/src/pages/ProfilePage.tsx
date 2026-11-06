import { type ReactNode, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Panel } from "../components/Panel";
import { t, tn } from "../i18n";
import { todayIso } from "../lib/calendar";
import { displayName, findEmployee } from "../lib/employees";
import { formatIsoDate, formatIsoDateTime, NO_DATA } from "../lib/format";
import { stateName } from "../lib/states";
import { ageOn, DOC_LABEL, formatCep, formatDocument, formatPhone } from "../lib/validation";
import type { Address, DashboardPageProps, Employee } from "../types";

function initialsOf(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";

  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

  return (first + last).toUpperCase();
}

function DataRow({ label, children }: { label: string; children?: ReactNode }) {
  const filled = children !== undefined && children !== null && children !== "";

  return (
    <div className="data-row">
      <dt>{label}</dt>
      <dd className={filled ? undefined : "muted"}>{filled ? children : NO_DATA}</dd>
    </div>
  );
}

function streetLine(address: Address): string {
  return [address.street, address.number, address.complement].filter(Boolean).join(", ");
}

function cityLine(address: Address): string {
  if (!address.city) return "";
  return address.state ? `${address.city} — ${stateName(address.state)} (${address.state})` : address.city;
}

function birthLine(employee: Employee, today: string): string {
  if (!employee.birthDate) return "";
  return `${formatIsoDate(employee.birthDate)} (${tn("prof.age", ageOn(employee.birthDate, today))})`;
}

export function ProfilePage({ session }: DashboardPageProps) {
  const [today] = useState(todayIso);
  const employee = findEmployee(session.document);

  const docLabel = DOC_LABEL[session.docType];
  const docText = formatDocument(session.docType, session.document);

  if (!employee) {
    return (
      <div className="grid">
        <Panel title={t("prof.registry")} span={12}>
          <EmptyState
            message={t("prof.noRecord", { doc: docLabel })}
            hint={t("prof.noRecordHint")}
            minHeight={200}
          />
        </Panel>
      </div>
    );
  }

  const name = displayName(employee);

  return (
    <div className="grid">
      <section className="panel span-4 profile-card" aria-labelledby="perfil-nome">
        <div className="profile-head">
          <span className="profile-avatar" aria-hidden="true">
            {initialsOf(name)}
          </span>
          <div className="profile-id">
            <h2 className="profile-name" id="perfil-nome">
              {name}
            </h2>
            <p className="profile-sub">
              {employee.socialName.length > 0 ? employee.fullName : `${docLabel} ${docText}`}
            </p>
          </div>
        </div>
        <h3 className="panel-subtitle">{t("prof.access")}</h3>
        <dl className="data-list">
          <DataRow label={t("prof.registeredAt")}>{formatIsoDateTime(employee.registeredAt)}</DataRow>
          <DataRow label={t("prof.signedInAt")}>{formatIsoDateTime(session.since)}</DataRow>
        </dl>
        <p className="panel-foot">
          {t("prof.nameFoot")}
        </p>
      </section>
      <Panel title={t("prof.data")} note={t("prof.dataNote")} span={8}>
        <section aria-labelledby="perfil-dados">
          <h3 className="panel-subtitle" id="perfil-dados">
            {t("prof.personal")}
          </h3>
          <dl className="data-list">
            <DataRow label={t("prof.fullName")}>{employee.fullName}</DataRow>
            <DataRow label={t("prof.socialName")}>{employee.socialName}</DataRow>
            <DataRow label={docLabel}>{docText}</DataRow>
            <DataRow label={t("prof.birth")}>{birthLine(employee, today)}</DataRow>
            <DataRow label={t("prof.phone")}>{formatPhone(employee.phone)}</DataRow>
          </dl>
        </section>
        <section aria-labelledby="perfil-endereco">
          <h3 className="panel-subtitle" id="perfil-endereco">
            {t("prof.address")}
          </h3>
          <dl className="data-list">
            <DataRow label={t("prof.street")}>{streetLine(employee.address)}</DataRow>
            <DataRow label={t("prof.district")}>{employee.address.district}</DataRow>
            <DataRow label={t("prof.city")}>{cityLine(employee.address)}</DataRow>
            <DataRow label={t("prof.cep")}>{employee.address.cep && formatCep(employee.address.cep)}</DataRow>
          </dl>
        </section>
      </Panel>
    </div>
  );
}
