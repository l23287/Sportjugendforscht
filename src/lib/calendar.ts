// C6: Kalenderlogik (ohne UI) – Monatsraster, Termine je Tag und deutsche Beschriftungen.
// Bewusst getrennt von der Seite, damit C7 (Uhrzeit + Wiederholungen) nur `getCalendarEntries()` erweitern muss.
import type { TrainingPlan } from '../types';
import { parseDateKey, toDateKey, type DateKey } from './dateKey';
// C7: Termine (inkl. Wiederholungen) berechnen.
import { occurrencesInRange } from './recurrence';

/** C6: Ein Tag im Monatsraster. */
export interface CalendarDay {
  key: DateKey;
  dayOfMonth: number;
  /** false = Tag aus dem Vor- oder Folgemonat (wird gedimmt angezeigt). */
  inMonth: boolean;
}

/** C6: Wochentage, Woche beginnt am Montag (deutsche Konvention, DIN 1355 / ISO 8601). */
export const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/**
 * C6: Monatsraster mit immer 6 Wochen (42 Tage), damit die Höhe beim Blättern nicht springt.
 * `month` ist 0-basiert (0 = Januar) wie bei `Date`.
 */
export function getMonthGrid(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month, 1);
  // getDay(): 0 = Sonntag … 6 = Samstag → auf Montag = 0 umrechnen.
  const offset = (first.getDay() + 6) % 7;
  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    // Date normalisiert Über-/Unterläufe selbst (z. B. Tag 0 = letzter Tag des Vormonats).
    const date = new Date(year, month, 1 - offset + i);
    days.push({ key: toDateKey(date), dayOfMonth: date.getDate(), inMonth: date.getMonth() === month });
  }
  return days;
}

/**
 * C6: Termine im Zeitraum [fromKey, toKey] nach Tag gruppiert.
 * C7: Ein Plan kann jetzt mehrere Termine haben (Wiederholung) – berechnet über occurrencesInRange().
 *     Sortierung je Tag: zuerst nach Uhrzeit (Pläne ohne Uhrzeit am Ende), dann nach Name.
 */
export function getCalendarEntries(plans: TrainingPlan[], fromKey: DateKey, toKey: DateKey): Map<DateKey, TrainingPlan[]> {
  const entries = new Map<DateKey, TrainingPlan[]>();
  for (const plan of plans) {
    for (const day of occurrencesInRange(plan, fromKey, toKey)) {
      const list = entries.get(day) ?? [];
      list.push(plan);
      entries.set(day, list);
    }
  }
  for (const list of entries.values()) {
    list.sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99') || a.name.localeCompare(b.name, 'de'));
  }
  return entries;
}

/** C6: „November 2026“ */
export function formatMonthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

/** C6: „Montag, 16. November 2026“ – für Überschrift des gewählten Tages und Screenreader. */
export function formatLongDay(key: DateKey): string {
  return parseDateKey(key).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** C6: Monat um `delta` verschieben (über Jahresgrenzen hinweg). */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}
