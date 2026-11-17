// C12: Stoppuhr-Logik. Die Zeit wird aus ZEITSTEMPELN berechnet (Startzeitpunkt + bereits gelaufene Zeit), nicht durch
// Hochzählen – so bleibt sie genau, auch wenn der Browser im Hintergrund drosselt oder das Handy gesperrt ist, und
// läuft nach Seitenwechsel oder Neuladen korrekt weiter. Anzeige auf Hundertstel (Abstimmung im Team).
import type { StopwatchValue } from '../types';

export const MAX_STOPWATCH_VALUES = 10;
export const STOPWATCH_NAME_MAX_LENGTH = 40;

/** C12: Zustand der Stoppuhr. Läuft, solange startedAt gesetzt ist (Zeitstempel in ms seit 1970). */
export interface StopwatchState {
  startedAt: number | null;
  accumulatedMs: number;
}

export const INITIAL_STOPWATCH: StopwatchState = { startedAt: null, accumulatedMs: 0 };

export function elapsedMs(state: StopwatchState, now: number = Date.now()): number {
  return state.accumulatedMs + (state.startedAt !== null ? Math.max(0, now - state.startedAt) : 0);
}

export function startStopwatch(state: StopwatchState, now: number = Date.now()): StopwatchState {
  return state.startedAt !== null ? state : { ...state, startedAt: now };
}

export function stopStopwatch(state: StopwatchState, now: number = Date.now()): StopwatchState {
  return state.startedAt === null ? state : { startedAt: null, accumulatedMs: elapsedMs(state, now) };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * C12: „mm:ss,hh“ (z. B. „00:12,34“), ab einer Stunde „h:mm:ss,hh“. Hundertstel werden ABGESCHNITTEN, nicht gerundet –
 * wie bei Stoppuhren üblich (12,349 s → 12,34).
 */
export function formatStopwatch(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 10)); // Hundertstel
  const hundredths = total % 100;
  const totalSeconds = Math.floor(total / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const base = `${pad2(minutes)}:${pad2(seconds)},${pad2(hundredths)}`;
  return hours > 0 ? `${hours}:${base}` : base;
}

/** C12: Namen prüfen (Pflicht, max. 40 Zeichen). Gleiche Namen sind erlaubt („Sprint“ mehrmals gemessen). */
export function validateStopwatchName(name: string): string | null {
  const cleaned = name.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'Bitte gib dem Wert einen Namen.';
  if (cleaned.length > STOPWATCH_NAME_MAX_LENGTH) {
    return `Der Name darf höchstens ${STOPWATCH_NAME_MAX_LENGTH} Zeichen lang sein.`;
  }
  return null;
}

export function cleanStopwatchName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** C12: ID des Bestwerts (kürzeste Zeit) – bei Gleichstand der zuerst gemessene. Ab zwei Werten, sonst null. */
export function bestValueId(values: StopwatchValue[]): string | null {
  if (values.length < 2) return null;
  const best = [...values].sort((a, b) => a.ms - b.ms || a.recordedAt.localeCompare(b.recordedAt))[0];
  return best.id;
}

/** C12: Gespeicherten Zustand defensiv einlesen. */
export function sanitizeStopwatchState(value: unknown): StopwatchState {
  if (!value || typeof value !== 'object') return INITIAL_STOPWATCH;
  const { startedAt, accumulatedMs } = value as Partial<StopwatchState>;
  return {
    startedAt: typeof startedAt === 'number' && Number.isFinite(startedAt) && startedAt <= Date.now() ? startedAt : null,
    accumulatedMs: typeof accumulatedMs === 'number' && Number.isFinite(accumulatedMs) && accumulatedMs >= 0 ? accumulatedMs : 0,
  };
}

/** C12: Gespeicherte Werte prüfen; je Sportart höchstens 10 (die ersten in der gespeicherten Reihenfolge). */
export function sanitizeStopwatchValues(value: unknown): StopwatchValue[] {
  if (!Array.isArray(value)) return [];
  const perSport = new Map<string, number>();
  const result: StopwatchValue[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const v = entry as Partial<StopwatchValue>;
    if (typeof v.id !== 'string' || typeof v.sportId !== 'string' || typeof v.name !== 'string') continue;
    if (typeof v.ms !== 'number' || !Number.isFinite(v.ms) || v.ms < 0) continue;
    const name = cleanStopwatchName(v.name).slice(0, STOPWATCH_NAME_MAX_LENGTH);
    if (!name) continue;
    const count = perSport.get(v.sportId) ?? 0;
    if (count >= MAX_STOPWATCH_VALUES) continue;
    perSport.set(v.sportId, count + 1);
    result.push({
      id: v.id,
      sportId: v.sportId,
      name,
      ms: Math.round(v.ms),
      recordedAt: typeof v.recordedAt === 'string' ? v.recordedAt : new Date().toISOString(),
    });
  }
  return result;
}
