// C13: Zustand einer Notiz während der Ausführung (Timer / Satz-Ansicht).
// save() wird von den Dialogen bei JEDEM Schließen aufgerufen (✕, Tipp daneben, Escape, „Schließen“, „Fertig“ …),
// damit ein angefangener Text nie verloren geht (Abstimmung im Team: automatisch speichern).
import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { cleanNoteText } from '../lib/notes';

export interface ExecutionNoteState {
  /** false, wenn die Übung nicht aus einem Plan gestartet wurde (dann gibt es keine Plan-Ansicht für die Notiz). */
  available: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  draft: string;
  setDraft: (text: string) => void;
  error: string;
  savedCount: number;
  /** Speichert den Entwurf, falls Text vorhanden ist. Liefert false nur bei einem Fehler. */
  save: () => boolean;
}

export function useExecutionNote(planId: string | null, exerciseId: string): ExecutionNoteState {
  const { addExerciseNote } = useAppData();
  const [open, setOpen] = useState(false);
  const [draft, setDraftState] = useState('');
  const [error, setError] = useState('');
  const [savedCount, setSavedCount] = useState(0);

  function save(): boolean {
    if (!planId || !cleanNoteText(draft)) return true;
    const result = addExerciseNote(planId, exerciseId, draft);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setDraftState('');
    setError('');
    setSavedCount((count) => count + 1);
    return true;
  }

  return {
    available: planId !== null,
    open,
    setOpen,
    draft,
    setDraft: (text) => {
      setDraftState(text);
      if (error) setError('');
    },
    error,
    savedCount,
    save,
  };
}
