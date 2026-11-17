// C14: Erweiterte Kennzahlen je Sportart („markante Werte“). Alle Berechnungen aus vorhandenen Daten:
// Abschluss-Protokoll (C11), Pläne/Termine (C6/C7), Stoppuhr-Werte (C12), Kernziele (C8).
// Grundsatz „ehrlich“: Werte, für die der Verlauf noch zu kurz ist, werden nicht geschätzt, sondern als „noch nicht
// verfügbar ab …“ ausgewiesen.
import type { Exercise, ExerciseLogEntry, StopwatchValue, TrainingPlan } from '../types';
import type { DateKey } from './dateKey';
import { addDays, daysBetween, occurrencesInRange } from './recurrence';
import { isoToDateKey } from './streak';

/** C14: Beendete Übungen und Trainingszeit (Summe der Übungsdauern) im Zeitraum [from, to]. */
export function periodSummary(
  log: ExerciseLogEntry[],
  exercises: Exercise[],
  from: DateKey,
  to: DateKey,
): { count: number; seconds: number } {
  let count = 0;
  let seconds = 0;
  for (const entry of log) {
    const day = isoToDateKey(entry.completedAt);
    if (!day || day < from || day > to) continue;
    count += 1;
    seconds += exercises.find((e) => e.id === entry.exerciseId)?.durationSeconds ?? 0;
  }
  return { count, seconds };
}

/**
 * C14: Planerfüllung – geplante Termine (inkl. Wiederholungen, ohne ausgetragene) im Zeitraum gegenüber Terminen, an
 * denen mindestens eine Übung DIESES Plans beendet wurde.
 */
export function planFulfillment(
  plans: TrainingPlan[],
  log: ExerciseLogEntry[],
  from: DateKey,
  to: DateKey,
): { scheduled: number; fulfilled: number } {
  const done = new Set<string>();
  for (const entry of log) {
    const day = isoToDateKey(entry.completedAt);
    if (day && entry.planId) done.add(`${entry.planId}|${day}`);
  }
  let scheduled = 0;
  let fulfilled = 0;
  for (const plan of plans) {
    for (const day of occurrencesInRange(plan, from, to)) {
      scheduled += 1;
      if (done.has(`${plan.id}|${day}`)) fulfilled += 1;
    }
  }
  return { scheduled, fulfilled };
}

export interface StopwatchBest {
  name: string;
  ms: number;
  count: number;
}

/** C14: Stoppuhr-Bestwerte je Name (gleiche Namen zusammengefasst, Groß-/Kleinschreibung egal), schnellste zuerst. */
export function stopwatchBests(values: StopwatchValue[]): StopwatchBest[] {
  const groups = new Map<string, StopwatchBest>();
  for (const value of values) {
    const key = value.name.toLocaleLowerCase('de-DE');
    const current = groups.get(key);
    if (!current) groups.set(key, { name: value.name, ms: value.ms, count: 1 });
    else groups.set(key, { ...current, ms: Math.min(current.ms, value.ms), count: current.count + 1 });
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export interface GymProgress {
  exerciseId: string;
  name: string;
  /** Höchstes Gewicht der ersten protokollierten Ausführung. */
  firstKg: number;
  /** Höchstes Gewicht der letzten protokollierten Ausführung. */
  lastKg: number;
  /** Höchstes jemals bewegtes Gewicht (Bestwert). */
  bestKg: number;
  sessions: number;
}

/** C14: Gym – Bestwert und Steigerung je Übung aus den TATSÄCHLICH trainierten Gewichten (Protokoll, C11). */
export function gymProgress(log: ExerciseLogEntry[], exercises: Exercise[]): GymProgress[] {
  const byExercise = new Map<string, { at: string; maxKg: number }[]>();
  for (const entry of log) {
    if (!entry.sets || entry.sets.length === 0) continue;
    const maxKg = Math.max(...entry.sets.map((s) => s.weightKg));
    const list = byExercise.get(entry.exerciseId) ?? [];
    list.push({ at: entry.completedAt, maxKg });
    byExercise.set(entry.exerciseId, list);
  }
  const result: GymProgress[] = [];
  for (const [exerciseId, list] of byExercise) {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) continue;
    list.sort((a, b) => a.at.localeCompare(b.at));
    result.push({
      exerciseId,
      name: exercise.name,
      firstKg: list[0].maxKg,
      lastKg: list[list.length - 1].maxKg,
      bestKg: Math.max(...list.map((l) => l.maxKg)),
      sessions: list.length,
    });
  }
  return result.sort((a, b) => b.lastKg - b.firstKg - (a.lastKg - a.firstKg) || a.name.localeCompare(b.name, 'de'));
}

export const STALE_DAYS = 30;

export type StaleResult =
  | { available: false; availableFrom: DateKey | null }
  | { available: true; items: { exercise: Exercise; lastDone: DateKey | null; daysSince: number }[] };

/**
 * C14: „Lange nicht trainiert“ – Übungen, die seit über 30 Tagen nicht beendet wurden. Erst verfügbar, wenn der Verlauf
 * mindestens 30 Tage zurückreicht; sonst würden alle älteren Übungen fälschlich als „nie trainiert“ erscheinen.
 */
export function staleExercises(
  exercises: Exercise[],
  log: ExerciseLogEntry[],
  today: DateKey,
  start: DateKey | null,
): StaleResult {
  if (!start || daysBetween(start, today) < STALE_DAYS) {
    return { available: false, availableFrom: start ? addDays(start, STALE_DAYS) : null };
  }
  const lastDone = new Map<string, DateKey>();
  for (const entry of log) {
    const day = isoToDateKey(entry.completedAt);
    if (day && (!lastDone.get(entry.exerciseId) || day > lastDone.get(entry.exerciseId)!)) lastDone.set(entry.exerciseId, day);
  }
  const limit = addDays(today, -STALE_DAYS);
  const items = exercises
    .map((exercise) => {
      const done = lastDone.get(exercise.id) ?? null;
      const created = isoToDateKey(exercise.createdAt);
      // Bezugstag: letzte Ausführung – sonst Erstellung, frühestens aber der Beginn der Verlaufsdaten.
      const reference = done ?? (created && created > start ? created : start);
      return { exercise, lastDone: done, reference, daysSince: daysBetween(reference, today) };
    })
    .filter((item) => item.reference < limit)
    .sort((a, b) => b.daysSince - a.daysSince)
    .map(({ exercise, lastDone: last, daysSince }) => ({ exercise, lastDone: last, daysSince }));
  return { available: true, items };
}
