// C8: Regeln für Kernziele – Obergrenze, Textlänge, Prüfung und defensives Einlesen aus dem Speicher.
import type { CoreGoal } from '../types';
import { isDateKey } from './dateKey';

export const MAX_CORE_GOALS = 3;
export const CORE_GOAL_MAX_LENGTH = 80;

const normalize = (text: string) => text.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE');

/** C8: Text bereinigen (trimmen, Mehrfach-Leerzeichen zusammenfassen). */
export function cleanGoalText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * C8: Prüft einen Kernziel-Text gegen die übrigen Ziele derselben Sportart.
 * `ignoreId` = das Ziel, das gerade bearbeitet wird (darf seinen eigenen Text behalten).
 */
export function validateGoalText(text: string, goals: CoreGoal[], ignoreId?: string): string | null {
  const cleaned = cleanGoalText(text);
  if (!cleaned) return 'Bitte formuliere ein Kernziel.';
  if (cleaned.length > CORE_GOAL_MAX_LENGTH) return `Ein Kernziel darf höchstens ${CORE_GOAL_MAX_LENGTH} Zeichen lang sein.`;
  if (goals.some((g) => g.id !== ignoreId && normalize(g.text) === normalize(cleaned))) {
    return 'Dieses Kernziel gibt es bereits.';
  }
  return null;
}

/** C8: Gespeicherte Kernziele prüfen; je Sportart höchstens MAX_CORE_GOALS (die ersten in der gespeicherten Reihenfolge). */
export function sanitizeCoreGoals(value: unknown): CoreGoal[] {
  if (!Array.isArray(value)) return [];
  const perSport = new Map<string, number>();
  const result: CoreGoal[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const g = entry as Partial<CoreGoal>;
    if (typeof g.id !== 'string' || typeof g.sportId !== 'string' || typeof g.text !== 'string') continue;
    const text = cleanGoalText(g.text).slice(0, CORE_GOAL_MAX_LENGTH);
    if (!text) continue;
    const count = perSport.get(g.sportId) ?? 0;
    if (count >= MAX_CORE_GOALS) continue;
    perSport.set(g.sportId, count + 1);
    result.push({
      id: g.id,
      sportId: g.sportId,
      text,
      dueDate: isDateKey(g.dueDate) ? g.dueDate : null,
      achieved: g.achieved === true,
      createdAt: typeof g.createdAt === 'string' ? g.createdAt : new Date().toISOString(),
    });
  }
  return result;
}
