// C6: Neue Seite – Kalender mit Monatsansicht, um Trainings konkret zu planen.
// Termine sind die Pläne der aktiven Sportart an ihrem Datum (`plan.date`) – keine zweite Terminliste,
// damit Kalender und Plan nie voneinander abweichen. Planen im Kalender: neuen Plan für einen Tag anlegen
// oder einen vorhandenen Plan auf den Tag legen (Abstimmung im Team).
// C6a: Neues Design – Tage nur als Zahlen ohne Kästchen/Rahmen; Status „Heute / Ausstehend / Vergangen“ statt „Überfällig“.
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, CalendarX, ChevronLeft, ChevronRight, ClipboardList, Clock, MoveRight } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useSport } from '../context/SportContext';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { Modal } from '../components/Modal';
import {
  WEEKDAY_LABELS,
  formatLongDay,
  formatMonthTitle,
  getCalendarEntries,
  getMonthGrid,
  shiftMonth,
  type CalendarDay,
} from '../lib/calendar';
import { parseDateKey, todayKey, type DateKey } from '../lib/dateKey';
import { formatDate, formatDuration } from '../lib/time';
// C6a: Plan-Status statt isOverdue().
import { PLAN_STATUS_META, PLAN_STATUS_ORDER, getPlanStatus } from '../lib/planStatus';
import { PlanStatusBadge } from '../components/PlanStatusBadge';
import type { Exercise, TrainingPlan } from '../types';

export function Calendar() {
  const { plans, exercises, updatePlan } = useAppData();
  const { sport } = useSport();
  const navigate = useNavigate();

  const today = todayKey();
  const [view, setView] = useState(() => {
    const now = parseDateKey(today);
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedKey, setSelectedKey] = useState<DateKey>(today);
  const [assignOpen, setAssignOpen] = useState(false);

  const grid = useMemo(() => getMonthGrid(view.year, view.month), [view]);
  // C6: Termine für das gesamte sichtbare Raster (inkl. angedeuteter Tage aus Vor-/Folgemonat).
  const entries = useMemo(
    () => getCalendarEntries(plans, grid[0].key, grid[grid.length - 1].key),
    [plans, grid],
  );
  // C6: Der gewählte Tag kann außerhalb des Rasters liegen (z. B. nach dem Blättern) – eigene Abfrage.
  const selectedPlans = useMemo(
    () => getCalendarEntries(plans, selectedKey, selectedKey).get(selectedKey) ?? [],
    [plans, selectedKey],
  );

  function selectDay(day: CalendarDay) {
    setSelectedKey(day.key);
    // C6: Klick auf einen angedeuteten Tag aus dem Nachbarmonat wechselt in diesen Monat.
    if (!day.inMonth) {
      const date = parseDateKey(day.key);
      setView({ year: date.getFullYear(), month: date.getMonth() });
    }
  }

  function goToToday() {
    const now = parseDateKey(today);
    setView({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedKey(today);
  }

  // C6: Datum eines Plans setzen/entfernen. Bis C7 hat ein Plan genau ein Datum – „hierher legen“ verschiebt ihn.
  function setPlanDate(plan: TrainingPlan, date: DateKey | null) {
    updatePlan(plan.id, {
      name: plan.name,
      description: plan.description,
      targetGroup: plan.targetGroup,
      date,
      exerciseIds: plan.exerciseIds,
    });
  }

  const assignablePlans = plans
    .filter((plan) => plan.date !== selectedKey)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* C6: Kopfbereich im gleichen Stil wie Statistiken/Einstellungen. */}
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-extrabold text-ink">Kalender</h1>
        <p className="text-sm text-muted">Trainings für {sport.name} planen</p>
      </header>

      {/* C6: Tagesspalte erst ab 2xl neben dem Raster – darunter bleibt das Raster breit genug für Plannamen. */}
      <div className="flex flex-col gap-6 2xl:grid 2xl:grid-cols-[minmax(0,1fr)_360px] 2xl:items-start">
        {/* C6: Monatsansicht */}
        <section aria-label="Monatsansicht" className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-3 sm:p-5">
          <div className="flex items-center gap-2">
            <IconButton
              icon={<ChevronLeft size={18} />}
              label="Vorheriger Monat"
              onClick={() => setView((v) => shiftMonth(v.year, v.month, -1))}
            />
            <h2 className="min-w-0 flex-1 text-center font-display text-lg font-bold text-ink sm:flex-none sm:px-2" aria-live="polite">
              {formatMonthTitle(view.year, view.month)}
            </h2>
            <IconButton
              icon={<ChevronRight size={18} />}
              label="Nächster Monat"
              onClick={() => setView((v) => shiftMonth(v.year, v.month, 1))}
            />
            {/* C6: Gleicher runder Stil wie die Pfeil-Buttons (IconButton), damit die Leiste einheitlich wirkt. */}
            <button
              type="button"
              onClick={goToToday}
              className="ml-auto inline-flex h-10 shrink-0 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-surface-2"
            >
              Heute
            </button>
          </div>

          {/* C6a: Raster ohne Zellrahmen – nur Wochentage und Tageszahlen. */}
          <div className="grid grid-cols-7" aria-hidden="true">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="text-center text-xs font-semibold text-muted-2">
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {grid.map((day) => (
              <DayCell
                key={day.key}
                day={day}
                plans={entries.get(day.key) ?? []}
                isToday={day.key === today}
                isSelected={day.key === selectedKey}
                onSelect={() => selectDay(day)}
              />
            ))}
          </div>

          {/* C6a: Legende der drei Zustände – Farbe ist nie die einzige Information (auch im Screenreader-Text). */}
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted">
            {PLAN_STATUS_ORDER.map((status) => (
              <li key={status} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${PLAN_STATUS_META[status].dotClass}`} aria-hidden="true" />
                {PLAN_STATUS_META[status].label}
              </li>
            ))}
          </ul>
        </section>

        {/* C6: Gewählter Tag – Liste der Pläne und Aktionen zum Planen. */}
        <section aria-label="Gewählter Tag" className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
          <div>
            <p className="text-xs text-muted-2">{selectedKey === today ? 'Heute' : 'Gewählter Tag'}</p>
            <h2 className="font-display text-lg font-bold text-ink">{formatLongDay(selectedKey)}</h2>
          </div>

          {selectedPlans.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
              Kein Training geplant.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedPlans.map((plan) => (
                <PlanRow key={plan.id} plan={plan} exercises={exercises} onUnschedule={() => setPlanDate(plan, null)} />
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2">
            <PrimaryButton
              icon={<CalendarPlus size={18} />}
              className="h-12"
              onClick={() => navigate(`/plaene/neu?datum=${selectedKey}`)}
            >
              Neuer Plan für diesen Tag
            </PrimaryButton>
            <PrimaryButton
              variant="ghost"
              icon={<MoveRight size={18} />}
              className="h-12 border border-border"
              onClick={() => setAssignOpen(true)}
            >
              Plan hierher legen
            </PrimaryButton>
          </div>
        </section>
      </div>

      {/* C6: Vorhandenen Plan auf den gewählten Tag legen. */}
      <Modal open={assignOpen} title="Plan hierher legen" onClose={() => setAssignOpen(false)}>
        <p className="mb-4 text-sm text-muted">
          Wähle einen {sport.name}-Plan für {formatLongDay(selectedKey)}. Ein Plan hat ein Datum – ein bereits
          geplanter Plan wird auf diesen Tag verschoben.
        </p>
        {assignablePlans.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            Keine weiteren {sport.name}-Pläne vorhanden.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {assignablePlans.map((plan) => (
              <li key={plan.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPlanDate(plan, selectedKey);
                    setAssignOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-bg-soft px-4 py-3 text-left transition hover:border-primary"
                >
                  <ClipboardList size={18} className="shrink-0 text-muted-2" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{plan.name}</span>
                    {/* C6a: Bisheriges Datum mit Status statt roter „Überfällig“-Farbe. */}
                    <span className="block text-xs text-muted-2">
                      {plan.date
                        ? `Bisher: ${formatDate(plan.date)}${statusSuffix(plan.date)}`
                        : 'Noch ohne Datum'}
                    </span>
                  </span>
                  <MoveRight size={16} className="shrink-0 text-muted-2" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}

// C6a: Status-Text für die Planauswahl, z. B. „ · Vergangen“.
function statusSuffix(date: string): string {
  const status = getPlanStatus(date);
  return status ? ` · ${PLAN_STATUS_META[status].label}` : '';
}

// C6: Ein Tag im Raster. Handy: Tageszahl + Punkte; ab md: Tageszahl + Plannamen.
// C6a: Ohne Kästchen und Rahmen – der Tag ist nur seine Zahl. Hervorhebungen sitzen als Kreis direkt um die Zahl:
//      gewählt = gefüllter Kreis im blauen Verlauf (wie aktive Navigation), heute = zart getönter Kreis in Akzentfarbe.
//      Termine als Punkte bzw. Namen in der Farbe ihres Status (Heute / Ausstehend / Vergangen).
function DayCell({
  day,
  plans,
  isToday,
  isSelected,
  onSelect,
}: {
  day: CalendarDay;
  plans: TrainingPlan[];
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  // C6a: Alle Pläne eines Tages teilen sich den Status des Tages.
  const status = plans.length > 0 ? getPlanStatus(day.key) : null;
  const meta = status ? PLAN_STATUS_META[status] : null;
  const countLabel = plans.length === 0 ? 'kein Training' : plans.length === 1 ? '1 Plan' : `${plans.length} Pläne`;
  const MAX_NAMES = 2;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      // C6: Vollständige Ansage für Screenreader, z. B. „Montag, 16. November 2026, 2 Pläne, heute“.
      // C6a: Status statt „überfällig“ („…, 1 Plan, vergangen“).
      aria-label={`${formatLongDay(day.key)}, ${countLabel}${isToday ? ', heute' : status ? `, ${meta!.label.toLowerCase()}` : ''}`}
      className={`group flex h-14 min-w-0 flex-col items-center gap-1 rounded-xl pt-1 outline-none focus-visible:ring-2 focus-visible:ring-primary md:h-28 md:pt-2 ${
        day.inMonth ? '' : 'opacity-40'
      }`}
    >
      {/* C6a: Die Tageszahl selbst – Kreis nur bei „gewählt“ und „heute“, sonst schlicht. */}
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm leading-none transition ${
          isSelected
            ? 'bg-gradient-to-br from-primary to-primary-dark font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.35)]'
            : isToday
              ? 'bg-accent/15 font-extrabold text-accent group-hover:bg-accent/25'
              : `font-semibold group-hover:bg-surface-2 ${day.inMonth ? 'text-ink' : 'text-muted-2'}`
        }`}
      >
        {day.dayOfMonth}
      </span>

      {/* C6: Handy – bis zu 3 Punkte. C6a: in der Farbe des Status. */}
      {meta && (
        <span className="flex gap-0.5 md:hidden" aria-hidden="true">
          {plans.slice(0, 3).map((plan) => (
            <span key={plan.id} className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
          ))}
        </span>
      )}

      {/* C6: Desktop – Plannamen (max. 2) + „+n“. C6a: schlichte Textzeilen mit Status-Punkt statt farbiger Kästchen. */}
      {meta && (
        <span className="hidden w-full min-w-0 flex-col items-center gap-0.5 px-1 md:flex" aria-hidden="true">
          {plans.slice(0, MAX_NAMES).map((plan) => (
            <span key={plan.id} className={`flex max-w-full min-w-0 items-center gap-1 text-[11px] font-semibold ${meta.textClass}`}>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClass}`} />
              <span className="truncate">{plan.name}</span>
            </span>
          ))}
          {plans.length > MAX_NAMES && <span className="text-[11px] text-muted">+{plans.length - MAX_NAMES} weitere</span>}
        </span>
      )}
    </button>
  );
}

// C6: Plan in der Tagesliste – Anzeigen-Link und „Datum entfernen“.
// C6a: Status-Badge statt „Überfällig“; Pläne des Tages mit Akzent-Rahmen wie in der Plankarte.
function PlanRow({ plan, exercises, onUnschedule }: { plan: TrainingPlan; exercises: Exercise[]; onUnschedule: () => void }) {
  const totalSeconds = plan.exerciseIds
    .map((id) => exercises.find((e) => e.id === id))
    .filter((e): e is Exercise => Boolean(e))
    .reduce((sum, e) => sum + e.durationSeconds, 0);
  const status = getPlanStatus(plan.date);

  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border bg-bg-soft p-3 ${status === 'heute' ? 'border-accent/60' : 'border-border'}`}
    >
      <Link to={`/plaene/${plan.id}`} className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink hover:underline">{plan.name}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-2">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {formatDuration(totalSeconds)}
          </span>
          {status && <PlanStatusBadge status={status} />}
        </span>
      </Link>
      <IconButton icon={<CalendarX size={16} />} label={`Datum von „${plan.name}“ entfernen`} onClick={onUnschedule} />
    </li>
  );
}
