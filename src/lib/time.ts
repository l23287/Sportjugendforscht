// C4: Höchstdauer einer Übung: 3 Stunden (Abstimmung im Team).
export const MAX_DURATION_SECONDS = 3 * 60 * 60;

// C4: Standarddauer für neue Übungen und für fehlerhafte Altdaten (15 Minuten wie bisher).
export const DEFAULT_DURATION_SECONDS = 15 * 60;

const pad2 = (value: number) => String(value).padStart(2, '0');

// C4: Zerlegt Sekunden in Stunden/Minuten/Sekunden (immer ganze, nicht-negative Zahlen).
export function splitSeconds(totalSeconds: number): { hours: number; minutes: number; seconds: number } {
  const clamped = Math.max(0, Math.round(totalSeconds));
  return {
    hours: Math.floor(clamped / 3600),
    minutes: Math.floor((clamped % 3600) / 60),
    seconds: clamped % 60,
  };
}

// C4: Dauer in Uhrform (Abstimmung im Team), überall in der App einheitlich:
//   45 s → "0:45 Min." · 90 s → "1:30 Min." · 15 min → "15:00 Min." · 65 min → "1:05:00 Std."
// Vorher: nur ganze Minuten ("15 Min.", "1 Std. 5 Min.").
export function formatDuration(totalSeconds: number): string {
  const { hours, minutes, seconds } = splitSeconds(totalSeconds);
  if (hours === 0) return `${minutes}:${pad2(seconds)} Min.`;
  return `${hours}:${pad2(minutes)}:${pad2(seconds)} Std.`;
}

// C4: Timer-Anzeige; ab einer Stunde mit Stundenstelle ("1:05:00" statt "65:00").
export function formatCountdown(totalSeconds: number): string {
  const { hours, minutes, seconds } = splitSeconds(totalSeconds);
  if (hours === 0) return `${pad2(minutes)}:${pad2(seconds)}`;
  return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
}

// C4: Migration – vor C4 wurde `durationMinutes` (ganze Minuten) gespeichert. Liefert die Dauer in Sekunden:
// gültiges `durationSeconds` hat Vorrang, sonst wird `durationMinutes` umgerechnet, sonst Standardwert.
// Bestehende Werte über 3 Std. werden NICHT gekürzt (keine stillen Datenänderungen); die Grenze gilt bei der Eingabe.
export function migrateDurationSeconds(entry: { durationSeconds?: unknown; durationMinutes?: unknown }): number {
  const { durationSeconds, durationMinutes } = entry;
  if (typeof durationSeconds === 'number' && Number.isFinite(durationSeconds) && durationSeconds > 0) {
    return Math.round(durationSeconds);
  }
  if (typeof durationMinutes === 'number' && Number.isFinite(durationMinutes) && durationMinutes > 0) {
    return Math.round(durationMinutes * 60);
  }
  return DEFAULT_DURATION_SECONDS;
}

function startOfDay(date: Date): number {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return startOfDay(new Date(dateStr)) < startOfDay(new Date());
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// C4: Prüft die Eingabe aus den Feldern „Min.“ und „Sek.“ und liefert die Dauer in Sekunden oder eine Fehlermeldung.
// Regeln: nur ganze Zahlen · leeres Feld = 0 · Sekunden 0–59 · Gesamtdauer > 0 · höchstens 3 Std. (180:00 Min.).
export type DurationParseResult = { ok: true; seconds: number } | { ok: false; error: string };

export function parseDurationInput(minutesText: string, secondsText: string): DurationParseResult {
  const minutesRaw = minutesText.trim();
  const secondsRaw = secondsText.trim();
  if (!/^\d*$/.test(minutesRaw) || !/^\d*$/.test(secondsRaw)) {
    return { ok: false, error: 'Bitte gib für Minuten und Sekunden nur ganze Zahlen ein.' };
  }
  const minutes = minutesRaw === '' ? 0 : Number(minutesRaw);
  const seconds = secondsRaw === '' ? 0 : Number(secondsRaw);
  if (seconds > 59) return { ok: false, error: 'Die Sekunden müssen zwischen 0 und 59 liegen.' };
  const total = minutes * 60 + seconds;
  if (total <= 0) return { ok: false, error: 'Die Dauer muss größer als 0:00 Min. sein.' };
  if (total > MAX_DURATION_SECONDS) {
    return { ok: false, error: `Die Dauer darf höchstens ${formatDuration(MAX_DURATION_SECONDS)} betragen.` };
  }
  return { ok: true, seconds: total };
}
