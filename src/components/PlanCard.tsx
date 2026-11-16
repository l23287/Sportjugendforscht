import { Link } from 'react-router-dom';
import { ClipboardList, Clock, ListChecks, Pencil, Repeat, Trash2, Users } from 'lucide-react';
import type { Exercise, TrainingPlan } from '../types';
import { formatDuration } from '../lib/time';
// C6a: Status „Heute / Ausstehend / Vergangen“ statt „Überfällig“.
import { getPlanSchedule } from '../lib/planStatus';
// C7: Serien-Beschreibung.
import { describeRecurrence } from '../lib/recurrence';
import { PlanStatusBadge } from './PlanStatusBadge';
import { IconButton } from './IconButton';

interface PlanCardProps {
  plan: TrainingPlan;
  exercises: Exercise[];
  onEdit: () => void;
  onDelete: () => void;
}

export function PlanCard({ plan, exercises, onEdit, onDelete }: PlanCardProps) {
  const planExercises = plan.exerciseIds
    .map((exerciseId) => exercises.find((e) => e.id === exerciseId))
    .filter((e): e is Exercise => Boolean(e));
  // C4: Summe in Sekunden, erst danach formatieren.
  const totalSeconds = planExercises.reduce((sum, e) => sum + e.durationSeconds, 0);
  // C7: Bei Serien zählt der nächste (bzw. letzte) Termin – nicht das Startdatum.
  const schedule = getPlanSchedule(plan);
  const status = schedule?.status ?? null;

  return (
    <div
      className={`flex flex-col gap-4 rounded-3xl border bg-surface p-5 ${
        // C6a: Pläne des Tages heben sich mit Akzent-Rahmen hervor; vergangene sind neutral (nicht mehr rot).
        status === 'heute' ? 'border-accent/60' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_8px_18px_rgba(37,99,235,0.3)]">
          <ClipboardList size={22} />
        </div>
        {/* C6a: Status-Badge mit Datum (ersetzt das rote Datum bei überfälligen Plänen). */}
        {/* C7: Datum = nächster Termin der Serie, plus Uhrzeit. */}
        {schedule && <PlanStatusBadge status={schedule.status} date={schedule.date} time={plan.time} />}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 font-display text-lg font-bold text-ink">{plan.name}</h3>
        {plan.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{plan.description}</p>}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-2">
        <span className="inline-flex items-center gap-1">
          <ListChecks size={14} /> {planExercises.length} Übungen
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={14} /> {formatDuration(totalSeconds)}
        </span>
        {plan.targetGroup && (
          <span className="inline-flex items-center gap-1">
            <Users size={14} /> {plan.targetGroup}
          </span>
        )}
        {/* C7: Wiederholung in derselben Meta-Zeile wie Übungen/Dauer/Zielgruppe. */}
        {plan.recurrence && (
          <span className="inline-flex items-center gap-1">
            <Repeat size={14} /> {describeRecurrence(plan.recurrence, plan.date)}
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2">
        <Link
          to={`/plaene/${plan.id}`}
          className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-sm font-semibold text-white transition hover:brightness-110"
        >
          Anzeigen
        </Link>
        <IconButton icon={<Pencil size={16} />} label="Plan bearbeiten" onClick={onEdit} />
        <IconButton icon={<Trash2 size={16} />} label="Plan löschen" onClick={onDelete} />
      </div>
    </div>
  );
}
