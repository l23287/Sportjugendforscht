// C18: Favoriten – häufig genutzte Übungen erscheinen in der Planerstellung oben und leicht hervorgehoben.
// Regel (Abstimmung im Team), automatisch und ohne Pflege, je aktiver Sportart:
//   Wert = Anzahl Pläne, die die Übung enthalten + Anzahl Ausführungen (Abschluss-Protokoll, C11) der letzten 8 Wochen.
//   Favorit ab Wert 3, höchstens 5 Übungen; bei Gleichstand zählt die zuletzt genutzte.
// Die Kombination ist fair für Trainer, die viel planen, und für Sportler, die viel trainieren. Durch das Zeitfenster
// zählen aktuelle Gewohnheiten mehr als alte. Wird bei jedem Anzeigen berechnet, nie gespeichert (wie der Streak, C14).
import type { Exercise, ExerciseLogEntry, TrainingPlan } from '../types';
import type { DateKey } from './dateKey';
import { addDays } from './recurrence';
import { isoToDateKey } from './streak';

export const FAVORITE_MAX = 5;
export const FAVORITE_MIN_SCORE = 3;
export const FAVORITE_WINDOW_DAYS = 8 * 7;

export interface FavoriteInfo {
  /** Gesamtwert (Pläne + Ausführungen im Zeitfenster) – wird als „n× genutzt“ angezeigt. */
  score: number;
  plans: number;
  completions: number;
  /** Letzte Nutzung (Ausführung) als DateKey – für den Gleichstand. */
  lastUsed: DateKey | null;
}

/** C18: Nutzungswerte aller Übungen. Pläne zählen je Plan einmal, auch wenn die Übung darin doppelt vorkommt. */
export function usageScores(
  exercises: Pick<Exercise, 'id'>[],
  plans: Pick<TrainingPlan, 'exerciseIds'>[],
  log: Pick<ExerciseLogEntry, 'exerciseId' | 'completedAt'>[],
  today: DateKey,
): Map<string, FavoriteInfo> {
  const from = addDays(today, -(FAVORITE_WINDOW_DAYS - 1));
  const result = new Map<string, FavoriteInfo>(
    exercises.map((e) => [e.id, { score: 0, plans: 0, completions: 0, lastUsed: null }]),
  );
  for (const plan of plans) {
    for (const id of new Set(plan.exerciseIds)) {
      const info = result.get(id);
      if (info) info.plans += 1;
    }
  }
  for (const entry of log) {
    const info = result.get(entry.exerciseId);
    const day = isoToDateKey(entry.completedAt);
    if (!info || !day || day > today) continue;
    if (!info.lastUsed || day > info.lastUsed) info.lastUsed = day;
    if (day >= from) info.completions += 1;
  }
  for (const info of result.values()) info.score = info.plans + info.completions;
  return result;
}

/** C18: IDs der Favoriten in Rangfolge (höchster Wert zuerst, bei Gleichstand zuletzt genutzt, dann Name). */
export function favoriteIds(
  exercises: Pick<Exercise, 'id' | 'name'>[],
  scores: Map<string, FavoriteInfo>,
  max = FAVORITE_MAX,
  minScore = FAVORITE_MIN_SCORE,
): string[] {
  return exercises
    .filter((e) => (scores.get(e.id)?.score ?? 0) >= minScore)
    .sort((a, b) => {
      const sa = scores.get(a.id)!;
      const sb = scores.get(b.id)!;
      return (
        sb.score - sa.score ||
        (sb.lastUsed ?? '').localeCompare(sa.lastUsed ?? '') ||
        a.name.localeCompare(b.name, 'de')
      );
    })
    .slice(0, max)
    .map((e) => e.id);
}
