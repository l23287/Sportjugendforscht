// C7: Wiederholungen – Termine werden nur BERECHNET (für einen Zeitraum), nie gespeichert.
// So kann eine Serie ohne Ende den Speicher nicht füllen, und Änderungen an der Regel wirken sofort überall.
//
// Zeitumstellung: Tage werden immer über den Kalender fortgezählt (`new Date(j, m, t + n)`), nie über
// Millisekunden (n × 24 h). An Umstellungstagen hat ein Tag 23 bzw. 25 Stunden – Millisekunden-Rechnung
// würde Termine dort auf den falschen Tag schieben.
import type { Recurrence, TrainingPlan } from '../types';
import { isDateKey, parseDateKey, toDateKey, type DateKey } from './dateKey';
import { formatDate } from './time';

export const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const MAX_WEEK_INTERVAL = 4;

/** C7: Wochentag eines DateKeys, 0 = Montag … 6 = Sonntag. */
export function weekdayOf(key: DateKey): number {
  return (parseDateKey(key).getDay() + 6) % 7;
}

/** C7: DateKey um n Kalendertage verschieben (zeitumstellungssicher). */
export function addDays(key: DateKey, days: number): DateKey {
  const d = parseDateKey(key);
  return toDateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
}

/** C7: Ganze Kalendertage zwischen zwei DateKeys (b − a); Math.round gleicht 23-/25-Stunden-Tage aus. */
export function daysBetween(a: DateKey, b: DateKey): number {
  return Math.round((parseDateKey(b).getTime() - parseDateKey(a).getTime()) / 86_400_000);
}

/** C7: Gespeicherte Regel defensiv einlesen (localStorage kann veraltet oder manipuliert sein). */
export function sanitizeRecurrence(value: unknown): Recurrence | null {
  if (!value || typeof value !== 'object') return null;
  const { freq, interval, weekdays, until, exceptions } = value as Partial<Recurrence>;
  if (freq !== 'weekly' && freq !== 'monthly') return null;
  const cleanUntil = isDateKey(until) ? until : null;
  // C7a: Ausgetragene Termine – nur gültige Daten, ohne Doppelte, sortiert (Regeln vor C7a haben keine → []).
  const cleanExceptions = Array.isArray(exceptions) ? [...new Set(exceptions.filter(isDateKey))].sort() : [];
  if (freq === 'monthly') return { freq, interval: 1, weekdays: [], until: cleanUntil, exceptions: cleanExceptions };
  const days = Array.isArray(weekdays)
    ? [...new Set(weekdays.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
    : [];
  if (days.length === 0) return null;
  const cleanInterval = Number.isInteger(interval) && interval! >= 1 ? Math.min(interval!, MAX_WEEK_INTERVAL) : 1;
  return { freq, interval: cleanInterval, weekdays: days, until: cleanUntil, exceptions: cleanExceptions };
}

/** C7: Uhrzeit „HH:MM“ prüfen. */
export function sanitizeTime(value: unknown): string | null {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : null;
}

/**
 * C7: Alle Termine eines Plans im Zeitraum [fromKey, toKey] (sortiert).
 * Ohne Wiederholung: nur `plan.date`. Mit Wiederholung: ab `plan.date` (Start) bis `until` bzw. Zeitraumende.
 */
export function occurrencesInRange(
  plan: Pick<TrainingPlan, 'date' | 'recurrence'>,
  fromKey: DateKey,
  toKey: DateKey,
): DateKey[] {
  const start = plan.date;
  if (!start || !isDateKey(start)) return [];
  const rule = plan.recurrence;
  if (!rule) return start >= fromKey && start <= toKey ? [start] : [];

  const from = start > fromKey ? start : fromKey;
  const to = rule.until && rule.until < toKey ? rule.until : toKey;
  if (from > to) return [];

  const result: DateKey[] = [];
  if (rule.freq === 'weekly') {
    // Wochen werden ab dem Montag der Startwoche gezählt; bei „jede 2. Woche“ zählt nur jede 2. Woche.
    const anchor = addDays(start, -weekdayOf(start));
    const firstWeek = Math.max(0, Math.floor(daysBetween(anchor, from) / 7));
    for (let week = firstWeek; ; week++) {
      const monday = addDays(anchor, week * 7);
      if (monday > to) break;
      if (week % rule.interval !== 0) continue;
      for (const wd of rule.weekdays) {
        const day = addDays(monday, wd);
        if (day >= from && day <= to) result.push(day);
      }
    }
  } else {
    // Monatlich am Tag des Starttermins; Monate ohne diesen Tag (z. B. 31.) werden übersprungen.
    const s = parseDateKey(start);
    const dayOfMonth = s.getDate();
    const f = parseDateKey(from);
    let year = f.getFullYear();
    let month = f.getMonth();
    for (;;) {
      const candidate = new Date(year, month, dayOfMonth);
      const firstOfMonth = toDateKey(new Date(year, month, 1));
      if (firstOfMonth > to) break;
      if (candidate.getMonth() === month) {
        const key = toDateKey(candidate);
        if (key >= from && key <= to) result.push(key);
      }
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
  }
  // C7a: Ausgetragene Termine überspringen. Dadurch berücksichtigen auch nächster/letzter Termin und der Status
  // automatisch die Ausnahmen.
  if (rule.exceptions.length === 0) return result;
  const skipped = new Set(rule.exceptions);
  return result.filter((day) => !skipped.has(day));
}

/** C7a: Ergänzt einen ausgetragenen Termin (ohne Doppelte, sortiert). */
export function withException(rule: Recurrence, day: DateKey): Recurrence {
  return { ...rule, exceptions: [...new Set([...rule.exceptions, day])].sort() };
}

/** C7a: Entfernt einen ausgetragenen Termin wieder (= Termin wiederherstellen). */
export function withoutException(rule: Recurrence, day: DateKey): Recurrence {
  return { ...rule, exceptions: rule.exceptions.filter((d) => d !== day) };
}

/** C7: Nächster Termin ab (einschließlich) `fromKey` – Suche begrenzt auf gut zwei Jahre. */
export function nextOccurrence(plan: Pick<TrainingPlan, 'date' | 'recurrence'>, fromKey: DateKey): DateKey | null {
  return occurrencesInRange(plan, fromKey, addDays(fromKey, 800))[0] ?? null;
}

/** C7: Letzter Termin vor `beforeKey` (für beendete Serien / vergangene Pläne). */
export function lastOccurrenceBefore(plan: Pick<TrainingPlan, 'date' | 'recurrence'>, beforeKey: DateKey): DateKey | null {
  if (!plan.date || !isDateKey(plan.date)) return null;
  const list = occurrencesInRange(plan, plan.date, addDays(beforeKey, -1));
  return list[list.length - 1] ?? null;
}

/** C7: Lesbare Beschreibung, z. B. „Wöchentlich · Mo, Do“, „Alle 2 Wochen · Di · bis 31.03.2027“, „Monatlich am 16.“ */
export function describeRecurrence(rule: Recurrence, startKey: string | null): string {
  let text: string;
  if (rule.freq === 'weekly') {
    const days = rule.weekdays.map((d) => WEEKDAY_SHORT[d]).join(', ');
    text = `${rule.interval === 1 ? 'Wöchentlich' : `Alle ${rule.interval} Wochen`} · ${days}`;
  } else {
    const day = startKey && isDateKey(startKey) ? parseDateKey(startKey).getDate() : null;
    text = day ? `Monatlich am ${day}.` : 'Monatlich';
  }
  return rule.until ? `${text} · bis ${formatDate(rule.until)}` : text;
}
