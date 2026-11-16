import { useState } from 'react';
// C5: Navigate für die Weiterleitung bei Plänen einer anderen Sportart.
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, Dumbbell, Pencil, Play, Repeat, Trash2, Users } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Timer } from '../components/Timer';
import { formatDuration } from '../lib/time';
// C6a: Status „Heute / Ausstehend / Vergangen“ statt „Überfällig“.
import { getPlanSchedule } from '../lib/planStatus';
// C7: Serien-Beschreibung.
import { describeRecurrence } from '../lib/recurrence';
import { PlanStatusBadge } from '../components/PlanStatusBadge';
import type { Exercise } from '../types';

export function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPlan, getPlanSportId, exercises, deletePlan } = useAppData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);

  const plan = id ? getPlan(id) : undefined;

  // C5: Gehört der Plan zu einer anderen Sportart (z. B. Lesezeichen, Zurück-Button nach Sportwechsel),
  // geht es zur Übersicht der aktiven Sportart – der Plan wird nicht angezeigt.
  // Existiert er gar nicht, bleibt der bisherige Hinweis „Plan nicht gefunden“.
  if (!plan && id && getPlanSportId(id)) return <Navigate to="/plaene" replace />;

  if (!plan) {
    return (
      <div className="flex flex-col gap-6">
        <IconButton icon={<ChevronLeft size={18} />} label="Zurück" onClick={() => navigate('/plaene')} />
        <EmptyState
          icon={<Dumbbell size={28} />}
          title="Plan nicht gefunden"
          description="Dieser Trainingsplan existiert nicht (mehr)."
          action={
            <PrimaryButton onClick={() => navigate('/plaene')}>Zurück zur Übersicht</PrimaryButton>
          }
        />
      </div>
    );
  }

  const planExercises = plan.exerciseIds
    .map((exerciseId) => exercises.find((e) => e.id === exerciseId))
    .filter((e): e is Exercise => Boolean(e));
  // C4: Summe in Sekunden, erst danach formatieren.
  const totalSeconds = planExercises.reduce((sum, e) => sum + e.durationSeconds, 0);
  // C7: Bei Serien zählt der nächste (bzw. letzte) Termin.
  const schedule = getPlanSchedule(plan);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-start gap-3">
        <IconButton
          icon={<ChevronLeft size={18} />}
          label="Zurück"
          onClick={() => navigate('/plaene')}
          className="mt-0.5 shrink-0"
        />
        <h1 className="min-w-0 flex-1 break-words font-display text-2xl font-extrabold text-ink sm:text-3xl">
          {plan.name}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <IconButton
            icon={<Pencil size={16} />}
            label="Plan bearbeiten"
            onClick={() => navigate(`/plaene/${plan.id}/bearbeiten`)}
          />
          <IconButton icon={<Trash2 size={16} />} label="Plan löschen" onClick={() => setConfirmDelete(true)} />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          {/* C6a: Status-Badge mit Datum. */}
          {schedule && <PlanStatusBadge status={schedule.status} date={schedule.date} time={plan.time} />}
          {/* C7: Wiederholung als eigener Chip im Stil der übrigen Info-Chips. */}
          {plan.recurrence && (
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted">
              <Repeat size={13} />
              {describeRecurrence(plan.recurrence, plan.date)}
            </span>
          )}
          {plan.targetGroup && (
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted">
              <Users size={13} />
              {plan.targetGroup}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-2xl bg-primary-soft px-3 py-1.5 text-xs font-semibold text-accent">
            <Clock size={13} />
            {formatDuration(totalSeconds)} gesamt · {planExercises.length} Übungen
          </span>
        </div>
        {plan.description && <p className="text-sm text-muted">{plan.description}</p>}
      </div>

      {planExercises.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={28} />}
          title="Noch keine Übungen im Plan"
          description="Füge über 'Bearbeiten' Übungen aus deinem Pool hinzu."
          action={
            <PrimaryButton
              icon={<Pencil size={16} />}
              onClick={() => navigate(`/plaene/${plan.id}/bearbeiten`)}
            >
              Plan bearbeiten
            </PrimaryButton>
          }
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {planExercises.map((exercise, index) => (
            <li
              key={exercise.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-nowrap"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-sm font-bold text-accent">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{exercise.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={exercise.difficulty} />
                  <span className="inline-flex items-center gap-1 text-xs text-muted-2">
                    {/* C4: Dauer sekundengenau in Uhrform. */}
                    <Clock size={13} /> {formatDuration(exercise.durationSeconds)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveExercise(exercise)}
                className="flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-dark px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition hover:brightness-110"
              >
                <Play size={16} />
                Start
              </button>
            </li>
          ))}
        </ol>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Plan löschen?"
        description={`„${plan.name}“ wird unwiderruflich gelöscht.`}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deletePlan(plan.id);
          navigate('/plaene');
        }}
      />

      {activeExercise && <Timer exercise={activeExercise} onClose={() => setActiveExercise(null)} />}
    </div>
  );
}
