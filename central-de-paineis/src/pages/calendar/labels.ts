import { countryName, t, type MessageKey } from "../../i18n";
import { regionOf } from "../../lib/cities";
import { countryOf, HOME_COUNTRY } from "../../lib/countries";
import type { City, HolidayKind, HolidayScope, Tone } from "../../types";

export const KIND_TONE: Record<HolidayKind, Tone> = {
  feriado: "negative",
  facultativo: "warning",
};

export const kindLabel = (kind: HolidayKind): string => t(`cal.kind.${kind}`);

const KNOWN_REGION_LABELS = ["Estadual", "Regional", "Provincial", "Departamental"];

export const regionKindLabel = (label: string): string =>
  KNOWN_REGION_LABELS.includes(label) ? t(`cal.region.${label}` as MessageKey) : label;

export function scopeLabel(scope: HolidayScope, city: City): string {
  const country = countryOf(city.country);

  if (scope === "nacional") {
    return city.country === HOME_COUNTRY
      ? t("cal.scope.national")
      : t("cal.scope.nationalOf", { country: countryName(country.code, country.name) });
  }
  if (scope === "estadual") return `${regionKindLabel(country.regionLabel)} (${regionOf(city)?.label ?? city.state})`;
  return t("cal.scope.municipal", { city: city.name });
}

export const legend = () => [
  { className: "is-holiday", label: t("cal.legend.holiday") },
  { className: "is-optional", label: t("cal.legend.optional") },
  { className: "has-absence", label: t("cal.legend.absence") },
  { className: "is-today", label: t("cal.legend.today") },
  { className: "is-weekend", label: t("cal.legend.weekend") },
];
