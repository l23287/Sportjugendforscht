import { useMemo } from 'react';
import { BarChart3, ClipboardList, Clock, Dumbbell } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { StatTile } from '../components/StatTile';
import { DonutChart, type DonutSlice } from '../components/DonutChart';
import { EmptyState } from '../components/EmptyState';
import { computeAverageDuration, computeExerciseUsage } from '../lib/stats';
import { CATEGORICAL_PALETTE_DARK, CHART_OTHER_COLOR } from '../lib/chartPalette';
import { formatDuration } from '../lib/time';
import { useSport } from '../context/SportContext';
// C9: Schalter „Schwierigkeitsgrad“.
import { useTrainerFeatures } from '../context/TrainerFeaturesContext';
// C2: Einheitliches Sporticon mit farbiger Umrandung.
import { SportBadge } from '../components/SportBadge';
// C14: Flammenstreak und erweiterte Kennzahlen.
import { StreakCard } from '../components/StreakCard';
import { BestsCard, GoalsCard, PeriodTiles, PlanFulfillmentCard, StaleCard } from '../components/StatisticsInsights';
import { gymProgress, periodSummary, planFulfillment, staleExercises, stopwatchBests } from '../lib/insights';
import { weekStartOf } from '../lib/streak';
import { addDays } from '../lib/recurrence';
import { todayKey } from '../lib/dateKey';
import { formatDate as formatDay } from '../lib/time';
import { hasStrengthTraining } from '../lib/sport';

const MAX_NAMED_SLICES = 5;

export function Statistics() {
  const { plans, exercises, exerciseLog, stopwatchValues, goals, trackingStartKey } = useAppData();
  const { sport } = useSport();

  // C14: Erweiterte Kennzahlen der aktiven Sportart (Protokoll ist bereits nach Sportart gefiltert).
  const today = todayKey();
  const week = periodSummary(exerciseLog, exercises, weekStartOf(today), today);
  const month = periodSummary(exerciseLog, exercises, `${today.slice(0, 8)}01`, today);
  // Planerfüllung: letzte 4 Wochen, frühestens ab Beginn der Verlaufsdaten (ehrlich – vorher gab es kein Protokoll).
  const fourWeeksAgo = addDays(today, -27);
  const fulfillmentFrom = trackingStartKey && trackingStartKey > fourWeeksAgo ? trackingStartKey : fourWeeksAgo;
  const fulfillment = planFulfillment(plans, exerciseLog, fulfillmentFrom, today);
  const fulfillmentLabel = !trackingStartKey
    ? null
    : fulfillmentFrom === fourWeeksAgo
      ? 'der letzten 4 Wochen'
      : `seit ${formatDay(fulfillmentFrom)}`;
  const showGym = hasStrengthTraining(sport);

  const beginnerCount = exercises.filter((exercise) => exercise.difficulty === 'Anfänger').length;
  const advancedCount = exercises.filter((exercise) => exercise.difficulty === 'Fortgeschritten').length;
  // C9: Übungen ohne Schwierigkeitsgrad werden getrennt gezählt statt falsch eingeordnet.
  const unratedCount = exercises.filter((exercise) => exercise.difficulty === null).length;
  const { features } = useTrainerFeatures();

  const averageDuration = useMemo(() => computeAverageDuration(plans, exercises), [plans, exercises]);

  const usageData = useMemo(() => {
    const usage = computeExerciseUsage(plans, exercises);
    const named: DonutSlice[] = usage.slice(0, MAX_NAMED_SLICES).map((entry, index) => ({
      id: entry.exercise.id,
      label: entry.exercise.name,
      value: entry.count,
      color: CATEGORICAL_PALETTE_DARK[index],
    }));
    const rest = usage.slice(MAX_NAMED_SLICES);
    const restTotal = rest.reduce((sum, entry) => sum + entry.count, 0);
    if (restTotal > 0) {
      named.push({ id: '__other__', label: 'Andere', value: restTotal, color: CHART_OTHER_COLOR });
    }
    return named;
  }, [plans, exercises]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* C5: Hinweis, dass die Zahlen nur für die aktive Sportart gelten (gleicher Stil wie die Unterzeile in den Einstellungen). */}
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-extrabold text-ink">Statistiken</h1>
        <p className="text-sm text-muted">Auswertung für {sport.name}</p>
      </header>

      {/* C14: Flammenstreak ganz oben – gilt für die Person über alle Sportarten. */}
      <StreakCard />

      {/* C14 (2): Diese Woche / dieser Monat. */}
      <PeriodTiles week={week} month={month} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={<ClipboardList size={20} />} label="Trainingspläne" value={plans.length} />
        <StatTile icon={<Dumbbell size={20} />} label="Übungen" value={exercises.length} />
        <StatTile
          icon={<Clock size={20} />}
          label="Ø Trainingsdauer"
          // C4: averageDuration ist jetzt in Sekunden.
          value={plans.length === 0 ? '–' : formatDuration(averageDuration)}
        />
        <StatTile
          // C1: Emoji und Name aus dem Sportart-Objekt.
          // C2: SportBadge füllt die Icon-Fläche der Kachel aus (gleiche Größe 44px).
          icon={<SportBadge sport={sport} size="md" />}
          label="Sportart"
          value={sport.name}
        />
      </div>

      {/* C14 (4 + 7): Planerfüllung und Kernziele nebeneinander (ab lg). */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlanFulfillmentCard scheduled={fulfillment.scheduled} fulfilled={fulfillment.fulfilled} sinceLabel={fulfillmentLabel} />
        <GoalsCard achieved={goals.filter((g) => g.achieved).length} total={goals.length} />
      </div>

      {/* C14 (5 + 6 + 8): Bestwerte (inkl. Gym-Steigerung) und „Lange nicht trainiert“. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BestsCard stopwatch={stopwatchBests(stopwatchValues)} gym={gymProgress(exerciseLog, exercises)} showGym={showGym} />
        <StaleCard result={staleExercises(exercises, exerciseLog, today, trackingStartKey)} />
      </div>

      {/* C9: Abschnitt nur bei eingeschalteter Trainer-Funktion „Schwierigkeitsgrad“. */}
      {features.difficulty && (
        <DifficultyBreakdown beginner={beginnerCount} advanced={advancedCount} unrated={unratedCount} />
      )}

      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-ink">Meist genutzte Übungen</h2>
        {usageData.length === 0 ? (
          <EmptyState
            icon={<BarChart3 size={28} />}
            title="Noch keine Daten"
            // C5: Statistiken gelten nur für die aktive Sportart.
            description={`Sobald ${sport.name}-Übungen in Trainingsplänen verwendet werden, siehst du hier die Verteilung.`}
          />
        ) : (
          <DonutChart data={usageData} totalLabel="Einsätze" />
        )}
      </div>
    </div>
  );
}

// C9: Dritter Anteil „Ohne Angabe“ (gestrichelt/dunkel, damit er sich von den beiden Stufen abhebt).
function DifficultyBreakdown({ beginner, advanced, unrated }: { beginner: number; advanced: number; unrated: number }) {
  const total = beginner + advanced + unrated;
  const beginnerPct = total === 0 ? 0 : (beginner / total) * 100;
  const advancedPct = total === 0 ? 0 : (advanced / total) * 100;
  const unratedPct = total === 0 ? 0 : (unrated / total) * 100;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-bold text-ink">Übungen nach Schwierigkeitsgrad</h2>
      {total === 0 ? (
        <p className="text-sm text-muted-2">Noch keine Übungen angelegt.</p>
      ) : (
        <>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-bg-soft">
            <div className="h-full bg-muted-2" style={{ width: `${beginnerPct}%` }} />
            {beginner > 0 && advanced > 0 && <div className="h-full w-[3px] bg-bg-soft" />}
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-dark"
              style={{ width: `${advancedPct}%` }}
            />
            {unrated > 0 && beginner + advanced > 0 && <div className="h-full w-[3px] bg-bg-soft" />}
            {unrated > 0 && <div className="h-full bg-surface-2" style={{ width: `${unratedPct}%` }} />}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-2" /> Anfänger · {beginner}
            </span>
            <span className="inline-flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-primary to-primary-dark" />{' '}
              Fortgeschritten · {advanced}
            </span>
            {unrated > 0 && (
              <span className="inline-flex items-center gap-2 text-muted">
                <span className="h-2.5 w-2.5 rounded-full border border-muted-2 bg-surface-2" /> Ohne Angabe · {unrated}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
