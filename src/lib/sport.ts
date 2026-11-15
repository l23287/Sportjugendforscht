import type { Sport, SportId } from '../types';

// C1: Vorauswahl von 25 Sportarten.
// Grundlage: DOSB-Bestandserhebung 2025 (Rangliste der Spitzenverbände nach Mitgliedschaften).
// Übernommen wurden die mitgliederstärksten Sportarten, in denen Vereinstraining mit
// Trainingsplänen und Übungen üblich ist. Nicht aufgenommen wurden Verbände ohne eigene
// Sportart im Trainingssinn (z. B. Behinderten-/Betriebssportverbände, DLRG).
// "Beach Volleyball" bleibt zusätzlich zu "Volleyball" erhalten, da es bereits vor C1
// auswählbar war und bestehende Nutzer:innen es gespeichert haben können.
// Die IDs sind stabile Slugs und dürfen NICHT geändert werden (Zuordnung von Daten ab C5).
export const PRESET_SPORTS: Sport[] = [
  // Ballsport
  { id: 'fussball', name: 'Fußball', emoji: '⚽', category: 'Ballsport', custom: false },
  { id: 'handball', name: 'Handball', emoji: '🤾', category: 'Ballsport', custom: false },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', category: 'Ballsport', custom: false },
  { id: 'volleyball', name: 'Volleyball', emoji: '🏐', category: 'Ballsport', custom: false },
  { id: 'beach-volleyball', name: 'Beach Volleyball', emoji: '🏐', category: 'Ballsport', custom: false },
  { id: 'hockey', name: 'Hockey', emoji: '🏑', category: 'Ballsport', custom: false },
  // Rückschlagsport
  { id: 'tischtennis', name: 'Tischtennis', emoji: '🏓', category: 'Rückschlagsport', custom: false },
  { id: 'tennis', name: 'Tennis', emoji: '🎾', category: 'Rückschlagsport', custom: false },
  { id: 'badminton', name: 'Badminton', emoji: '🏸', category: 'Rückschlagsport', custom: false },
  // Turnen & Tanz
  { id: 'turnen', name: 'Turnen', emoji: '🤸', category: 'Turnen & Tanz', custom: false },
  { id: 'tanzen', name: 'Tanzen', emoji: '💃', category: 'Turnen & Tanz', custom: false },
  // Kampfsport
  { id: 'judo', name: 'Judo', emoji: '🥋', category: 'Kampfsport', custom: false },
  { id: 'karate', name: 'Karate', emoji: '🥋', category: 'Kampfsport', custom: false },
  // Ausdauer
  { id: 'leichtathletik', name: 'Leichtathletik', emoji: '🏃', category: 'Ausdauer', custom: false },
  { id: 'radsport', name: 'Radsport', emoji: '🚴', category: 'Ausdauer', custom: false },
  { id: 'triathlon', name: 'Triathlon', emoji: '🏅', category: 'Ausdauer', custom: false },
  { id: 'skisport', name: 'Skisport', emoji: '⛷️', category: 'Ausdauer', custom: false },
  // Wassersport
  { id: 'schwimmen', name: 'Schwimmen', emoji: '🏊', category: 'Wassersport', custom: false },
  { id: 'kanu', name: 'Kanu', emoji: '🛶', category: 'Wassersport', custom: false },
  { id: 'rudern', name: 'Rudern', emoji: '🚣', category: 'Wassersport', custom: false },
  { id: 'segeln', name: 'Segeln', emoji: '⛵', category: 'Wassersport', custom: false },
  // Outdoor & Präzision
  { id: 'reiten', name: 'Reiten', emoji: '🏇', category: 'Outdoor & Präzision', custom: false },
  { id: 'golf', name: 'Golf', emoji: '⛳', category: 'Outdoor & Präzision', custom: false },
  { id: 'schiesssport', name: 'Schießsport', emoji: '🎯', category: 'Outdoor & Präzision', custom: false },
  { id: 'klettern', name: 'Klettern & Bergsport', emoji: '🧗', category: 'Outdoor & Präzision', custom: false },
];

export const DEFAULT_SPORT_ID: SportId = 'tischtennis';

// C1: Neutrales Symbol für eigene Sportarten, bis C2 eigene Symbole/Farben einführt.
export const CUSTOM_SPORT_EMOJI = '🏅';

// C1: Höchstlänge für eigene Sportarten (Kopfzeile/Sidebar schneiden lange Namen ab).
export const SPORT_NAME_MAX_LENGTH = 30;

// C1: Vereinheitlicht einen Namen für den Duplikatvergleich:
// Leerzeichen trimmen/zusammenfassen, Groß-/Kleinschreibung ignorieren.
export function normalizeSportName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE');
}

// C1: Bereinigt die Eingabe für die Anzeige (trimmen, Mehrfach-Leerzeichen entfernen).
export function cleanSportName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

// C1: Prüft einen neuen Sportart-Namen. Gibt eine Fehlermeldung zurück oder null, wenn gültig.
export function validateSportName(name: string, existing: Sport[]): string | null {
  const cleaned = cleanSportName(name);
  if (!cleaned) return 'Bitte gib einen Namen für die Sportart ein.';
  if (cleaned.length > SPORT_NAME_MAX_LENGTH) {
    return `Der Name darf höchstens ${SPORT_NAME_MAX_LENGTH} Zeichen lang sein.`;
  }
  const normalized = normalizeSportName(cleaned);
  const duplicate = existing.find((sport) => normalizeSportName(sport.name) === normalized);
  if (duplicate) return `„${duplicate.name}“ gibt es bereits.`;
  return null;
}

// C1: Liest gespeicherte eigene Sportarten defensiv ein (localStorage kann manipuliert oder veraltet sein).
export function sanitizeCustomSports(value: unknown): Sport[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set(PRESET_SPORTS.map((sport) => normalizeSportName(sport.name)));
  const result: Sport[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const { id, name } = entry as Partial<Sport>;
    if (typeof id !== 'string' || typeof name !== 'string') continue;
    const cleaned = cleanSportName(name).slice(0, SPORT_NAME_MAX_LENGTH);
    const normalized = normalizeSportName(cleaned);
    if (!cleaned || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push({ id, name: cleaned, emoji: CUSTOM_SPORT_EMOJI, category: 'Eigene', custom: true });
  }
  return result;
}

// C1: Migration – vor C1 wurde der Sportart-NAME gespeichert (z. B. "Tischtennis").
// Ordnet einen solchen Namen der passenden ID zu; unbekannte Werte fallen auf den Standard zurück.
export function legacySportNameToId(name: unknown): SportId {
  if (typeof name !== 'string') return DEFAULT_SPORT_ID;
  const normalized = normalizeSportName(name);
  return PRESET_SPORTS.find((sport) => normalizeSportName(sport.name) === normalized)?.id ?? DEFAULT_SPORT_ID;
}
