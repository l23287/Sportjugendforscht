import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Sport, SportId } from '../types';
import {
  CUSTOM_SPORT_EMOJI,
  DEFAULT_SPORT_ID,
  PRESET_SPORTS,
  cleanSportName,
  legacySportNameToId,
  sanitizeCustomSports,
  validateSportName,
} from '../lib/sport';
import { loadJSON, saveJSON } from '../lib/storage';
import { generateId } from '../lib/id';

// C1: Ergebnis beim Hinzufügen einer eigenen Sportart (Erfolg oder Fehlermeldung für die UI).
export type AddSportResult = { ok: true; sport: Sport } | { ok: false; error: string };

interface SportContextValue {
  /** C1: Aktuell gewählte Sportart (vollständiges Objekt statt nur Name). */
  sport: Sport;
  /** C1: Alle verfügbaren Sportarten (Vorauswahl + eigene). */
  sports: Sport[];
  customSports: Sport[];
  /** C1: Wählt eine Sportart über ihre ID. */
  setSport: (id: SportId) => void;
  addCustomSport: (name: string) => AddSportResult;
  removeCustomSport: (id: SportId) => void;
}

const SportContext = createContext<SportContextValue | null>(null);

// C1: Startwert der gewählten Sportart inkl. Migration aus dem alten Speicherformat.
// Vor C1 lag unter 'trainerpro:sport' der Name (z. B. "Tischtennis"), jetzt unter 'trainerpro:sportId' die ID.
function loadInitialSportId(): SportId {
  const stored = loadJSON<SportId | null>('sportId', null);
  if (typeof stored === 'string') return stored;
  return legacySportNameToId(loadJSON<unknown>('sport', null));
}

export function SportProvider({ children }: { children: ReactNode }) {
  // C1: Eigene Sportarten werden getrennt von der festen Vorauswahl gespeichert.
  const [customSports, setCustomSports] = useState<Sport[]>(() =>
    sanitizeCustomSports(loadJSON<unknown>('customSports', [])),
  );
  const [sportId, setSportId] = useState<SportId>(loadInitialSportId);

  const sports = useMemo(() => [...PRESET_SPORTS, ...customSports], [customSports]);

  // C1: Fallback, falls die gespeicherte ID nicht (mehr) existiert, z. B. nach Löschen einer eigenen Sportart.
  const sport =
    sports.find((s) => s.id === sportId) ?? PRESET_SPORTS.find((s) => s.id === DEFAULT_SPORT_ID) ?? PRESET_SPORTS[0];

  useEffect(() => saveJSON('sportId', sport.id), [sport.id]);
  useEffect(() => saveJSON('customSports', customSports), [customSports]);
  // C1: Altes Speicherformat nach erfolgreicher Migration entfernen.
  useEffect(() => {
    try {
      localStorage.removeItem('trainerpro:sport');
    } catch {
      // Speicher nicht verfügbar – nichts zu tun.
    }
  }, []);

  const value = useMemo<SportContextValue>(
    () => ({
      sport,
      sports,
      customSports,
      // C1: Keine Prüfung gegen `sports` – direkt nach addCustomSport ist die neue Sportart dort noch
      // nicht enthalten (State-Update steht aus). Unbekannte IDs fängt der Fallback oben ab.
      setSport: (id) => setSportId(id),
      // C1: Validiert (leer, Länge, Duplikat ohne Groß-/Kleinschreibung) und legt eine eigene Sportart an.
      addCustomSport: (name) => {
        const error = validateSportName(name, sports);
        if (error) return { ok: false, error };
        const newSport: Sport = {
          id: `custom-${generateId()}`,
          name: cleanSportName(name),
          emoji: CUSTOM_SPORT_EMOJI,
          category: 'Eigene',
          custom: true,
        };
        setCustomSports((prev) => [...prev, newSport]);
        return { ok: true, sport: newSport };
      },
      // C1: Entfernt eine eigene Sportart. Ist sie aktiv, greift automatisch der Fallback auf die Standard-Sportart.
      // Hinweis für C5: Sobald Pläne/Übungen einer Sportart zugeordnet sind, muss hier über deren Verbleib entschieden werden.
      removeCustomSport: (id) => {
        setCustomSports((prev) => prev.filter((s) => s.id !== id));
        if (id === sport.id) setSportId(DEFAULT_SPORT_ID);
      },
    }),
    [sport, sports, customSports],
  );

  return <SportContext.Provider value={value}>{children}</SportContext.Provider>;
}

export function useSport(): SportContextValue {
  const ctx = useContext(SportContext);
  if (!ctx) throw new Error('useSport must be used within SportProvider');
  return ctx;
}
