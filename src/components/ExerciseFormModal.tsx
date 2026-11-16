import { useEffect, useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Modal } from './Modal';
import { PrimaryButton } from './PrimaryButton';
import { inputClass, labelClass, selectClass, textareaClass } from '../lib/formStyles';
// C4: Sekundengenaue Dauer – Standardwert, Prüfung und Formatierung.
import { DEFAULT_DURATION_SECONDS, parseDurationInput, splitSeconds } from '../lib/time';
import { DIFFICULTIES } from '../types';
import type { Difficulty, Exercise, ExerciseInput } from '../types';
// C9: Schalter „Schwierigkeitsgrad“.
import { useTrainerFeatures } from '../context/TrainerFeaturesContext';

interface ExerciseFormModalProps {
  open: boolean;
  exercise: Exercise | null;
  onClose: () => void;
  onSubmit: (input: ExerciseInput) => void;
}

export function ExerciseFormModal({ open, exercise, onClose, onSubmit }: ExerciseFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  // C4: Zwei Felder (Min. / Sek.) statt einem Minutenfeld. Als Text gespeichert, damit ein Feld auch leer sein darf.
  const [durationMin, setDurationMin] = useState('15');
  const [durationSec, setDurationSec] = useState('00');
  // C9: null = „ohne Angabe“.
  const [difficulty, setDifficulty] = useState<Difficulty | null>('Anfänger');
  const { features } = useTrainerFeatures();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(exercise?.name ?? '');
    setDescription(exercise?.description ?? '');
    setGoal(exercise?.goal ?? '');
    // C4: Beim Bearbeiten aus den gespeicherten Sekunden befüllen (z. B. 90 s → 1 Min. 30 Sek.).
    const { hours, minutes, seconds } = splitSeconds(exercise?.durationSeconds ?? DEFAULT_DURATION_SECONDS);
    setDurationMin(String(hours * 60 + minutes));
    setDurationSec(String(seconds).padStart(2, '0'));
    // C9: Bearbeiten → gespeicherten Wert behalten (auch wenn ausgeblendet, damit nichts verloren geht).
    //     Neue Übung → bei eingeschaltetem Schalter wie bisher „Anfänger“, sonst „ohne Angabe“ (null) –
    //     kein stilles „Anfänger“, das nach dem Wiedereinschalten falsch wäre.
    setDifficulty(exercise ? exercise.difficulty : features.difficulty ? 'Anfänger' : null);
    setError('');
  }, [open, exercise, features.difficulty]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Bitte gib einen Namen für die Übung ein.');
      return;
    }
    // C4: Prüfung von Minuten/Sekunden (ganze Zahlen, Sek. 0–59, > 0, max. 3 Std.).
    const duration = parseDurationInput(durationMin, durationSec);
    if (!duration.ok) {
      setError(duration.error);
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      goal: goal.trim(),
      durationSeconds: duration.seconds,
      difficulty,
    });
  }

  return (
    <Modal open={open} title={exercise ? 'Übung bearbeiten' : 'Neue Übung'} onClose={onClose}>
      {/* C4: noValidate – sonst blockiert die Browser-Prüfung (pattern) das Absenden mit einer eigenen Sprechblase
          und unsere einheitlich gestaltete Fehlermeldung erscheint nicht. Geprüft wird in parseDurationInput. */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label className={labelClass} htmlFor="exercise-name">
            Name
          </label>
          <input
            id="exercise-name"
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="z. B. Vorhand-Rückhand-Wechsel"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="exercise-description">
            Beschreibung
          </label>
          <textarea
            id="exercise-description"
            className={textareaClass}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Wie läuft die Übung ab?"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="exercise-goal">
            Ziel
          </label>
          <input
            id="exercise-goal"
            className={inputClass}
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="z. B. Schlagpräzision"
          />
        </div>
        {/* C4: Am Handy untereinander (Dauer braucht zwei Felder), ab sm wie bisher nebeneinander.
            C9: Ohne Schwierigkeitsgrad nimmt „Dauer“ die ganze Zeile ein (keine leere Spalte). */}
        <div className={`grid grid-cols-1 gap-4 ${features.difficulty ? 'sm:grid-cols-2' : ''}`}>
          {/* C4: Dauer als zwei Felder „Min.“ und „Sek.“ – Zahlentastatur am Handy (inputMode="numeric").
              Eingaben werden bewusst NICHT still bereinigt: „1,5“ würde sonst unbemerkt zu „15“ Minuten.
              Ungültige Zeichen meldet stattdessen parseDurationInput beim Speichern. */}
          <fieldset>
            <legend className={labelClass}>Dauer</legend>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="exercise-duration-min"
                  aria-label="Dauer Minuten"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  className={`${inputClass} pr-12 text-right tabular-nums`}
                  value={durationMin}
                  onChange={(event) => setDurationMin(event.target.value)}
                  placeholder="0"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-2">
                  Min.
                </span>
              </div>
              <span className="font-display text-xl font-bold text-muted-2" aria-hidden="true">
                :
              </span>
              <div className="relative flex-1">
                <input
                  id="exercise-duration-sec"
                  aria-label="Dauer Sekunden"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  className={`${inputClass} pr-12 text-right tabular-nums`}
                  value={durationSec}
                  onChange={(event) => setDurationSec(event.target.value)}
                  // C4: Einstellige Sekunden beim Verlassen auf zwei Stellen ergänzen (5 → 05), passend zur Uhrform.
                  onBlur={() => setDurationSec((value) => (value.length === 1 ? value.padStart(2, '0') : value))}
                  placeholder="00"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-2">
                  Sek.
                </span>
              </div>
            </div>
          </fieldset>
          {/* C9: Nur bei eingeschalteter Trainer-Funktion; zusätzlich Option „Ohne Angabe“. */}
          {features.difficulty && (
            <div>
              <label className={labelClass} htmlFor="exercise-difficulty">
                Schwierigkeitsgrad
              </label>
              <select
                id="exercise-difficulty"
                className={selectClass}
                value={difficulty ?? ''}
                onChange={(event) => setDifficulty(event.target.value ? (event.target.value as Difficulty) : null)}
              >
                <option value="">Ohne Angabe</option>
                {DIFFICULTIES.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <PrimaryButton type="submit" icon={<Check size={18} />} className="w-full sm:w-auto">
            {exercise ? 'Änderungen speichern' : 'Übung erstellen'}
          </PrimaryButton>
          <PrimaryButton
            type="button"
            variant="ghost"
            className="w-full border border-border sm:w-auto"
            onClick={onClose}
          >
            Abbrechen
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
