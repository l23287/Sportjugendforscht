// C13: Notizen einer Übung im Plandetail – ruhige Zeilen im App-Stil (kein gelber „Zettel“-Look, keine extra Kästchen;
// Feedback aus C6a). Neueste Notiz sichtbar, ältere über „+n weitere“ aufklappbar. Bearbeiten im Dialog, Löschen mit
// Bestätigung – dieselben Bausteine wie bei Kernzielen und Stoppuhr-Werten.
import { useState, type FormEvent } from 'react';
import { ChevronDown, Pencil, StickyNote, Trash2 } from 'lucide-react';
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

export function PlanExerciseNotes({ planId, exerciseId }: { planId: string; exerciseId: string }) {
  const { exerciseNotes, updateExerciseNote, deleteExerciseNote } = useAppData();
  const notes = notesForExercise(exerciseNotes, planId, exerciseId);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<{ note: ExerciseNote; text: string; error: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ExerciseNote | null>(null);

  if (notes.length === 0) return null;
  const visible = expanded ? notes : notes.slice(0, 1);
  const today = todayKey();

  function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const result = updateExerciseNote(editing.note.id, editing.text);
    if (!result.ok) return setEditing({ ...editing, error: result.error });
    setEditing(null);
  }

  return (
    <div className="w-full border-t border-border pt-3">
      <ul className="flex flex-col gap-2.5" aria-label="Notizen">
        {visible.map((note) => {
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
      {notes.length > 1 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 inline-flex items-center gap-1 py-1 text-xs font-semibold text-accent underline-offset-2 hover:underline"
        >
          <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          {expanded ? 'Weniger anzeigen' : `+${notes.length - 1} weitere`}
        </button>
      )}

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
