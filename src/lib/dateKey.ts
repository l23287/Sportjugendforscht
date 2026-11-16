// C6: Zeitzonensichere Datums-Helfer. Ein Kalendertag wird als reiner Text „JJJJ-MM-TT“ (DateKey) behandelt –
// genau das Format, das <input type="date"> liefert und das in `plan.date` gespeichert ist.
//
// Hintergrund: `new Date('2026-11-16')` liest der Browser als UTC-Mitternacht. In Zeitzonen westlich von UTC
// ergibt das lokal den 15.11. – ein Termin würde im Kalender einen Tag zu früh erscheinen. Deshalb werden
// DateKeys nie über `new Date(text)` gelesen, sondern immer über `parseDateKey()` (lokale Mitternacht).

export type DateKey = string;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad2 = (value: number) => String(value).padStart(2, '0');

/** C6: Prüft, ob ein Text ein gültiger DateKey ist (Format UND echtes Datum, z. B. kein 2026-02-30). */
export function isDateKey(value: unknown): value is DateKey {
  if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) return false;
  const date = parseDateKey(value);
  return toDateKey(date) === value;
}

/** C6: Lokales Datum → „JJJJ-MM-TT“. */
export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** C6: „JJJJ-MM-TT“ → lokales Datum (Mitternacht in der Zeitzone des Geräts). */
export function parseDateKey(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** C6: Heutiger Tag als DateKey (lokal). */
export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}
