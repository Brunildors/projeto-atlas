import { t } from "../../i18n";
import { inPeriod } from "../../lib/absences";
import { isWeekend } from "../../lib/calendar";
import { periodHours, periodLabel } from "../../lib/calendarViews";
import type { AbsenceEntry, City, DayPeriod, Holiday } from "../../types";
import { AbsenceList, HolidayList } from "./lists";

interface DayAgendaProps {
  day: string;
  city: City;
  holidays: Holiday[];
  absences: AbsenceEntry[];
  periods: DayPeriod[];
}

export function DayAgenda({ day, city, holidays, absences, periods }: DayAgendaProps) {
  const fullDay = absences.filter((entry) => entry.type === "falta");
  const late = absences.filter((entry) => entry.type === "atraso");

  return (
    <div className="agenda">
      <section className="agenda-block" aria-labelledby="agenda-datas">
        <h3 className="agenda-title" id="agenda-datas">
          {t("cal.dayDates")}
        </h3>
        {holidays.length > 0 ? (
          <HolidayList holidays={holidays} city={city} withDate={false} />
        ) : (
          <p className="empty">{isWeekend(day) ? t("cal.weekendNoHoliday") : t("cal.workdayNoHoliday")}</p>
        )}
      </section>
      <section className="agenda-block" aria-labelledby="agenda-faltas">
        <h3 className="agenda-title" id="agenda-faltas">
          {t("cal.absencesFull")} <span className="agenda-hours">{t("cal.fullDay")}</span>
        </h3>
        {fullDay.length > 0 ? (
          <AbsenceList entries={fullDay} withDate={false} />
        ) : (
          <p className="empty">{t("cal.noAbsence")}</p>
        )}
      </section>
      {periods.map((period) => {
        const inThisPeriod = late.filter((entry) => inPeriod(entry, period));

        return (
          <section key={period} className="agenda-block" aria-labelledby={`agenda-${period}`}>
            <h3 className="agenda-title" id={`agenda-${period}`}>
              {t("cal.lateIn", { period: periodLabel(period) })} <span className="agenda-hours">{periodHours(period)}</span>
            </h3>
            {inThisPeriod.length > 0 ? (
              <AbsenceList entries={inThisPeriod} withDate={false} />
            ) : (
              <p className="empty">{t("cal.noLate")}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
