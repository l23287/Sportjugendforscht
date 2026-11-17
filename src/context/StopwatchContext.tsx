// C12: Neuer Context – EINE Stoppuhr für die ganze App. Sie läuft weiter bei Reiter- oder Seitenwechsel und nach dem
// Neuladen (Zustand in localStorage). Der Übungsbereich zeigt am Reiter einen Punkt, solange sie läuft.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadJSON, saveJSON } from '../lib/storage';
import {
  INITIAL_STOPWATCH,
  elapsedMs,
  sanitizeStopwatchState,
  startStopwatch,
  stopStopwatch,
  type StopwatchState,
} from '../lib/stopwatch';

interface StopwatchContextValue {
  state: StopwatchState;
  running: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  /** Aktuelle Zeit in ms (für Speichern; die Anzeige aktualisiert sich selbst per requestAnimationFrame). */
  getElapsed: () => number;
}

const StopwatchContext = createContext<StopwatchContextValue | null>(null);

export function StopwatchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StopwatchState>(() => sanitizeStopwatchState(loadJSON<unknown>('stopwatch', null)));

  useEffect(() => saveJSON('stopwatch', state), [state]);

  const value = useMemo<StopwatchContextValue>(
    () => ({
      state,
      running: state.startedAt !== null,
      start: () => setState((s) => startStopwatch(s)),
      stop: () => setState((s) => stopStopwatch(s)),
      reset: () => setState(INITIAL_STOPWATCH),
      getElapsed: () => elapsedMs(state),
    }),
    [state],
  );

  return <StopwatchContext.Provider value={value}>{children}</StopwatchContext.Provider>;
}

export function useStopwatch(): StopwatchContextValue {
  const ctx = useContext(StopwatchContext);
  if (!ctx) throw new Error('useStopwatch must be used within StopwatchProvider');
  return ctx;
}
