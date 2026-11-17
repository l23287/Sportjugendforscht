// C11: Regeln und Anzeige für Sätze, Gewichte und Satzpausen (Gym).
// Lehre aus C4: Eingaben werden NICHT still bereinigt – ungültige Zeichen führen zu einer klaren Meldung.
import type { StrengthSet, StrengthSpec } from '../types';
import { formatDuration, splitSeconds } from './time';

export const MAX_SETS = 10;
export const MAX_REPS = 100;
export const MAX_WEIGHT_KG = 500;
/** C11: Gewichte in 0,5-kg-Schritten (kleinste übliche Hantelscheibe 0,25 kg je Seite). */
export const WEIGHT_STEP_KG = 0.5;
/** C11: Schritt der − / + Buttons in der Ausführung (eine 1,25-kg-Scheibe je Seite). */
export const WEIGHT_BUTTON_STEP_KG = 2.5;
export const MAX_REST_SECONDS = 10 * 60;
export const DEFAULT_STRENGTH: StrengthSpec = {
  sets: [
    { reps: 10, weightKg: 0 },
    { reps: 10, weightKg: 0 },
    { reps: 10, weightKg: 0 },
  ],
  restSeconds: 90,
};

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** C11: Gewicht „42,5“ oder „42.5“ (kg); leer = 0 (Körpergewicht). */
export function parseWeightInput(text: string): ParseResult<number> {
  const raw = text.trim().replace(',', '.');
  if (raw === '') return { ok: true, value: 0 };
  if (!/^\d+(\.\d+)?$/.test(raw)) return { ok: false, error: 'Bitte gib das Gewicht als Zahl ein, z. B. 42,5.' };
  const value = Number(raw);
  if (value > MAX_WEIGHT_KG) return { ok: false, error: `Das Gewicht darf höchstens ${MAX_WEIGHT_KG} kg betragen.` };
  if (Math.abs(value / WEIGHT_STEP_KG - Math.round(value / WEIGHT_STEP_KG)) > 1e-9) {
    return { ok: false, error: 'Bitte gib das Gewicht in 0,5-kg-Schritten an, z. B. 42,5.' };
  }
  return { ok: true, value };
}

/** C11: Wiederholungen – ganze Zahl 1–100. */
export function parseRepsInput(text: string): ParseResult<number> {
  const raw = text.trim();
  if (!/^\d+$/.test(raw)) return { ok: false, error: 'Bitte gib die Wiederholungen als ganze Zahl ein.' };
  const value = Number(raw);
  if (value < 1 || value > MAX_REPS) return { ok: false, error: `Wiederholungen: 1 bis ${MAX_REPS}.` };
  return { ok: true, value };
}

/** C11: Satzpause „Min. : Sek.“ – wie die Dauer (C4), aber 0 ist erlaubt (keine Pause), max. 10:00. */
export function parseRestInput(minutesText: string, secondsText: string): ParseResult<number> {
  const m = minutesText.trim();
  const s = secondsText.trim();
  if (!/^\d*$/.test(m) || !/^\d*$/.test(s)) return { ok: false, error: 'Bitte gib die Satzpause in ganzen Zahlen ein.' };
  const seconds = s === '' ? 0 : Number(s);
  if (seconds > 59) return { ok: false, error: 'Die Sekunden der Satzpause müssen zwischen 0 und 59 liegen.' };
  const total = (m === '' ? 0 : Number(m)) * 60 + seconds;
  if (total > MAX_REST_SECONDS) return { ok: false, error: 'Die Satzpause darf höchstens 10:00 Min. betragen.' };
  return { ok: true, value: total };
}

/** C11: „42,5 kg“ bzw. „Körpergewicht“ bei 0. */
export function formatWeight(kg: number): string {
  if (kg === 0) return 'Körpergewicht';
  return `${kg.toLocaleString('de-DE', { maximumFractionDigits: 1 })} kg`;
}

/** C11: Gewicht als Eingabetext („42,5“, leer bei 0). */
export function weightToInput(kg: number): string {
  return kg === 0 ? '' : kg.toLocaleString('de-DE', { maximumFractionDigits: 1, useGrouping: false });
}

/** C11: Satzpause in Felder zerlegen (für das Formular). */
export function restToInputs(totalSeconds: number): { min: string; sec: string } {
  const { hours, minutes, seconds } = splitSeconds(totalSeconds);
  return { min: String(hours * 60 + minutes), sec: String(seconds).padStart(2, '0') };
}

/**
 * C11: Kurzbeschreibung für Karten und Listen:
 *   gleiche Sätze  → „3 × 10 · 40 kg · Pause 1:30 Min.“
 *   unterschiedlich → „3 Sätze · 8–12 Wdh. · 30–40 kg · Pause 1:30 Min.“
 */
export function summarizeStrength(spec: StrengthSpec): string {
  const { sets } = spec;
  const reps = sets.map((s) => s.reps);
  const weights = sets.map((s) => s.weightKg);
  const sameReps = reps.every((r) => r === reps[0]);
  const sameWeight = weights.every((w) => w === weights[0]);
  const parts: string[] = [];
  if (sameReps) parts.push(`${sets.length} × ${reps[0]}`);
  else parts.push(`${sets.length} Sätze · ${Math.min(...reps)}–${Math.max(...reps)} Wdh.`);
  if (sameWeight) parts.push(formatWeight(weights[0]));
  // C11: Spannen immer als Zahlen („0–20 kg“), auch wenn ein Satz mit Körpergewicht dabei ist.
  else {
    const num = (kg: number) => kg.toLocaleString('de-DE', { maximumFractionDigits: 1 });
    parts.push(`${num(Math.min(...weights))}–${num(Math.max(...weights))} kg`);
  }
  if (spec.restSeconds > 0) parts.push(`Pause ${formatDuration(spec.restSeconds)}`);
  return parts.join(' · ');
}

/** C11: Gespeicherte Vorlage defensiv einlesen (ungültig → null). */
export function sanitizeStrength(value: unknown): StrengthSpec | null {
  if (!value || typeof value !== 'object') return null;
  const { sets, restSeconds } = value as Partial<StrengthSpec>;
  if (!Array.isArray(sets)) return null;
  const clean: StrengthSet[] = sets
    .filter((s): s is StrengthSet => !!s && typeof s === 'object')
    .map((s) => ({
      reps: Number.isInteger(s.reps) && s.reps >= 1 ? Math.min(s.reps, MAX_REPS) : 10,
      weightKg:
        typeof s.weightKg === 'number' && Number.isFinite(s.weightKg) && s.weightKg >= 0
          ? Math.min(Math.round(s.weightKg / WEIGHT_STEP_KG) * WEIGHT_STEP_KG, MAX_WEIGHT_KG)
          : 0,
    }))
    .slice(0, MAX_SETS);
  if (clean.length === 0) return null;
  const rest =
    typeof restSeconds === 'number' && Number.isFinite(restSeconds) && restSeconds >= 0
      ? Math.min(Math.round(restSeconds), MAX_REST_SECONDS)
      : DEFAULT_STRENGTH.restSeconds;
  return { sets: clean, restSeconds: rest };
}

/** C11: Gewicht in der Ausführung um einen Schritt ändern (nie unter 0 / über Maximum). */
export function stepWeight(kg: number, direction: 1 | -1): number {
  const next = Math.round((kg + direction * WEIGHT_BUTTON_STEP_KG) * 10) / 10;
  return Math.min(Math.max(next, 0), MAX_WEIGHT_KG);
}
