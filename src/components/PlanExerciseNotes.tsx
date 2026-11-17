// C13: Notizen einer Übung im Plandetail – ruhige Zeilen im App-Stil (kein gelber „Zettel“-Look, keine extra Kästchen;
// Feedback aus C6a). Neueste Notiz zuerst.
// C15: Ganzer Notizbereich je Übung ein-/ausklappbar (anfangs zu); „+n weitere“ entfällt. Bearbeiten im Dialog, Löschen mit
// Bestätigung – dieselben Bausteine wie bei Kernzielen und Stoppuhr-Werten.
import { useId, useState, type FormEvent } from 'react';
import { Pencil, StickyNote, Trash2 } from 'lucide-react';
// C15: Notizen ein-/ausklappbar – gleiche Animation und gleicher Pfeil wie die Einstellungen-Karten.
import { Collapse, CollapseChevron } from './Collapsible';
import { useAppData } from '../context/AppDataContext';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { PrimaryButton } from './PrimaryButton';
import { labelClass, textareaClass } from '../lib/formStyles';
import { MAX_NOTE_LENGTH, notesForExercise } from '../lib/notes';
import { formatDateTime } from '../lib/time';
import { toDateKey, todayKey } from '../lib/dateKey';
import { PLAN_STATUS_META } from '../lib/planStatus';
import type { ExerciseNote } from '../types';

// C15: Auf-/Zu-Zustand kommt vom Plandetail, damit der Chip „n Notizen“ oben alle gleichzeitig öffnen kann.
export function PlanExerciseNotes({
  planId,
  exerciseId,
  open,
  onToggle,
}: {
  planId: string;
  exerciseId: string;
  open: boolean;
  onToggle: () => void;
}) {
  const { exerciseNotes, updateExerciseNote, deleteExerciseNote } = useAppData();
  const notes = notesForExercise(exerciseNotes, planId, exerciseId);
  const [editing, setEditing] = useState<{ note: ExerciseNote; text: string; error: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ExerciseNote | null>(null);
  const contentId = useId();

  if (notes.length === 0) return null;
  const today = todayKey();
  // C15: „Heute“ auch im eingeklappten Kopf – man sieht nach dem Training sofort, dass eine neue Notiz da ist.
  const hasToday = notes.some((note) => toDateKey(new Date(note.createdAt)) === today);

  function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const result = updateExerciseNote(editing.note.id, editing.text);
    if (!result.ok) return setEditing({ ...editing, error: result.error });
    setEditing(null);
  }

  return (
    <div className="w-full border-t border-border pt-2">
      {/* C15: Kopfzeile „Notizen · n“ als Klapp-Button (anfangs zu). Ersetzt „+n weitere“ aus C13 – nur eine Klapp-Ebene. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={onToggle}
        className="flex min-h-11 w-full items-center gap-2 rounded-xl text-left text-sm font-semibold text-muted transition hover:text-ink"
      >
        <StickyNote size={15} className="shrink-0 text-accent" aria-hidden="true" />
        <span className="whitespace-nowrap">{notes.length === 1 ? '1 Notiz' : `${notes.length} Notizen`}</span>
        {/* C15: nur zugeklappt – aufgeklappt trägt die Notiz selbst das Badge (sonst doppelt). */}
        {hasToday && !open && (
          <span className={`rounded-2xl px-2 py-0.5 text-xs font-semibold ${PLAN_STATUS_META.heute.badgeClass}`}>Heute</span>
        )}
        <span className="flex-1" />
        <CollapseChevron open={open} size={18} />
      </button>
      <Collapse open={open} id={contentId}>
      <ul className="flex flex-col gap-2.5 pb-1 pt-1" aria-label="Notizen">
        {notes.map((note) => {
          const isToday = toDateKey(new Date(note.createdAt)) === today;
          return (
            <li key={note.id} className="flex items-start gap-2.5">
              <StickyNote size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-line break-words text-sm text-muted">{note.text}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-2">
                  {/* C13: Notizen von heute mit dem „Heute“-Badge aus C6a. */}
                  {isToday && (
                    <span className={`rounded-2xl px-2 py-0.5 font-semibold ${PLAN_STATUS_META.heute.badgeClass}`}>Heute</span>
                  )}
                  {formatDateTime(note.createdAt)}
                  {note.updatedAt && <span>· bearbeitet</span>}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setEditing({ note, text: note.text, error: '' })}
                  aria-label="Notiz bearbeiten"
                  title="Bearbeiten"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(note)}
                  aria-label="Notiz löschen"
                  title="Löschen"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      </Collapse>

      <Modal open={editing !== null} title="Notiz bearbeiten" onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={handleSave} noValidate className="flex flex-col gap-3">
            <label className={labelClass} htmlFor="note-edit">
              Notiz
            </label>
            <textarea
              id="note-edit"
              autoFocus
              rows={4}
              maxLength={MAX_NOTE_LENGTH}
              className={textareaClass}
              value={editing.text}
              onChange={(event) => setEditing({ ...editing, text: event.target.value, error: '' })}
            />
            <span className="text-xs tabular-nums text-muted-2">
              {editing.text.length}/{MAX_NOTE_LENGTH}
            </span>
            {editing.error && (
              <p className="text-sm font-medium text-danger" role="alert">
                {editing.error}
              </p>
            )}
            <div className="flex gap-3">
              <PrimaryButton variant="ghost" className="h-12 flex-1 border border-border" onClick={() => setEditing(null)}>
                Abbrechen
              </PrimaryButton>
              <PrimaryButton type="submit" className="h-12 flex-1">
                Speichern
              </PrimaryButton>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Notiz löschen?"
        description={pendingDelete ? `Die Notiz vom ${formatDateTime(pendingDelete.createdAt)} wird entfernt.` : undefined}
        onConfirm={() => {
          if (pendingDelete) deleteExerciseNote(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
