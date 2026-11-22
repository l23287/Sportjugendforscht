// C17: Neue Komponente – Dialog „Plan duplizieren“ (gleich auf der Plankarte und im Plandetail).
// Aufbau wie die übrigen Dialoge (Kernziel/Notiz bearbeiten): Felder mit labelClass/inputClass, unten Abbrechen (ghost)
// und Hauptaktion. Name vorbelegt mit „(Kopie)“, Datum mit dem Termin des Originals; bei Serien ein Schalter
// „Wiederholung übernehmen“ – standardmäßig AUS (Abstimmung im Team). Nach dem Duplizieren geht es direkt zur Kopie.
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { PrimaryButton } from './PrimaryButton';
import { Switch } from './Switch';
import { useAppData } from '../context/AppDataContext';
import { useTrainerFeatures } from '../context/TrainerFeaturesContext';
import { inputClass, labelClass } from '../lib/formStyles';
import { copyName, copyPlanInput, defaultCopyDate } from '../lib/planCopy';
import { describeRecurrence } from '../lib/recurrence';
import { isDateKey } from '../lib/dateKey';
import { formatDate } from '../lib/time';
import type { TrainingPlan } from '../types';

export interface PlanCopyState {
  /** C17: Name des Originals – das Plandetail der Kopie zeigt daraus einen kurzen Hinweis. */
  copiedFrom: string;
}

export function DuplicatePlanDialog({ plan, onClose }: { plan: TrainingPlan | null; onClose: () => void }) {
  return (
    <Modal open={plan !== null} title="Plan duplizieren" onClose={onClose}>
      {/* Eigene Form-Komponente je Plan → Felder werden bei jedem Öffnen frisch vorbelegt. */}
      {plan && <DuplicateForm key={plan.id} plan={plan} onClose={onClose} />}
    </Modal>
  );
}

function DuplicateForm({ plan, onClose }: { plan: TrainingPlan; onClose: () => void }) {
  const { plans, addPlan } = useAppData();
  const navigate = useNavigate();
  const [name, setName] = useState(() => copyName(plan.name, plans.map((p) => p.name)));
  const [date, setDate] = useState(() => defaultCopyDate(plan));
  const [keepRecurrence, setKeepRecurrence] = useState(false);
  const [error, setError] = useState('');
  const { features } = useTrainerFeatures();
  const rule = plan.recurrence;
  // C17: Kurz sagen, was mitkommt – nur Angaben, die es gibt (und die per C9 sichtbar sind).
  const carried = [
    plan.exerciseIds.length > 0 ? 'Übungen' : null,
    plan.description.trim() ? 'Beschreibung' : null,
    features.targetGroup && plan.targetGroup.trim() ? 'Zielgruppe' : null,
    plan.time ? 'Uhrzeit' : null,
  ].filter(Boolean) as string[];
  const carriedText =
    carried.length === 0 ? '' : carried.length === 1 ? carried[0] : `${carried.slice(0, -1).join(', ')} und ${carried[carried.length - 1]}`;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError('Bitte gib einen Namen für die Kopie ein.');
    if (keepRecurrence && rule) {
      if (!isDateKey(date)) return setError('Für eine Wiederholung braucht die Kopie ein Startdatum.');
      if (rule.until && rule.until < date)
        return setError(`Die Serie endet am ${formatDate(rule.until)} – wähle ein Startdatum davor oder übernimm die Wiederholung nicht.`);
    }
    const copy = addPlan(copyPlanInput(plan, { name, date, keepRecurrence: keepRecurrence && Boolean(rule) }));
    onClose();
    navigate(`/plaene/${copy.id}`, { state: { copiedFrom: plan.name } satisfies PlanCopyState });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label className={labelClass} htmlFor="copy-name">
          Name
        </label>
        <input
          id="copy-name"
          className={inputClass}
          value={name}
          autoFocus
          onChange={(event) => {
            setName(event.target.value);
            setError('');
          }}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="copy-date">
          {keepRecurrence ? 'Startdatum' : 'Datum (optional)'}
        </label>
        <input
          id="copy-date"
          type="date"
          className={`${inputClass} [color-scheme:dark]`}
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setError('');
          }}
        />
      </div>

      {/* C17: Nur bei Serien – Zeilenaufbau wie die Schalter der Trainer-Funktionen (C9). */}
      {rule && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg-soft p-3">
            <div className="min-w-0 flex-1">
              <p id="copy-recurrence-label" className="font-semibold text-ink">
                Wiederholung übernehmen
              </p>
              <p id="copy-recurrence-desc" className="text-xs text-muted-2">
                {describeRecurrence(rule, plan.date)}
                {plan.time ? ` · ${plan.time}` : ''}
              </p>
            </div>
            <Switch
              checked={keepRecurrence}
              onChange={(value) => {
                setKeepRecurrence(value);
                setError('');
              }}
              labelledBy="copy-recurrence-label"
              describedBy="copy-recurrence-desc"
            />
          </div>
          {/* C17: Sachlicher Hinweis in Grau – kein Alarm. */}
          {keepRecurrence && (
            <p className="text-xs text-muted-2">Mit Wiederholung erscheinen beide Pläne an denselben Tagen.</p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-2">
        {carriedText ? `${carriedText} ${carried.length === 1 ? 'wird' : 'werden'} übernommen – ` : ''}Notizen und
        Trainingsverlauf bleiben beim Original.
      </p>

      {error && (
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <PrimaryButton variant="ghost" className="h-12 flex-1 border border-border" onClick={onClose}>
          Abbrechen
        </PrimaryButton>
        <PrimaryButton type="submit" className="h-12 flex-1">
          Duplizieren
        </PrimaryButton>
      </div>
    </form>
  );
}
