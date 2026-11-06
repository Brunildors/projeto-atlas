import { Panel } from "../../components/Panel";
import { countryName, t } from "../../i18n";
import { placeLabel } from "../../lib/cities";
import { countryOf, HOME_COUNTRY } from "../../lib/countries";
import { formatIsoDateLong } from "../../lib/format";
import type { AbsenceEntry, City, Holiday } from "../../types";
import { AbsenceList, HolidayList } from "./lists";

export interface SelectedDay {
  iso: string;
  holidays: Holiday[];
  absences: AbsenceEntry[];
}

interface CalendarSidebarProps {
  city: City;
  multiDay: boolean;
  holidays: Holiday[];
  absences: AbsenceEntry[];
  selectedDay: SelectedDay | null;
  onOpenDay: (iso: string) => void;
}

export function CalendarSidebar({
  city,
  multiDay,
  holidays,
  absences,
  selectedDay,
  onOpenDay,
}: CalendarSidebarProps) {
  const national = holidays.filter((holiday) => holiday.scope === "nacional");
  const local = holidays.filter((holiday) => holiday.scope !== "nacional");
  const country = countryOf(city.country);
  const place = placeLabel(city);

  return (
    <Panel title={t("cal.inPeriod")} note={place} span={4}>
      {selectedDay && (
        <div className="day-detail">
          <p className="day-detail-date">{formatIsoDateLong(selectedDay.iso)}</p>
          {selectedDay.holidays.length > 0 && (
            <HolidayList holidays={selectedDay.holidays} city={city} withDate={false} />
          )}
          {selectedDay.absences.length > 0 && <AbsenceList entries={selectedDay.absences} withDate={false} />}
          {selectedDay.holidays.length === 0 && selectedDay.absences.length === 0 && (
            <p className="muted">{t("cal.nothingThatDay")}</p>
          )}

          <button type="button" className="btn day-detail-open" onClick={() => onOpenDay(selectedDay.iso)}>
            {t("cal.openDay")}
          </button>
        </div>
      )}

      <h3 className="panel-subtitle">{t("cal.holidays")}</h3>
      <h4 className="list-group">
        {city.country === HOME_COUNTRY
          ? t("cal.national")
          : t("cal.nationalOf", { country: countryName(country.code, country.name) })}
      </h4>
      {national.length > 0 ? (
        <HolidayList holidays={national} city={city} withDate={multiDay} showScope={false} />
      ) : (
        <p className="empty">{t("cal.noNational")}</p>
      )}

      <h4 className="list-group">{t("cal.localOf", { place })}</h4>
      {local.length > 0 ? (
        <HolidayList holidays={local} city={city} withDate={multiDay} />
      ) : (
        <p className="empty">{t("cal.noLocal")}</p>
      )}

      <h3 className="panel-subtitle">{t("cal.whoIsOut")}</h3>
      {absences.length > 0 ? (
        <AbsenceList entries={absences} withDate={multiDay} />
      ) : (
        <p className="empty">{t("cal.nobodyOut")}</p>
      )}

      <p className="panel-foot">{t("cal.foot")}</p>
    </Panel>
  );
}
