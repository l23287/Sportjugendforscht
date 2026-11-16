import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Exercise,
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
import { migrateSportId } from '../lib/sport';
// C7: Uhrzeit und Wiederholung defensiv einlesen.
import { sanitizeRecurrence, sanitizeTime } from '../lib/recurrence';

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
  /** C5: Anzahl Pläne/Übungen einer Sportart (für den Löschdialog eigener Sportarten). */
  countSportData: (sportId: SportId) => { plans: number; exercises: number };
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
      sportId: migrateSportId(plan.sportId),
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
      sportId: migrateSportId(exercise.sportId),
    }));
  });
  const [serveSessions, setServeSessions] = useState<ServeSession[]>(() => loadJSON('serveSessions', []));

  useEffect(() => saveJSON('plans', plans), [plans]);
  useEffect(() => saveJSON('exercises', exercises), [exercises]);
  useEffect(() => saveJSON('serveSessions', serveSessions), [serveSessions]);

  // C5: Zentrale Filterung nach aktiver Sportart – keine Seite muss selbst filtern, keine kann es vergessen.
  const sportPlans = useMemo(() => plans.filter((p) => p.sportId === activeSportId), [plans, activeSportId]);
  const sportExercises = useMemo(
    () => exercises.filter((e) => e.sportId === activeSportId),
    [exercises, activeSportId],
  );

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
      }),
      deleteSportData: (sportId) => {
        setPlans((prev) => prev.filter((p) => p.sportId !== sportId));
        setExercises((prev) => prev.filter((e) => e.sportId !== sportId));
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
  }, [plans, exercises, sportPlans, sportExercises, activeSportId, serveSessions]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
