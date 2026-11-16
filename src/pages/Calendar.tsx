// C6: Neue Seite – Kalender mit Monatsansicht, um Trainings konkret zu planen.
// Termine sind die Pläne der aktiven Sportart an ihrem Datum (`plan.date`) – keine zweite Terminliste,
// damit Kalender und Plan nie voneinander abweichen. Planen im Kalender: neuen Plan für einen Tag anlegen
// oder einen vorhandenen Plan auf den Tag legen (Abstimmung im Team).
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
import { formatDate, formatDuration, isOverdue } from '../lib/time';
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

          <div className="grid grid-cols-7 gap-1 sm:gap-2" aria-hidden="true">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="text-center text-xs font-semibold text-muted-2">
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
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
                    <span className={`block text-xs ${isOverdue(plan.date) ? 'text-danger' : 'text-muted-2'}`}>
                      {plan.date ? `Bisher: ${formatDate(plan.date)}` : 'Noch ohne Datum'}
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

// C6: Ein Tag im Raster. Handy: Tageszahl + Punkte; ab md: Tageszahl + Plannamen.
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
  const overdue = plans.length > 0 && isOverdue(day.key);
  const countLabel = plans.length === 0 ? 'kein Training' : plans.length === 1 ? '1 Plan' : `${plans.length} Pläne`;
  const MAX_NAMES = 2;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      // C6: Vollständige Ansage für Screenreader, z. B. „Montag, 16. November 2026, 2 Pläne, heute“.
      aria-label={`${formatLongDay(day.key)}, ${countLabel}${isToday ? ', heute' : ''}${overdue ? ', überfällig' : ''}`}
      // C6: Gewählt = blauer Verlauf wie aktive Navigation; heute = Ring; Nachbarmonat gedimmt.
      className={`flex h-12 flex-col items-center justify-center gap-1 rounded-xl border text-sm transition sm:h-14 md:h-28 md:items-stretch md:justify-start md:p-2 ${
        isSelected
          ? 'border-transparent bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)]'
          : `border-border bg-bg-soft hover:border-muted-2 ${day.inMonth ? 'text-ink' : 'text-muted-2 opacity-50'}`
      } ${isToday && !isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}
    >
      <span className={`font-semibold leading-none ${isToday ? 'font-extrabold' : ''}`}>{day.dayOfMonth}</span>

      {/* C6: Handy – bis zu 3 Punkte (rot bei überfälligen Plänen). */}
      {plans.length > 0 && (
        <span className="flex gap-0.5 md:hidden" aria-hidden="true">
          {plans.slice(0, 3).map((plan) => (
            <span
              key={plan.id}
              className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : overdue ? 'bg-danger' : 'bg-accent'}`}
            />
          ))}
        </span>
      )}

      {/* C6: Desktop – Plannamen (max. 2) + „+n“. */}
      {plans.length > 0 && (
        <span className="mt-1 hidden min-w-0 flex-col gap-1 md:flex" aria-hidden="true">
          {plans.slice(0, MAX_NAMES).map((plan) => (
            <span
              key={plan.id}
              className={`truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold ${
                isSelected ? 'bg-white/20 text-white' : overdue ? 'bg-danger/15 text-danger' : 'bg-primary-soft text-accent'
              }`}
            >
              {plan.name}
            </span>
          ))}
          {plans.length > MAX_NAMES && (
            <span className={`text-left text-[11px] ${isSelected ? 'text-white/80' : 'text-muted-2'}`}>
              +{plans.length - MAX_NAMES}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

// C6: Plan in der Tagesliste – Anzeigen-Link und „Datum entfernen“.
function PlanRow({ plan, exercises, onUnschedule }: { plan: TrainingPlan; exercises: Exercise[]; onUnschedule: () => void }) {
  const totalSeconds = plan.exerciseIds
    .map((id) => exercises.find((e) => e.id === id))
    .filter((e): e is Exercise => Boolean(e))
    .reduce((sum, e) => sum + e.durationSeconds, 0);
  const overdue = isOverdue(plan.date);

  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border bg-bg-soft p-3 ${overdue ? 'border-danger/50' : 'border-border'}`}
    >
      <Link to={`/plaene/${plan.id}`} className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink hover:underline">{plan.name}</span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-2">
          <Clock size={12} /> {formatDuration(totalSeconds)}
          {overdue && <span className="font-semibold text-danger">Überfällig</span>}
        </span>
      </Link>
      <IconButton icon={<CalendarX size={16} />} label={`Datum von „${plan.name}“ entfernen`} onClick={onUnschedule} />
    </li>
  );
}
