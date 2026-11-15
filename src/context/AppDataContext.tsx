import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Exercise,
  ExerciseInput,
  PlanInput,
  ServeResult,
  ServeSession,
  ServeSessionGoal,
  TrainingPlan,
} from '../types';
import { generateId } from '../lib/id';
import { loadJSON, saveJSON } from '../lib/storage';
// C4: Umrechnung gespeicherter Übungen von Minuten auf Sekunden.
import { migrateDurationSeconds } from '../lib/time';

interface AppDataContextValue {
  plans: TrainingPlan[];
  exercises: Exercise[];
  addPlan: (input: PlanInput) => TrainingPlan;
  updatePlan: (id: string, input: PlanInput) => void;
  deletePlan: (id: string) => void;
  getPlan: (id: string) => TrainingPlan | undefined;
  addExercise: (input: ExerciseInput) => Exercise;
  updateExercise: (id: string, input: ExerciseInput) => void;
  deleteExercise: (id: string) => void;
  getExercise: (id: string) => Exercise | undefined;
  serveSessions: ServeSession[];
  startServeSession: (goal: ServeSessionGoal) => ServeSession;
  addServeAttempt: (sessionId: string, result: ServeResult) => void;
  endServeSession: (sessionId: string) => void;
  deleteServeSession: (id: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<TrainingPlan[]>(() => loadJSON('plans', []));
  // C4: Beim Laden wird jede Übung auf `durationSeconds` umgestellt; das alte Feld `durationMinutes` entfällt
  // und wird beim nächsten Speichern nicht mehr geschrieben.
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const stored = loadJSON<unknown>('exercises', []);
    // C4: Absicherung gegen beschädigte Daten (kein Array) – die Migration darf die App nicht zum Absturz bringen.
    if (!Array.isArray(stored)) return [];
    return (stored as (Exercise & { durationMinutes?: unknown })[]).map(({ durationMinutes, ...exercise }) => ({
      ...exercise,
      durationSeconds: migrateDurationSeconds({ durationSeconds: exercise.durationSeconds, durationMinutes }),
    }));
  });
  const [serveSessions, setServeSessions] = useState<ServeSession[]>(() => loadJSON('serveSessions', []));

  useEffect(() => saveJSON('plans', plans), [plans]);
  useEffect(() => saveJSON('exercises', exercises), [exercises]);
  useEffect(() => saveJSON('serveSessions', serveSessions), [serveSessions]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      plans,
      exercises,
      addPlan: (input) => {
        const plan: TrainingPlan = { ...input, id: generateId(), createdAt: new Date().toISOString() };
        setPlans((prev) => [plan, ...prev]);
        return plan;
      },
      updatePlan: (id, input) => {
        setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...input } : p)));
      },
      deletePlan: (id) => {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      },
      getPlan: (id) => plans.find((p) => p.id === id),
      addExercise: (input) => {
        const exercise: Exercise = {
          ...input,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        setExercises((prev) => [exercise, ...prev]);
        return exercise;
      },
      updateExercise: (id, input) => {
        setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...input } : e)));
      },
      deleteExercise: (id) => {
        setExercises((prev) => prev.filter((e) => e.id !== id));
        setPlans((prev) =>
          prev.map((p) => ({ ...p, exerciseIds: p.exerciseIds.filter((eid) => eid !== id) })),
        );
      },
      getExercise: (id) => exercises.find((e) => e.id === id),
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
    }),
    [plans, exercises, serveSessions],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
