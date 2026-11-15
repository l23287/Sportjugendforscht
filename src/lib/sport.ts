import type { Sport, SportId } from '../types';

// C1: Vorauswahl von 25 Sportarten.
// Grundlage: DOSB-Bestandserhebung 2025 (Rangliste der Spitzenverbände nach Mitgliedschaften).
// Übernommen wurden die mitgliederstärksten Sportarten, in denen Vereinstraining mit
// Trainingsplänen und Übungen üblich ist. Nicht aufgenommen wurden Verbände ohne eigene
// Sportart im Trainingssinn (z. B. Behinderten-/Betriebssportverbände, DLRG).
// "Beach Volleyball" bleibt zusätzlich zu "Volleyball" erhalten, da es bereits vor C1
// auswählbar war und bestehende Nutzer:innen es gespeichert haben können.
// Die IDs sind stabile Slugs und dürfen NICHT geändert werden (Zuordnung von Daten ab C5).
// C2: Jede Sportart hat eine Akzentfarbe für die Umrandung des Sporticons. Auswahlregeln:
//  - Farbe passt zur Sportart, wo naheliegend (Basketball orange, Tischtennis rot, Fußball grün, Schwimmen blau …)
//  - Sportarten mit gleichem Emoji sind über die Farbe unterscheidbar (Volleyball/Beach Volleyball, Judo/Karate)
//  - Kontrast mindestens 3:1 (WCAG 2.1, 1.4.11 Nicht-Text-Kontrast) gegen alle Hintergründe der App
//    (#0a0f1c, #111a2c, #16223c, #223353) – geprüft, siehe docs/chunks/C2.md
export const PRESET_SPORTS: Sport[] = [
  // Ballsport
  { id: 'fussball', name: 'Fußball', emoji: '⚽', color: '#22c55e', category: 'Ballsport', custom: false },
  { id: 'handball', name: 'Handball', emoji: '🤾', color: '#60a5fa', category: 'Ballsport', custom: false },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', color: '#f97316', category: 'Ballsport', custom: false },
  { id: 'volleyball', name: 'Volleyball', emoji: '🏐', color: '#facc15', category: 'Ballsport', custom: false },
  { id: 'beach-volleyball', name: 'Beach Volleyball', emoji: '🏐', color: '#2dd4bf', category: 'Ballsport', custom: false },
  { id: 'hockey', name: 'Hockey', emoji: '🏑', color: '#818cf8', category: 'Ballsport', custom: false },
  // Rückschlagsport
  { id: 'tischtennis', name: 'Tischtennis', emoji: '🏓', color: '#ef4444', category: 'Rückschlagsport', custom: false },
  { id: 'tennis', name: 'Tennis', emoji: '🎾', color: '#bef264', category: 'Rückschlagsport', custom: false },
  { id: 'badminton', name: 'Badminton', emoji: '🏸', color: '#e2e8f0', category: 'Rückschlagsport', custom: false },
  // Turnen & Tanz
  { id: 'turnen', name: 'Turnen', emoji: '🤸', color: '#c084fc', category: 'Turnen & Tanz', custom: false },
  { id: 'tanzen', name: 'Tanzen', emoji: '💃', color: '#f472b6', category: 'Turnen & Tanz', custom: false },
  // Kampfsport
  { id: 'judo', name: 'Judo', emoji: '🥋', color: '#f8fafc', category: 'Kampfsport', custom: false },
  { id: 'karate', name: 'Karate', emoji: '🥋', color: '#fde047', category: 'Kampfsport', custom: false },
  // Ausdauer
  { id: 'leichtathletik', name: 'Leichtathletik', emoji: '🏃', color: '#fb7185', category: 'Ausdauer', custom: false },
  { id: 'radsport', name: 'Radsport', emoji: '🚴', color: '#fbbf24', category: 'Ausdauer', custom: false },
  { id: 'triathlon', name: 'Triathlon', emoji: '🏅', color: '#a78bfa', category: 'Ausdauer', custom: false },
  { id: 'skisport', name: 'Skisport', emoji: '⛷️', color: '#bae6fd', category: 'Ausdauer', custom: false },
  // Wassersport
  { id: 'schwimmen', name: 'Schwimmen', emoji: '🏊', color: '#38bdf8', category: 'Wassersport', custom: false },
  { id: 'kanu', name: 'Kanu', emoji: '🛶', color: '#34d399', category: 'Wassersport', custom: false },
  { id: 'rudern', name: 'Rudern', emoji: '🚣', color: '#67e8f9', category: 'Wassersport', custom: false },
  { id: 'segeln', name: 'Segeln', emoji: '⛵', color: '#f1f5f9', category: 'Wassersport', custom: false },
  // Outdoor & Präzision
  { id: 'reiten', name: 'Reiten', emoji: '🏇', color: '#d6a26a', category: 'Outdoor & Präzision', custom: false },
  { id: 'golf', name: 'Golf', emoji: '⛳', color: '#4ade80', category: 'Outdoor & Präzision', custom: false },
  { id: 'schiesssport', name: 'Schießsport', emoji: '🎯', color: '#fb923c', category: 'Outdoor & Präzision', custom: false },
  { id: 'klettern', name: 'Klettern & Bergsport', emoji: '🧗', color: '#a8a29e', category: 'Outdoor & Präzision', custom: false },
];

export const DEFAULT_SPORT_ID: SportId = 'tischtennis';

// C1: Neutrales Standard-Symbol für eigene Sportarten.
// C2: Wird nur noch verwendet, wenn beim Anlegen kein Symbol gewählt wurde bzw. für Altdaten aus C1.
export const CUSTOM_SPORT_EMOJI = '🏅';

// C2: Auswahl an Symbolen für eigene Sportarten. Bewusst eine feste Liste statt freier Eingabe,
// damit keine beliebigen Zeichen/Texte als Icon gespeichert werden.
export const CUSTOM_SPORT_EMOJIS: string[] = [
  '🏅', '🏆', '🥏', '⚽', '🏀', '🎾', '🏃', '🚴',
  '🏊', '🥊', '🤺', '🏋️', '🧘', '⛸️', '🛹', '🎳',
];

// C2: Farbauswahl für eigene Sportarten. Feste, vorab auf Kontrast geprüfte Palette (≥ 3:1 auf allen
// App-Hintergründen) statt freier Farbwahl – so entsteht kein unsichtbares „Dunkel auf Dunkel“.
export const CUSTOM_SPORT_COLORS: { value: string; label: string }[] = [
  { value: '#f87171', label: 'Rot' },
  { value: '#fb923c', label: 'Orange' },
  { value: '#facc15', label: 'Gelb' },
  { value: '#4ade80', label: 'Grün' },
  { value: '#2dd4bf', label: 'Türkis' },
  { value: '#38bdf8', label: 'Hellblau' },
  { value: '#60a5fa', label: 'Blau' },
  { value: '#a78bfa', label: 'Violett' },
  { value: '#f472b6', label: 'Pink' },
  { value: '#cbd5e1', label: 'Grau' },
];

// C2: Standardfarbe für eigene Sportarten ohne Auswahl bzw. Altdaten aus C1 (gespeichert ohne Farbe).
export const CUSTOM_SPORT_DEFAULT_COLOR = '#a78bfa';

// C2: Nur Werte aus den festen Listen werden akzeptiert (Schutz gegen manipulierte/veraltete localStorage-Daten).
export function isAllowedCustomEmoji(emoji: unknown): emoji is string {
  return typeof emoji === 'string' && CUSTOM_SPORT_EMOJIS.includes(emoji);
}

export function isAllowedCustomColor(color: unknown): color is string {
  return typeof color === 'string' && CUSTOM_SPORT_COLORS.some((c) => c.value === color);
}

// C2: Aussehen einer eigenen Sportart (Symbol + Farbe).
export interface SportAppearance {
  emoji: string;
  color: string;
}

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
    const { id, name, emoji, color } = entry as Partial<Sport>;
    if (typeof id !== 'string' || typeof name !== 'string') continue;
    const cleaned = cleanSportName(name).slice(0, SPORT_NAME_MAX_LENGTH);
    const normalized = normalizeSportName(cleaned);
    if (!cleaned || seen.has(normalized)) continue;
    seen.add(normalized);
    // C2: Symbol und Farbe übernehmen, falls gültig – sonst Standardwerte (z. B. für Altdaten aus C1).
    result.push({
      id,
      name: cleaned,
      emoji: isAllowedCustomEmoji(emoji) ? emoji : CUSTOM_SPORT_EMOJI,
      color: isAllowedCustomColor(color) ? color : CUSTOM_SPORT_DEFAULT_COLOR,
      category: 'Eigene',
      custom: true,
    });
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

// C3: Das Aufschlagtraining gibt es nur für Tischtennis. Geprüft wird über die stabile ID (nicht den Namen);
// seit C1 kann keine eigene Sportart „Tischtennis“ angelegt werden (Duplikatprüfung), die Prüfung ist eindeutig.
export const SERVE_TRAINING_SPORT_ID: SportId = 'tischtennis';

export function hasServeTraining(sport: Pick<Sport, 'id'>): boolean {
  return sport.id === SERVE_TRAINING_SPORT_ID;
}
