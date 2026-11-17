// C13: Notiz-Bereich in der Ausführung (Timer und Satz-Ansicht). Zugeklappt nur ein dezenter, runder Button „Notiz“
// (Stil wie „Satz hinzufügen“), damit die Hauptaktionen des Trainings im Vordergrund bleiben. Timer bzw. Satzpause
// laufen beim Schreiben weiter. Escape im Textfeld speichert und klappt zu – es schließt NICHT die ganze Übung.
import type { KeyboardEvent } from 'react';
import { Check, StickyNote } from 'lucide-react';
import type { ExecutionNoteState } from '../hooks/useExecutionNote';
import { labelClass, textareaClass } from '../lib/formStyles';
import { MAX_NOTE_LENGTH } from '../lib/notes';

export function ExecutionNote({ note }: { note: ExecutionNoteState }) {
  if (!note.available) return null;

  function saveAndCollapse() {
    if (note.save()) note.setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      // Nur das Textfeld schließen – der Dialog hört auf Escape am Fenster, das hier nicht ankommen soll.
      event.stopPropagation();
      event.preventDefault();
      saveAndCollapse();
    }
  }

  if (!note.open) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => note.setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-bg-soft px-4 text-sm font-semibold text-ink transition hover:bg-surface-2"
        >
          <StickyNote size={16} className="text-accent" aria-hidden="true" />
          Notiz
        </button>
        {note.savedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-2" role="status">
            <Check size={12} aria-hidden="true" />
            {note.savedCount === 1 ? 'Notiz gespeichert' : `${note.savedCount} Notizen gespeichert`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2 text-left">
      <label className={labelClass} htmlFor="execution-note">
        Notiz zu dieser Übung
      </label>
      <textarea
        id="execution-note"
        autoFocus
        rows={3}
        maxLength={MAX_NOTE_LENGTH}
        className={textareaClass}
        value={note.draft}
        onChange={(event) => note.setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="z. B. Rückhand noch unsauber, nächstes Mal langsamer starten"
      />
      {note.error && (
        <p className="text-sm font-medium text-danger" role="alert">
          {note.error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs tabular-nums text-muted-2">
          {note.draft.length}/{MAX_NOTE_LENGTH} · wird beim Schließen gespeichert
        </span>
        <button
          type="button"
          onClick={saveAndCollapse}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-bg-soft px-4 text-sm font-semibold text-ink transition hover:bg-surface-2"
        >
          <Check size={16} className="text-accent" aria-hidden="true" />
          Speichern
        </button>
      </div>
    </div>
  );
}
