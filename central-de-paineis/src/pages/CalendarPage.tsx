import { useMemo, useState } from "react";
import { Panel } from "../components/Panel";
import { t } from "../i18n";
import { absencesByDate, inPeriod, listAbsences, overlapsRange } from "../lib/absences";
import { addDays, daysBetween, todayIso } from "../lib/calendar";
import {
  clampDay,
  customRangeError,
  DAY_PERIODS,
  describeRange,
  eachDay,
  FIRST_DAY,
  isMonthGridView,
  LAST_DAY,
  monthsOf,
  periodAt,
  periodHours,
  periodLabel,
  rangeFor,
  shiftAnchor,
  shiftPeriod,
  shiftRange,
  stepLabel,
} from "../lib/calendarViews";
import { citiesByGroup, findCity, placeLabel, preferredCityId, storeCityId } from "../lib/cities";
import { findEmployee } from "../lib/employees";
import { groupByDate, holidaysInRange } from "../lib/holidays";
import type { CalendarView, DashboardPageProps, DateRange, DayPeriod } from "../types";
import { CalendarSidebar, type SelectedDay } from "./calendar/CalendarSidebar";
import { DayAgenda } from "./calendar/DayAgenda";
import { legend } from "./calendar/labels";
import { MonthGrid } from "./calendar/MonthGrid";
import { ViewPicker } from "./calendar/ViewPicker";
import { WeekView } from "./calendar/WeekView";

const CUSTOM_DEFAULT_DAYS = 14;

export function CalendarPage({ session }: DashboardPageProps) {
  const [today] = useState(todayIso);

  const [cityId, setCityId] = useState(() => preferredCityId(findEmployee(session.document)?.address));
  const [view, setView] = useState<CalendarView>("mes");

  const [anchor, setAnchor] = useState(today);
  const [period, setPeriod] = useState<DayPeriod>(() => periodAt());

  const [customDraft, setCustomDraft] = useState<DateRange>(() => ({
    start: today,
    end: addDays(today, CUSTOM_DEFAULT_DAYS - 1),
  }));
  const [custom, setCustom] = useState<DateRange>(customDraft);

  const [selected, setSelected] = useState<string | null>(null);

  const city = findCity(cityId);
  const range = useMemo(() => rangeFor(view, anchor, custom), [view, anchor, custom]);

  const allAbsences = useMemo(listAbsences, []);

  const holidays = useMemo(() => holidaysInRange(city.id, range), [city.id, range]);
  const holidayMap = useMemo(() => groupByDate(holidays), [holidays]);

  const absences = useMemo(() => {
    const inRange = allAbsences.filter((entry) => overlapsRange(entry, range));
    return view === "periodo" ? inRange.filter((entry) => inPeriod(entry, period)) : inRange;
  }, [allAbsences, range, view, period]);
  const absenceMap = useMemo(() => absencesByDate(absences, range), [absences, range]);

  const days = useMemo(() => eachDay(range), [range]);

  const heading = describeRange(view, range, period);
  const cityGroups = citiesByGroup();
  const customError = customRangeError(customDraft);
  const multiDay = range.start !== range.end;

  const selectedDay: SelectedDay | null =
    selected && selected >= range.start && selected <= range.end
      ? {
          iso: selected,
          holidays: holidayMap.get(selected) ?? [],
          absences: absenceMap.get(selected) ?? [],
        }
      : null;

  function changeCity(id: string) {
    setCityId(id);
    storeCityId(id);
  }

  function changeView(next: CalendarView) {
    if (next === "personalizado" && view !== next) {
      setCustom(range);
      setCustomDraft(range);
    }
    setView(next);
    setSelected(null);
  }

  function go(delta: number) {
    if (view === "periodo") {
      const next = shiftPeriod(anchor, period, delta);
      setAnchor(next.anchor);
      setPeriod(next.period);
    } else if (view === "personalizado") {
      const next = shiftRange(custom, delta);
      setCustom(next);
      setCustomDraft(next);
    } else {
      setAnchor(shiftAnchor(view, anchor, delta));
    }
    setSelected(null);
  }

  function goToToday() {
    setAnchor(today);
    setPeriod(periodAt());

    if (view === "personalizado") {
      const next = { start: today, end: addDays(today, daysBetween(custom.start, custom.end) - 1) };
      setCustom(next);
      setCustomDraft(next);
    }
    setSelected(null);
  }

  function selectDay(iso: string) {
    setSelected((current) => (current === iso ? null : iso));
    setAnchor(iso);
  }

  function openDay(iso: string) {
    setAnchor(iso);
    setView("dia");
    setSelected(null);
  }

  function changeCustom(field: keyof DateRange, value: string) {
    const next = { ...customDraft, [field]: value };
    setCustomDraft(next);
    if (!customRangeError(next)) setCustom(next);
  }

  function renderView() {
    if (view === "periodo" || view === "dia") {
      return (
        <DayAgenda
          day={range.start}
          city={city}
          holidays={holidayMap.get(range.start) ?? []}
          absences={absenceMap.get(range.start) ?? []}
          periods={view === "periodo" ? [period] : DAY_PERIODS}
        />
      );
    }

    if (view === "semana") {
      return (
        <WeekView
          days={days}
          today={today}
          holidays={holidayMap}
          absences={absenceMap}
          selected={selected}
          onSelect={selectDay}
        />
      );
    }

    const months = monthsOf(range);
    const mini = view !== "mes";

    return (
      <div className={mini ? "months" : undefined}>
        {months.map(({ year, month }) => (
          <MonthGrid
            key={`${year}-${month}`}
            year={year}
            month={month}
            today={today}
            city={city}
            absences={absenceMap}
            range={range}
            selected={selected}
            onSelect={selectDay}
            mini={mini}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="calendar-toolbar">
        <div className="calendar-city">
          <label htmlFor="calendario-cidade">{t("cal.port")}</label>
          <select
            id="calendario-cidade"
            className="input select"
            value={city.id}
            onChange={(event) => changeCity(event.target.value)}
          >
            {cityGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.cities.map((item) => (
                  <option key={item.id} value={item.id}>
                    {placeLabel(item)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <ViewPicker view={view} onChange={changeView} onToday={goToToday} />
      </div>
      <div className="grid">
        <Panel
          title={heading.title}
          note={[heading.note, placeLabel(city)].filter(Boolean).join(" · ")}
          span={8}
          actions={
            <div className="calendar-nav">
              {view === "periodo" && (
                <div className="segmented" role="group" aria-label={t("cal.dayPeriod")}>
                  {DAY_PERIODS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={period === item}
                      title={periodHours(item)}
                      onClick={() => setPeriod(item)}
                    >
                      {periodLabel(item)}
                    </button>
                  ))}
                </div>
              )}

              <div className="segmented calendar-arrows" role="group" aria-label={t("cal.navigate")}>
                <button
                  type="button"
                  title={stepLabel(view, "prev")}
                  aria-label={stepLabel(view, "prev")}
                  onClick={() => go(-1)}
                >
                  <span aria-hidden="true">{"‹"}</span>
                </button>
                <button
                  type="button"
                  title={stepLabel(view, "next")}
                  aria-label={stepLabel(view, "next")}
                  onClick={() => go(1)}
                >
                  <span aria-hidden="true">{"›"}</span>
                </button>
              </div>
              {view !== "personalizado" && (
                <>
                  <label className="sr-only" htmlFor="calendario-data">
                    {t("cal.goTo")}
                  </label>
                  <input
                    id="calendario-data"
                    className="input input--date"
                    type="date"
                    min={FIRST_DAY}
                    max={LAST_DAY}
                    value={anchor}
                    title={t("cal.goTo")}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (/^\d{4}-\d{2}-\d{2}$/.test(value) && clampDay(value) === value) {
                        setAnchor(value);
                        setSelected(null);
                      }
                    }}
                  />
                </>
              )}
            </div>
          }
        >
          {view === "personalizado" && (
            <div className="range-picker">
              <div className="field">
                <label htmlFor="calendario-de">{t("cal.from")}</label>
                <input
                  id="calendario-de"
                  className="input input--date"
                  type="date"
                  min={FIRST_DAY}
                  max={LAST_DAY}
                  value={customDraft.start}
                  aria-invalid={customError ? true : undefined}
                  aria-describedby={customError ? "calendario-intervalo-erro" : undefined}
                  onChange={(event) => changeCustom("start", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="calendario-ate">{t("cal.to")}</label>
                <input
                  id="calendario-ate"
                  className="input input--date"
                  type="date"
                  min={customDraft.start || FIRST_DAY}
                  max={LAST_DAY}
                  value={customDraft.end}
                  aria-invalid={customError ? true : undefined}
                  aria-describedby={customError ? "calendario-intervalo-erro" : undefined}
                  onChange={(event) => changeCustom("end", event.target.value)}
                />
              </div>
              {customError && (
                <p className="field-error" id="calendario-intervalo-erro" role="alert">
                  {customError} {t("cal.err.keep")}
                </p>
              )}
            </div>
          )}

          {renderView()}

          {(isMonthGridView(view) || view === "semana") && (
            <ul className="calendar-legend">
              {legend().map((item) => (
                <li key={item.className}>
                  <span className={`legend-swatch ${item.className}`} aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <CalendarSidebar
          city={city}
          multiDay={multiDay}
          holidays={holidays}
          absences={absences}
          selectedDay={view === "dia" || view === "periodo" ? null : selectedDay}
          onOpenDay={openDay}
        />
      </div>
    </>
  );
}
