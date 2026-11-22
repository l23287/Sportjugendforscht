// C17: Pläne duplizieren – reine Regeln ohne React (testbar).
// Abstimmung im Team: Name mit Zusatz „(Kopie)“, Wiederholung standardmäßig NICHT übernehmen (sonst doppelte Termine
// in Kalender/Startseite und sinkende Planerfüllung aus C14).
import type { PlanInput, TrainingPlan } from '../types';
import { isDateKey } from './dateKey';
import { getPlanSchedule } from './planStatus';

const COPY_SUFFIX = /\s*\(Kopie(?:\s+\d+)?\)\s*$/i;

/**
 * C17: Freier Name für die Kopie: „Name (Kopie)“, bei Bedarf „Name (Kopie 2)“, „(Kopie 3)“ …
 * Eine Kopie einer Kopie wird nicht zu „(Kopie) (Kopie)“, sondern zählt weiter. Vergleich ohne Groß-/Kleinschreibung.
 */
export function copyName(name: string, existingNames: string[]): string {
  const base = name.replace(COPY_SUFFIX, '').trim() || name.trim();
  const taken = new Set(existingNames.map((n) => n.trim().toLocaleLowerCase('de-DE')));
  let candidate = `${base} (Kopie)`;
  for (let n = 2; taken.has(candidate.toLocaleLowerCase('de-DE')); n += 1) candidate = `${base} (Kopie ${n})`;
  return candidate;
}

/** C17: Vorbelegtes Datum im Dialog – der maßgebliche Termin des Originals (bei Serien der nächste bzw. letzte). */
export function defaultCopyDate(plan: Pick<TrainingPlan, 'date' | 'recurrence'>): string {
  return getPlanSchedule(plan)?.date ?? (plan.date && isDateKey(plan.date) ? plan.date : '');
}

export interface CopyOptions {
  name: string;
  /** JJJJ-MM-TT oder leer = ohne Datum. */
  date: string;
  /** C17: Wiederholung übernehmen (Standard: nein). Ausgetragene Einzeltermine (C7a) werden nie übernommen. */
  keepRecurrence: boolean;
}

/**
 * C17: Eingabe für den neuen Plan. Übernommen: Beschreibung, Zielgruppe, Übungen (Reihenfolge, als VERWEIS – keine
 * doppelten Übungen im Pool), Uhrzeit, optional Wiederholung. Nicht übernommen (gehören zum Original): Notizen (C13),
 * Trainingsverlauf (C11), ausgetragene Termine (C7a), ID und Erstelldatum.
 */
export function copyPlanInput(plan: TrainingPlan, options: CopyOptions): PlanInput {
  const date = isDateKey(options.date) ? options.date : null;
  const recurrence = options.keepRecurrence && plan.recurrence && date ? { ...plan.recurrence, exceptions: [] } : null;
  return {
    name: options.name.trim(),
    description: plan.description,
    targetGroup: plan.targetGroup,
    exerciseIds: [...plan.exerciseIds],
    date,
    time: plan.time,
    recurrence,
  };
}
