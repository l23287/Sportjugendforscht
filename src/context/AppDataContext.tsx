import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
// C9: Gültige Schwierigkeitsgrade für die Migration.
import { DIFFICULTIES, type Difficulty } from '../types';
import type {
  CoreGoal,
  Exercise,
  ExerciseLogEntry,
  StopwatchValue,
  StrengthSet,
  ExerciseInput,
  PlanInput,
  ServeResult,
  ServeSession,
  ServeSessionGoal,
  SportId,
  TrainingPlan,
} from '../types';
import { generateId } from '../lib/id';
import { loadJSON, saveJSON } from '../lib/storage';
// C4: Umrechnung gespeicherter Übungen von Minuten auf Sekunden.
import { migrateDurationSeconds } from '../lib/time';
// C5: Pläne/Übungen werden nach der aktiven Sportart getrennt.
import { useSport } from './SportContext';
import { loadSportIdRemap, migrateSportId } from '../lib/sport';
// C11: Sätze/Gewichte einlesen.
import { sanitizeStrength } from '../lib/strength';
// C12: Gespeicherte Stoppuhr-Werte.
import { MAX_STOPWATCH_VALUES, cleanStopwatchName, sanitizeStopwatchValues, validateStopwatchName } from '../lib/stopwatch';
// C7: Uhrzeit und Wiederholung defensiv einlesen.
import { sanitizeRecurrence, sanitizeTime } from '../lib/recurrence';
// C8: Kernziele.
import { MAX_CORE_GOALS, cleanGoalText, sanitizeCoreGoals, validateGoalText } from '../lib/coreGoals';

// C8: Ergebnis beim Anlegen/Ändern eines Kernziels (Fehlertext für die UI).
export type GoalResult = { ok: true } | { ok: false; error: string };
export interface GoalInput {
  text: string;
  dueDate: string | null;
}

interface AppDataContextValue {
  /** C5: Nur die Pläne der AKTIVEN Sportart. Alle Seiten lesen hierüber und sind so automatisch getrennt. */
  plans: TrainingPlan[];
  /** C5: Nur die Übungen der AKTIVEN Sportart. */
  exercises: Exercise[];
  addPlan: (input: PlanInput) => TrainingPlan;
  updatePlan: (id: string, input: PlanInput) => void;
  deletePlan: (id: string) => void;
  getPlan: (id: string) => TrainingPlan | undefined;
  addExercise: (input: ExerciseInput) => Exercise;
  updateExercise: (id: string, input: ExerciseInput) => void;
  deleteExercise: (id: string) => void;
  getExercise: (id: string) => Exercise | undefined;
  /** C5: Sportart eines Plans – auch wenn er zu einer anderen als der aktiven Sportart gehört (für Weiterleitungen). */
  getPlanSportId: (id: string) => SportId | undefined;
  /** C5: Anzahl Pläne/Übungen einer Sportart (für den Löschdialog eigener Sportarten). C8: plus Kernziele. */
  countSportData: (sportId: SportId) => { plans: number; exercises: number; goals: number; stopwatchValues: number };
  /** C8: Kernziele der AKTIVEN Sportart in ihrer Reihenfolge (höchstens drei). */
  goals: CoreGoal[];
  addGoal: (input: GoalInput) => GoalResult;
  updateGoal: (id: string, input: GoalInput) => GoalResult;
  toggleGoalAchieved: (id: string) => void;
  deleteGoal: (id: string) => void;
  moveGoal: (id: string, direction: -1 | 1) => void;
  /** C11: Abschluss-Einträge ausgeführter Übungen der AKTIVEN Sportart (neueste zuerst) – Grundlage für C14. */
  exerciseLog: ExerciseLogEntry[];
  /** C11: Übung als beendet protokollieren (Timer abgelaufen bzw. alle Sätze erledigt). */
  logExerciseCompleted: (exerciseId: string, planId: string | null, sets: StrengthSet[] | null) => void;
  /** C11: Neue Gewichte aus der Ausführung in die Vorlage übernehmen (nur Gewichte, Wiederholungen bleiben). */
  applyStrengthWeights: (exerciseId: string, weights: number[]) => void;
  /** C12: Gespeicherte Stoppuhr-Werte der AKTIVEN Sportart (neueste zuerst, höchstens 10). */
  stopwatchValues: StopwatchValue[];
  addStopwatchValue: (name: string, ms: number) => GoalResult;
  renameStopwatchValue: (id: string, name: string) => GoalResult;
  deleteStopwatchValue: (id: string) => void;
  /** C5: Löscht alle Pläne und Übungen einer Sportart (beim Löschen einer eigenen Sportart). */
  deleteSportData: (sportId: SportId) => void;
  serveSessions: ServeSession[];
  startServeSession: (goal: ServeSessionGoal) => ServeSession;
  addServeAttempt: (sessionId: string, result: ServeResult) => void;
  endServeSession: (sessionId: string) => void;
  deleteServeSession: (id: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  // C5: SportProvider liegt in App.tsx außerhalb von AppDataProvider – die aktive Sportart ist hier verfügbar.
  const { sport } = useSport();
  const activeSportId = sport.id;

  // C5: Im State liegen weiterhin ALLE Pläne/Übungen (alle Sportarten); nach außen wird gefiltert (siehe unten).
  // Migration: Einträge ohne `sportId` (vor C5) werden Tischtennis zugeordnet.
  const [plans, setPlans] = useState<TrainingPlan[]>(() => {
    const stored = loadJSON<unknown>('plans', []);
    if (!Array.isArray(stored)) return [];
    return (stored as TrainingPlan[]).map((plan) => ({
      ...plan,
      // C11: inkl. Umleitung zusammengeführter eigener Sportarten.
      sportId: migrateSportId(plan.sportId, loadSportIdRemap()),
      // C7: Pläne vor C7 haben weder Uhrzeit noch Wiederholung → null. Eine Wiederholung ohne Startdatum ist ungültig.
      time: sanitizeTime(plan.time),
      recurrence: plan.date ? sanitizeRecurrence(plan.recurrence) : null,
    }));
  });
  // C4: Beim Laden wird jede Übung auf `durationSeconds` umgestellt; das alte Feld `durationMinutes` entfällt
  // und wird beim nächsten Speichern nicht mehr geschrieben.
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const stored = loadJSON<unknown>('exercises', []);
    // C4: Absicherung gegen beschädigte Daten (kein Array) – die Migration darf die App nicht zum Absturz bringen.
    if (!Array.isArray(stored)) return [];
    return (stored as (Exercise & { durationMinutes?: unknown })[]).map(({ durationMinutes, ...exercise }) => ({
      ...exercise,
      durationSeconds: migrateDurationSeconds({ durationSeconds: exercise.durationSeconds, durationMinutes }),
      // C5: Sportart ergänzen (vor C5 nicht vorhanden → Tischtennis).
      sportId: migrateSportId(exercise.sportId, loadSportIdRemap()),
      // C11: Sätze/Gewichte (nur bei Gym-Übungen vorhanden, sonst null).
      strength: sanitizeStrength(exercise.strength),
      // C9: Schwierigkeitsgrad ist optional; Unbekanntes → null („ohne Angabe“) statt falscher Einordnung.
      difficulty: DIFFICULTIES.includes(exercise.difficulty as Difficulty) ? exercise.difficulty : null,
    }));
  });
  const [serveSessions, setServeSessions] = useState<ServeSession[]>(() => loadJSON('serveSessions', []));
  // C8: Alle Kernziele aller Sportarten (Reihenfolge im Array = Reihenfolge je Sportart).
  // C11: inkl. Umleitung zusammengeführter eigener Sportarten.
  const [coreGoals, setCoreGoals] = useState<CoreGoal[]>(() => {
    const remap = loadSportIdRemap();
    return sanitizeCoreGoals(loadJSON<unknown>('coreGoals', [])).map((g) => ({ ...g, sportId: remap.get(g.sportId) ?? g.sportId }));
  });

  useEffect(() => saveJSON('plans', plans), [plans]);
  useEffect(() => saveJSON('exercises', exercises), [exercises]);
  useEffect(() => saveJSON('serveSessions', serveSessions), [serveSessions]);
  useEffect(() => saveJSON('coreGoals', coreGoals), [coreGoals]);

  // C11: Protokoll beendeter Übungen (alle Sportarten; nach außen gefiltert).
  const [exerciseLog, setExerciseLog] = useState<ExerciseLogEntry[]>(() => {
    const stored = loadJSON<unknown>('exerciseLog', []);
    return Array.isArray(stored) ? (stored as ExerciseLogEntry[]).filter((e) => e && typeof e.exerciseId === 'string') : [];
  });
  useEffect(() => saveJSON('exerciseLog', exerciseLog), [exerciseLog]);

  // C12: Stoppuhr-Werte aller Sportarten (inkl. Umleitung zusammengeführter eigener Sportarten aus C11).
  const [stopwatchValues, setStopwatchValues] = useState<StopwatchValue[]>(() => {
    const remap = loadSportIdRemap();
    return sanitizeStopwatchValues(loadJSON<unknown>('stopwatchValues', [])).map((v) => ({
      ...v,
      sportId: remap.get(v.sportId) ?? v.sportId,
    }));
  });
  useEffect(() => saveJSON('stopwatchValues', stopwatchValues), [stopwatchValues]);
  const sportStopwatchValues = useMemo(
    () => stopwatchValues.filter((v) => v.sportId === activeSportId),
    [stopwatchValues, activeSportId],
  );

  // C5: Zentrale Filterung nach aktiver Sportart – keine Seite muss selbst filtern, keine kann es vergessen.
  const sportPlans = useMemo(() => plans.filter((p) => p.sportId === activeSportId), [plans, activeSportId]);
  const sportExercises = useMemo(
    () => exercises.filter((e) => e.sportId === activeSportId),
    [exercises, activeSportId],
  );

  // C8: Zentrale Filterung wie bei Plänen/Übungen (C5).
  const sportGoals = useMemo(() => coreGoals.filter((g) => g.sportId === activeSportId), [coreGoals, activeSportId]);

  const value = useMemo<AppDataContextValue>(() => {
    // C5: Ein Plan darf nur Übungen seiner eigenen Sportart enthalten (Schutz gegen fremde IDs).
    const keepOwnSportExercises = (exerciseIds: string[], sportId: SportId) =>
      exerciseIds.filter((eid) => exercises.some((e) => e.id === eid && e.sportId === sportId));

    return {
      plans: sportPlans,
      exercises: sportExercises,
      addPlan: (input) => {
        // C5: Neuer Plan gehört automatisch zur aktiven Sportart.
        const plan: TrainingPlan = {
          ...input,
          exerciseIds: keepOwnSportExercises(input.exerciseIds, activeSportId),
          sportId: activeSportId,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        setPlans((prev) => [plan, ...prev]);
        return plan;
      },
      updatePlan: (id, input) => {
        // C5: `sportId` bleibt beim Bearbeiten immer erhalten (wird nicht aus dem Formular übernommen).
        setPlans((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, ...input, exerciseIds: keepOwnSportExercises(input.exerciseIds, p.sportId), sportId: p.sportId }
              : p,
          ),
        );
      },
      deletePlan: (id) => {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      },
      // C5: Nur Pläne der aktiven Sportart sind direkt abrufbar.
      getPlan: (id) => sportPlans.find((p) => p.id === id),
      addExercise: (input) => {
        const exercise: Exercise = {
          ...input,
          // C5: Neue Übung gehört automatisch zur aktiven Sportart.
          sportId: activeSportId,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        setExercises((prev) => [exercise, ...prev]);
        return exercise;
      },
      updateExercise: (id, input) => {
        // C5: `sportId` bleibt beim Bearbeiten immer erhalten.
        setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...input, sportId: e.sportId } : e)));
      },
      deleteExercise: (id) => {
        setExercises((prev) => prev.filter((e) => e.id !== id));
        setPlans((prev) =>
          prev.map((p) => ({ ...p, exerciseIds: p.exerciseIds.filter((eid) => eid !== id) })),
        );
      },
      // C5: Nur Übungen der aktiven Sportart sind direkt abrufbar.
      getExercise: (id) => sportExercises.find((e) => e.id === id),
      getPlanSportId: (id) => plans.find((p) => p.id === id)?.sportId,
      countSportData: (sportId) => ({
        plans: plans.filter((p) => p.sportId === sportId).length,
        exercises: exercises.filter((e) => e.sportId === sportId).length,
        goals: coreGoals.filter((g) => g.sportId === sportId).length,
        stopwatchValues: stopwatchValues.filter((v) => v.sportId === sportId).length,
      }),
      deleteSportData: (sportId) => {
        setPlans((prev) => prev.filter((p) => p.sportId !== sportId));
        setExercises((prev) => prev.filter((e) => e.sportId !== sportId));
        // C8: Kernziele einer gelöschten eigenen Sportart werden mitgelöscht.
        setCoreGoals((prev) => prev.filter((g) => g.sportId !== sportId));
        // C11: … ebenso ihr Übungsprotokoll.
        setExerciseLog((prev) => prev.filter((e) => e.sportId !== sportId));
        // C12: … und ihre Stoppuhr-Werte.
        setStopwatchValues((prev) => prev.filter((v) => v.sportId !== sportId));
      },
      // C12: Stoppuhr-Werte – Obergrenze 10 je Sportart; bei 10 wird nichts überschrieben (Abstimmung im Team).
      stopwatchValues: sportStopwatchValues,
      addStopwatchValue: (name, ms) => {
        if (sportStopwatchValues.length >= MAX_STOPWATCH_VALUES) {
          return { ok: false, error: `Es sind höchstens ${MAX_STOPWATCH_VALUES} Werte möglich.` };
        }
        const error = validateStopwatchName(name);
        if (error) return { ok: false, error };
        const value: StopwatchValue = {
          id: generateId(),
          sportId: activeSportId,
          name: cleanStopwatchName(name),
          ms: Math.max(0, Math.round(ms)),
          recordedAt: new Date().toISOString(),
        };
        setStopwatchValues((prev) => [value, ...prev]);
        return { ok: true };
      },
      renameStopwatchValue: (id, name) => {
        const error = validateStopwatchName(name);
        if (error) return { ok: false, error };
        setStopwatchValues((prev) => prev.map((v) => (v.id === id ? { ...v, name: cleanStopwatchName(name) } : v)));
        return { ok: true };
      },
      deleteStopwatchValue: (id) => setStopwatchValues((prev) => prev.filter((v) => v.id !== id)),
      // C11: Protokoll und Gewichtsübernahme.
      exerciseLog: exerciseLog.filter((e) => e.sportId === activeSportId),
      logExerciseCompleted: (exerciseId, planId, sets) => {
        const entry: ExerciseLogEntry = {
          id: generateId(),
          exerciseId,
          sportId: exercises.find((e) => e.id === exerciseId)?.sportId ?? activeSportId,
          planId,
          completedAt: new Date().toISOString(),
          sets,
        };
        setExerciseLog((prev) => [entry, ...prev]);
      },
      applyStrengthWeights: (exerciseId, weights) => {
        setExercises((prev) =>
          prev.map((e) =>
            e.id === exerciseId && e.strength
              ? { ...e, strength: { ...e.strength, sets: e.strength.sets.map((set, i) => ({ ...set, weightKg: weights[i] ?? set.weightKg })) } }
              : e,
          ),
        );
      },
      // C8: Kernziele – immer nur innerhalb der aktiven Sportart.
      goals: sportGoals,
      addGoal: (input) => {
        if (sportGoals.length >= MAX_CORE_GOALS) return { ok: false, error: `Es sind höchstens ${MAX_CORE_GOALS} Kernziele möglich.` };
        const error = validateGoalText(input.text, sportGoals);
        if (error) return { ok: false, error };
        const goal: CoreGoal = {
          id: generateId(),
          sportId: activeSportId,
          text: cleanGoalText(input.text),
          dueDate: input.dueDate,
          achieved: false,
          createdAt: new Date().toISOString(),
        };
        setCoreGoals((prev) => [...prev, goal]);
        return { ok: true };
      },
      updateGoal: (id, input) => {
        const error = validateGoalText(input.text, sportGoals, id);
        if (error) return { ok: false, error };
        setCoreGoals((prev) =>
          prev.map((g) => (g.id === id ? { ...g, text: cleanGoalText(input.text), dueDate: input.dueDate } : g)),
        );
        return { ok: true };
      },
      toggleGoalAchieved: (id) => {
        setCoreGoals((prev) => prev.map((g) => (g.id === id ? { ...g, achieved: !g.achieved } : g)));
      },
      deleteGoal: (id) => {
        setCoreGoals((prev) => prev.filter((g) => g.id !== id));
      },
      // C8: Reihenfolge innerhalb der Sportart tauschen (Ziel 1 = wichtigstes).
      moveGoal: (id, direction) => {
        setCoreGoals((prev) => {
          const own = prev.filter((g) => g.sportId === activeSportId);
          const index = own.findIndex((g) => g.id === id);
          const target = index + direction;
          if (index < 0 || target < 0 || target >= own.length) return prev;
          [own[index], own[target]] = [own[target], own[index]];
          return [...prev.filter((g) => g.sportId !== activeSportId), ...own];
        });
      },
      serveSessions,
      startServeSession: (goal) => {
        const session: ServeSession = {
          ...goal,
          id: generateId(),
          attempts: [],
          startedAt: new Date().toISOString(),
          endedAt: null,
        };
        setServeSessions((prev) => [session, ...prev]);
        return session;
      },
      addServeAttempt: (sessionId, result) => {
        setServeSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  attempts: [...session.attempts, { id: generateId(), result, createdAt: new Date().toISOString() }],
                }
              : session,
          ),
        );
      },
      endServeSession: (sessionId) => {
        setServeSessions((prev) =>
          prev.map((session) => (session.id === sessionId ? { ...session, endedAt: new Date().toISOString() } : session)),
        );
      },
      deleteServeSession: (id) => {
        setServeSessions((prev) => prev.filter((session) => session.id !== id));
      },
    };
  }, [plans, exercises, sportPlans, sportExercises, activeSportId, serveSessions, coreGoals, sportGoals, exerciseLog, stopwatchValues, sportStopwatchValues]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
