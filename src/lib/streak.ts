// C14: Flammenstreak – WOCHEN-Streak (Abstimmung im Team).
// Eine Woche (Montag–Sonntag) zählt als aktiv, wenn darin mindestens eine Übung BEENDET (Abschluss-Protokoll aus C11)
// oder NEU ERSTELLT wurde. Der Streak reißt erst, wenn eine ganze Woche ohne Aktivität vergangen ist – Ruhetage gehören
// zum Training. Er gilt für die PERSON über alle Sportarten und wird aus dem Verlauf BERECHNET (nie als Zahl
// gespeichert), damit er immer stimmt. Alle Tage als zeitzonensichere DateKeys (C6).
import type { Exercise, ExerciseLogEntry } from '../types';
import { isDateKey, toDateKey, type DateKey } from './dateKey';
import { addDays, daysBetween, weekdayOf } from './recurrence';

/** C14: ISO-Zeitstempel → lokaler Tag (oder null bei ungültigem Datum, z. B. Altdaten). */
export function isoToDateKey(iso: string): DateKey | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : toDateKey(date);
}

/** C14: Montag der Woche eines Tages. */
export function weekStartOf(day: DateKey): DateKey {
  return addDays(day, -weekdayOf(day));
}

/**
 * C14: Aktivität je Tag. Beendete Übungen zählen einzeln; NEU ERSTELLTE Übungen höchstens EINMAL pro Tag
 * (Schutz davor, den Streak mit leeren Übungen hochzutreiben). Gelöschte Übungen senken nichts – das Protokoll bleibt.
 */
export function activityByDay(log: Pick<ExerciseLogEntry, 'completedAt'>[], exercises: Pick<Exercise, 'createdAt'>[]): Map<DateKey, number> {
  const counts = new Map<DateKey, number>();
  for (const entry of log) {
    const day = isoToDateKey(entry.completedAt);
    if (day) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  const creationDays = new Set<DateKey>();
  for (const exercise of exercises) {
    const day = isoToDateKey(exercise.createdAt);
    if (day) creationDays.add(day);
  }
  for (const day of creationDays) counts.set(day, (counts.get(day) ?? 0) + 1);
  return counts;
}

export interface StreakInfo {
  /** Aktuelle Serie in Wochen (0 = keine). */
  current: number;
  /** Längste Serie in Wochen. */
  longest: number;
  /** Aktivitäten in der laufenden Woche. */
  thisWeek: number;
  /** true, wenn die Serie läuft, diese Woche aber noch keine Aktivität hatte („noch offen“). */
  atRisk: boolean;
}

/** C14: Streak aus den aktiven Tagen berechnen. */
export function computeStreak(activity: Map<DateKey, number>, today: DateKey): StreakInfo {
  const activeWeeks = new Set<DateKey>();
  for (const [day, count] of activity) if (count > 0 && day <= today) activeWeeks.add(weekStartOf(day));

  const thisWeekStart = weekStartOf(today);
  let thisWeek = 0;
  for (const [day, count] of activity) if (day >= thisWeekStart && day <= today) thisWeek += count;

  // Laufende Woche ohne Aktivität beendet die Serie noch nicht – sie ist dann nur „offen“.
  let cursor = activeWeeks.has(thisWeekStart) ? thisWeekStart : addDays(thisWeekStart, -7);
  let current = 0;
  while (activeWeeks.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -7);
  }

  const sorted = [...activeWeeks].sort();
  let longest = 0;
  let run = 0;
  sorted.forEach((week, index) => {
    run = index > 0 && daysBetween(sorted[index - 1], week) === 7 ? run + 1 : 1;
    longest = Math.max(longest, run);
  });

  return { current, longest, thisWeek, atRisk: current > 0 && !activeWeeks.has(thisWeekStart) };
}

/** C14: Tage für den Aktivitäts-Kalender – 12 volle Wochen bis einschließlich der laufenden (Spalten = Wochen). */
export function heatmapWeeks(today: DateKey, weeks = 12): DateKey[][] {
  const lastMonday = weekStartOf(today);
  return Array.from({ length: weeks }, (_, w) => {
    const monday = addDays(lastMonday, -(weeks - 1 - w) * 7);
    return Array.from({ length: 7 }, (_, d) => addDays(monday, d));
  });
}

/** C14: Intensitätsstufe 0–3 für eine Kalenderzelle. */
export function heatLevel(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  return 3;
}

/** C14: Erster protokollierter Tag (Beginn der Verlaufsdaten) – für den ehrlichen Hinweis „Daten seit …“. */
export function trackingStart(log: Pick<ExerciseLogEntry, 'completedAt'>[]): DateKey | null {
  let first: DateKey | null = null;
  for (const entry of log) {
    const day = isoToDateKey(entry.completedAt);
    if (day && isDateKey(day) && (!first || day < first)) first = day;
  }
  return first;
}
