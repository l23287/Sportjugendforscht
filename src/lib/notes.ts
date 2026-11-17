// C13: Regeln für Notizen zu Übungen (Ausführung → Plandetail).
import type { ExerciseNote } from '../types';

export const MAX_NOTE_LENGTH = 500;

/** C13: Text bereinigen – Ränder trimmen, Zeilenumbrüche bleiben erhalten (Notizen dürfen mehrzeilig sein). */
export function cleanNoteText(text: string): string {
  return text.replace(/\r\n/g, '\n').trim();
}

export function validateNoteText(text: string): string | null {
  const cleaned = cleanNoteText(text);
  if (!cleaned) return 'Die Notiz ist leer.';
  if (cleaned.length > MAX_NOTE_LENGTH) return `Eine Notiz darf höchstens ${MAX_NOTE_LENGTH} Zeichen lang sein.`;
  return null;
}

/** C13: Notizen einer Übung in einem Plan, neueste zuerst. */
export function notesForExercise(notes: ExerciseNote[], planId: string, exerciseId: string): ExerciseNote[] {
  return notes
    .filter((n) => n.planId === planId && n.exerciseId === exerciseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** C13: Gespeicherte Notizen defensiv einlesen (ungültige verwerfen, zu lange kürzen). */
export function sanitizeNotes(value: unknown): ExerciseNote[] {
  if (!Array.isArray(value)) return [];
  const result: ExerciseNote[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const n = entry as Partial<ExerciseNote>;
    if (typeof n.id !== 'string' || typeof n.planId !== 'string' || typeof n.exerciseId !== 'string') continue;
    if (typeof n.sportId !== 'string' || typeof n.text !== 'string') continue;
    const text = cleanNoteText(n.text).slice(0, MAX_NOTE_LENGTH);
    if (!text) continue;
    result.push({
      id: n.id,
      planId: n.planId,
      exerciseId: n.exerciseId,
      sportId: n.sportId,
      text,
      createdAt: typeof n.createdAt === 'string' ? n.createdAt : new Date().toISOString(),
      updatedAt: typeof n.updatedAt === 'string' ? n.updatedAt : null,
    });
  }
  return result;
}
