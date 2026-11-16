// C8: Neue Komponente – Kernziele in den Einstellungen festlegen (bis zu drei je Sportart).
// Gleicher Kartenstil wie „Sportart“; Liste wie „Ausgewählte Übungen“ im Planformular (Nummer, ↑/↓);
// Bearbeiten im Dialog wie beim Übungsformular; Löschen mit Bestätigung wie überall in der App.
import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useSport } from '../context/SportContext';
import { IconButton } from './IconButton';
import { PrimaryButton } from './PrimaryButton';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { CoreGoalBadge } from './CoreGoalBadge';
import { inputClass, labelClass } from '../lib/formStyles';
import { CORE_GOAL_MAX_LENGTH, MAX_CORE_GOALS } from '../lib/coreGoals';
import { isDateKey } from '../lib/dateKey';
import type { CoreGoal } from '../types';

export function CoreGoalsSettings() {
  const { goals, addGoal, updateGoal, toggleGoalAchieved, deleteGoal, moveGoal } = useAppData();
  const { sport } = useSport();
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ goal: CoreGoal; text: string; dueDate: string; error: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CoreGoal | null>(null);

  const isFull = goals.length >= MAX_CORE_GOALS;

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const result = addGoal({ text, dueDate: isDateKey(dueDate) ? dueDate : null });
    if (!result.ok) return setError(result.error);
    setText('');
    setDueDate('');
    setError('');
  }

  function handleSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const result = updateGoal(editing.goal.id, {
      text: editing.text,
      dueDate: isDateKey(editing.dueDate) ? editing.dueDate : null,
    });
    if (!result.ok) return setEditing({ ...editing, error: result.error });
    setEditing(null);
  }

  return (
    <div id="kernziele" className="flex scroll-mt-6 flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Kernziele für {sport.name}</h2>
        <p className="mt-1 text-sm text-muted">
          Bis zu drei Ziele, die auf deiner Startseite erscheinen. Ziel 1 ist das wichtigste.
        </p>
      </div>

      {goals.length > 0 && (
        <ol className="flex flex-col gap-2">
          {goals.map((goal, index) => (
            <li
              key={goal.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-soft p-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                {/* C8: Nummer wie bei „Ausgewählte Übungen“; erreichte Ziele mit Häkchen. */}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    goal.achieved ? 'bg-accent text-[#04263f]' : 'bg-primary-soft text-accent'
                  }`}
                  aria-hidden="true"
                >
                  {goal.achieved ? <Check size={16} strokeWidth={3} /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`break-words font-semibold ${goal.achieved ? 'text-muted' : 'text-ink'}`}>{goal.text}</p>
                  <div className="mt-1 empty:hidden">
                    <CoreGoalBadge goal={goal} />
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                <IconButton
                  icon={<ArrowUp size={16} />}
                  label={`„${goal.text}“ nach oben`}
                  disabled={index === 0}
                  className="disabled:opacity-30"
                  onClick={() => moveGoal(goal.id, -1)}
                />
                <IconButton
                  icon={<ArrowDown size={16} />}
                  label={`„${goal.text}“ nach unten`}
                  disabled={index === goals.length - 1}
                  className="disabled:opacity-30"
                  onClick={() => moveGoal(goal.id, 1)}
                />
                <IconButton
                  icon={<Check size={16} />}
                  label={goal.achieved ? `„${goal.text}“ als offen markieren` : `„${goal.text}“ als erreicht markieren`}
                  active={goal.achieved}
                  aria-pressed={goal.achieved}
                  onClick={() => toggleGoalAchieved(goal.id)}
                />
                <IconButton
                  icon={<Pencil size={16} />}
                  label={`„${goal.text}“ bearbeiten`}
                  onClick={() => setEditing({ goal, text: goal.text, dueDate: goal.dueDate ?? '', error: '' })}
                />
                <IconButton icon={<Trash2 size={16} />} label={`„${goal.text}“ löschen`} onClick={() => setPendingDelete(goal)} />
              </div>
            </li>
          ))}
        </ol>
      )}

      {isFull ? (
        // C8: Obergrenze sichtbar machen statt den Button kommentarlos zu verstecken.
        <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted">
          Maximal drei Kernziele. Entferne oder ändere eines, um ein neues festzulegen.
        </p>
      ) : (
        <form onSubmit={handleAdd} noValidate className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
            <div>
              <label className={labelClass} htmlFor="core-goal-text">
                Neues Kernziel
              </label>
              <input
                id="core-goal-text"
                className={inputClass}
                value={text}
                maxLength={CORE_GOAL_MAX_LENGTH + 20}
                onChange={(event) => {
                  setText(event.target.value);
                  if (error) setError('');
                }}
                placeholder="z. B. Aufschlagquote auf 70 % steigern"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="core-goal-date">
                Zieldatum (optional)
              </label>
              <input
                id="core-goal-date"
                type="date"
                className={`${inputClass} [color-scheme:dark]`}
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
          </div>
          {error && (
            <p className="text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          )}
          <PrimaryButton type="submit" icon={<Plus size={18} />} className="self-start">
            Kernziel hinzufügen
          </PrimaryButton>
        </form>
      )}

      <Modal open={editing !== null} title="Kernziel bearbeiten" onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={handleSaveEdit} noValidate className="flex flex-col gap-4">
            <div>
              <label className={labelClass} htmlFor="core-goal-edit-text">
                Kernziel
              </label>
              <input
                id="core-goal-edit-text"
                className={inputClass}
                value={editing.text}
                maxLength={CORE_GOAL_MAX_LENGTH + 20}
                onChange={(event) => setEditing({ ...editing, text: event.target.value, error: '' })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="core-goal-edit-date">
                Zieldatum (optional)
              </label>
              <input
                id="core-goal-edit-date"
                type="date"
                className={`${inputClass} [color-scheme:dark]`}
                value={editing.dueDate}
                onChange={(event) => setEditing({ ...editing, dueDate: event.target.value })}
              />
            </div>
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
        title="Kernziel löschen?"
        description={pendingDelete ? `„${pendingDelete.text}“ wird entfernt.` : undefined}
        onConfirm={() => {
          if (pendingDelete) deleteGoal(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
