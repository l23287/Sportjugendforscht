import { useState } from 'react';
// C5: Navigate für die Weiterleitung bei Plänen einer anderen Sportart.
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, Download, Dumbbell, Loader2, Pencil, Play, Repeat, StickyNote, Trash2, Users } from 'lucide-react';
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
// C11: Satz-Ansicht für Gym-Übungen + Kurzbeschreibung + Protokoll.
import { StrengthSession } from '../components/StrengthSession';
import { StrengthSummary } from '../components/StrengthSummary';
// C13: Notizen aus der Ausführung.
import { PlanExerciseNotes } from '../components/PlanExerciseNotes';
// C15: Pfeil im Notizen-Chip.
import { CollapseChevron } from '../components/Collapsible';
// C9: Schalter „Zielgruppe“.
import { useTrainerFeatures } from '../context/TrainerFeaturesContext';
import { PlanStatusBadge } from '../components/PlanStatusBadge';
import type { Exercise } from '../types';
// C16: Plan als PDF herunterladen (Sportart für Kopf und Farbstreifen).
import { downloadPlanPdf } from '../lib/planPdf';
import { useSport } from '../context/SportContext';

export function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPlan, getPlanSportId, exercises, deletePlan, exerciseNotes } = useAppData();
  const { features } = useTrainerFeatures();
  const { sport } = useSport();
  // C16: Zustand des PDF-Buttons – kurzer Ladekreis während der Erzeugung, ruhige Meldung bei Fehler.
  const [pdfState, setPdfState] = useState<'idle' | 'busy' | 'error'>('idle');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  // C15: Übungen, deren Notizen aufgeklappt sind (anfangs keine).
  const [openNotes, setOpenNotes] = useState<Set<string>>(() => new Set());

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
  // C13: Notizen nur zu Übungen, die (noch) im Plan sind.
  const planNotes = exerciseNotes.filter((n) => n.planId === plan.id && plan.exerciseIds.includes(n.exerciseId));
  const planNoteCount = planNotes.length;
  // C15: Übungen mit Notizen – für „alle auf-/zuklappen“ über den Chip.
  const noteExerciseIds = [...new Set(planNotes.map((n) => n.exerciseId))];
  const allNotesOpen = noteExerciseIds.length > 0 && noteExerciseIds.every((id) => openNotes.has(id));
  const toggleNotes = (exerciseId: string) =>
    setOpenNotes((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-start gap-3">
        <IconButton
          icon={<ChevronLeft size={18} />}
          label="Zurück"
          onClick={() => navigate('/plaene')}
          className="mt-0.5 shrink-0"
        />
        {/* C16: Mit dem dritten Aktions-Button wird der Titel am Handy schmaler – deutsche Silbentrennung (lang="de")
            statt hartem Umbruch mitten im Wort. */}
        <h1 className="min-w-0 flex-1 break-words font-display text-2xl font-extrabold text-ink hyphens-auto sm:text-3xl">
          {plan.name}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          {/* C16: PDF-Download – runder Icon-Button wie Bearbeiten/Löschen, fest an erster Stelle der Aktionen.
              Ohne Übungen deaktiviert (sonst entstünde eine leere PDF). */}
          <IconButton
            icon={pdfState === 'busy' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            label={planExercises.length === 0 ? 'Als PDF herunterladen – erst Übungen hinzufügen' : 'Als PDF herunterladen'}
            disabled={planExercises.length === 0 || pdfState === 'busy'}
            aria-busy={pdfState === 'busy'}
            className="disabled:cursor-not-allowed disabled:opacity-40"
            onClick={async () => {
              setPdfState('busy');
              try {
                await downloadPlanPdf({
                  plan,
                  exercises: planExercises,
                  sport,
                  showTargetGroup: features.targetGroup,
                  showDifficulty: features.difficulty,
                });
                setPdfState('idle');
              } catch {
                setPdfState('error');
              }
            }}
          />
          <IconButton
            icon={<Pencil size={16} />}
            label="Plan bearbeiten"
            onClick={() => navigate(`/plaene/${plan.id}/bearbeiten`)}
          />
          <IconButton icon={<Trash2 size={16} />} label="Plan löschen" onClick={() => setConfirmDelete(true)} />
        </div>
      </div>

      {/* C16: Ruhiger Hinweis statt Alarm, falls die PDF nicht erstellt werden konnte. */}
      {pdfState === 'error' && (
        <p role="status" className="-mt-3 text-sm text-muted">
          Die PDF konnte nicht erstellt werden. Bitte versuche es noch einmal.
        </p>
      )}

      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          {/* C6a: Status-Badge mit Datum. */}
          {schedule && <PlanStatusBadge status={schedule.status} date={schedule.date} time={plan.time} />}
          {/* C7: Wiederholung als eigener Chip im Stil der übrigen Info-Chips. */}
          {/* C13: Anzahl der Notizen im Plan als Info-Chip (nur wenn vorhanden). */}
          {planNoteCount > 0 && (
            // C15: Chip ist jetzt ein Button – klappt alle Notizen des Plans auf bzw. zu (gleicher Chip-Stil).
            <button
              type="button"
              aria-expanded={allNotesOpen}
              onClick={() => setOpenNotes(allNotesOpen ? new Set() : new Set(noteExerciseIds))}
              title={allNotesOpen ? 'Alle Notizen zuklappen' : 'Alle Notizen aufklappen'}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-ink"
            >
              <StickyNote size={13} />
              {planNoteCount === 1 ? '1 Notiz' : `${planNoteCount} Notizen`}
              <CollapseChevron open={allNotesOpen} size={13} />
            </button>
          )}
          {plan.recurrence && (
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted">
              <Repeat size={13} />
              {describeRecurrence(plan.recurrence, plan.date)}
            </span>
          )}
          {/* C9: Zielgruppe nur, wenn die Trainer-Funktion eingeschaltet ist. */}
          {features.targetGroup && plan.targetGroup && (
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
              // C13: flex-wrap auch ab sm, damit die Notizen als volle Zeile unter der Übung stehen können.
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4"
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
                  {/* C11: Sätze/Gewichte neben der Dauer. */}
                  {exercise.strength && <StrengthSummary spec={exercise.strength} className="w-full" />}
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
              {/* C13: Notizen zu dieser Übung in diesem Plan (neueste zuerst). */}
              {/* C15: einklappbar, anfangs zu. */}
              <PlanExerciseNotes
                planId={plan.id}
                exerciseId={exercise.id}
                open={openNotes.has(exercise.id)}
                onToggle={() => toggleNotes(exercise.id)}
              />
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

      {/* C11: Gym-Übungen mit Sätzen öffnen die Satz-Ansicht, alle anderen wie bisher den Timer. */}
      {activeExercise &&
        (activeExercise.strength ? (
          <StrengthSession exercise={activeExercise} planId={plan.id} onClose={() => setActiveExercise(null)} />
        ) : (
          <Timer exercise={activeExercise} planId={plan.id} onClose={() => setActiveExercise(null)} />
        ))}
    </div>
  );
}
