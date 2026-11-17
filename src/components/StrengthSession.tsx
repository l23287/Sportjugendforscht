// C11: Neue Komponente – Ausführung einer Gym-Übung Satz für Satz.
// Gleicher Dialog-Rahmen, gleiche Buttons und gleicher Ring wie der Übungs-Timer (Timer.tsx), damit beide Ausführungs-
// Ansichten zusammenpassen. Für das Studio gebaut: große Zahlen, Treffflächen ≥ 56 px, Gewicht per − / + (2,5 kg)
// oder direkt eintippen. Nach „Satz erledigt“ startet die Satzpause automatisch als Countdown (Abstimmung im Team).
// Am Ende: „Neue Gewichte für das nächste Mal übernehmen?“, falls Gewichte geändert wurden.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Minus, Plus, SkipForward, X } from 'lucide-react';
import type { Exercise } from '../types';
import { useAppData } from '../context/AppDataContext';
import { formatCountdown } from '../lib/time';
import { formatWeight, parseWeightInput, stepWeight, weightToInput } from '../lib/strength';

type Phase = 'set' | 'rest' | 'done';

interface StrengthSessionProps {
  exercise: Exercise;
  planId: string | null;
  onClose: () => void;
}

const primaryButton =
  'flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-dark font-semibold text-white shadow-[0_10px_25px_rgba(37,99,235,0.35)] transition hover:brightness-110';
const secondaryButton =
  'h-14 flex-1 rounded-2xl border border-border font-semibold text-muted transition hover:bg-surface-2 hover:text-ink';

export function StrengthSession({ exercise, planId, onClose }: StrengthSessionProps) {
  const { logExerciseCompleted, applyStrengthWeights } = useAppData();
  const template = exercise.strength!;
  const sets = template.sets;
  const [weights, setWeights] = useState<number[]>(() => sets.map((s) => s.weightKg));
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('set');
  const [restRemaining, setRestRemaining] = useState(template.restSeconds);
  const [weightDraft, setWeightDraft] = useState<string | null>(null);
  const [weightError, setWeightError] = useState('');
  const logged = useRef(false);

  const current = sets[setIndex];
  const currentWeight = weights[setIndex];
  const changed = weights.some((w, i) => w !== sets[i].weightKg);

  // C11: Escape schließt – wie beim Timer.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // C11: Satzpause als Countdown; bei 0 automatisch zum nächsten Satz (kurze Vibration, wo das Gerät es kann).
  //      Zählen und Weiterschalten sind getrennt: Das Weiterschalten passiert nicht in der State-Aktualisierung
  //      (die React im Entwicklungsmodus doppelt ausführt), sondern im eigenen Effekt bei 0.
  useEffect(() => {
    if (phase !== 'rest') return undefined;
    const id = window.setInterval(() => setRestRemaining((prev) => Math.max(prev - 1, 0)), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'rest' && restRemaining === 0) {
      navigator.vibrate?.(200);
      setSetIndex((i) => i + 1);
      setPhase('set');
    }
  }, [phase, restRemaining]);

  // C11: Abschluss genau einmal protokollieren – mit den tatsächlich trainierten Gewichten (Grundlage für C14).
  useEffect(() => {
    if (phase === 'done' && !logged.current) {
      logged.current = true;
      logExerciseCompleted(
        exercise.id,
        planId,
        sets.map((s, i) => ({ reps: s.reps, weightKg: weights[i] })),
      );
    }
  }, [phase, exercise.id, planId, sets, weights, logExerciseCompleted]);

  // C11: Gewicht ändern – gilt für den aktuellen Satz UND die folgenden Sätze mit bisher gleichem Gewicht
  //      (typischer Fall: „heute alles mit 42,5 statt 40“). Pyramiden mit anderen Gewichten bleiben unberührt.
  //      − / + und Eintippen verhalten sich bewusst gleich (im Test vereinheitlicht).
  function changeCurrentWeight(value: number) {
    const old = weights[setIndex];
    setWeights((prev) => prev.map((w, i) => (i === setIndex || (i > setIndex && w === old) ? value : w)));
  }

  function completeSet() {
    if (setIndex === sets.length - 1) return setPhase('done');
    if (template.restSeconds === 0) return setSetIndex((i) => i + 1);
    setRestRemaining(template.restSeconds);
    setPhase('rest');
  }

  function skipRest() {
    setSetIndex((i) => i + 1);
    setPhase('set');
  }

  function commitWeightDraft(event?: FormEvent) {
    event?.preventDefault();
    if (weightDraft === null) return;
    const parsed = parseWeightInput(weightDraft);
    if (!parsed.ok) return setWeightError(parsed.error);
    changeCurrentWeight(parsed.value);
    setWeightDraft(null);
    setWeightError('');
  }

  const restProgress = template.restSeconds === 0 ? 1 : 1 - restRemaining / template.restSeconds;
  const circumference = 2 * Math.PI * 45;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative max-h-[95dvh] w-full max-w-sm overflow-y-auto rounded-3xl border border-border bg-surface p-6 text-center sm:p-8"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Sätze für ${exercise.name}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-soft text-muted transition hover:text-ink"
        >
          <X size={16} />
        </button>

        <p className="text-sm font-medium text-muted-2" aria-live="polite">
          {phase === 'done' ? 'Alle Sätze erledigt' : phase === 'rest' ? 'Satzpause' : `Satz ${setIndex + 1} von ${sets.length}`}
        </p>
        <h3 className="mt-1 px-8 font-display text-xl font-bold text-ink">{exercise.name}</h3>

        {/* C11: Satz-Fortschritt wie die Fortschrittsleiste der Einführung (erledigt = Primär, aktuell = Verlauf). */}
        <div className="mx-auto mt-4 flex max-w-[220px] gap-1.5" aria-hidden="true">
          {sets.map((_, i) => {
            const done = phase === 'done' || i < setIndex || (phase === 'rest' && i === setIndex);
            return (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  done ? 'bg-primary' : i === setIndex ? 'bg-gradient-to-r from-primary to-primary-dark opacity-60' : 'bg-surface-2'
                }`}
              />
            );
          })}
        </div>

        {phase === 'set' && (
          <>
            {/* C11: Gewicht groß in der Mitte, − / + links und rechts (je 56 px), Zahl antippen zum Eintippen. */}
            <div className="my-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => changeCurrentWeight(stepWeight(currentWeight, -1))}
                disabled={currentWeight === 0}
                aria-label="Gewicht um 2,5 kg verringern"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-bg-soft text-ink transition hover:bg-surface-2 disabled:opacity-30"
              >
                <Minus size={20} />
              </button>
              {weightDraft === null ? (
                <button
                  type="button"
                  onClick={() => setWeightDraft(weightToInput(currentWeight))}
                  aria-label={`Gewicht ${formatWeight(currentWeight)} – antippen zum Eintippen`}
                  className="min-w-0 flex-1 rounded-2xl px-2 py-2 transition hover:bg-bg-soft"
                >
                  <span className="block font-display text-4xl font-extrabold tabular-nums text-ink">
                    {currentWeight === 0 ? 'KG' : formatWeight(currentWeight).replace(' kg', '')}
                  </span>
                  <span className="block text-sm text-muted">{currentWeight === 0 ? 'Körpergewicht' : 'kg'}</span>
                </button>
              ) : (
                <form onSubmit={commitWeightDraft} noValidate className="min-w-0 flex-1">
                  <input
                    autoFocus
                    aria-label="Gewicht in kg"
                    type="text"
                    inputMode="decimal"
                    value={weightDraft}
                    onChange={(event) => {
                      setWeightDraft(event.target.value);
                      setWeightError('');
                    }}
                    onBlur={() => commitWeightDraft()}
                    placeholder="KG"
                    className="h-16 w-full rounded-2xl border border-primary bg-bg-soft text-center font-display text-3xl font-extrabold tabular-nums text-ink outline-none"
                  />
                </form>
              )}
              <button
                type="button"
                onClick={() => changeCurrentWeight(stepWeight(currentWeight, 1))}
                aria-label="Gewicht um 2,5 kg erhöhen"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-bg-soft text-ink transition hover:bg-surface-2"
              >
                <Plus size={20} />
              </button>
            </div>
            {weightError && (
              <p className="-mt-4 mb-4 text-sm font-medium text-danger" role="alert">
                {weightError}
              </p>
            )}

            <p className="mb-6 text-sm text-muted">
              <span className="font-display text-2xl font-extrabold text-ink">{current.reps}</span> Wiederholungen
              {currentWeight !== sets[setIndex].weightKg && (
                <span className="block text-xs text-muted-2">Vorlage: {formatWeight(sets[setIndex].weightKg)}</span>
              )}
            </p>

            <div className="flex gap-3">
              <button type="button" onClick={completeSet} className={primaryButton}>
                <Check size={18} />
                Satz erledigt
              </button>
            </div>
          </>
        )}

        {phase === 'rest' && (
          <>
            {/* C11: Ring wie beim Übungs-Timer. */}
            <div className="relative mx-auto my-8 flex h-52 w-52 items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-surface-2)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#rest-gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - restProgress)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
                <defs>
                  <linearGradient id="rest-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="var(--color-primary-dark)" />
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <span className="block font-display text-4xl font-extrabold tabular-nums text-ink">
                  {formatCountdown(restRemaining)}
                </span>
                {/* C11: „bis Satz n“ statt doppeltem „Pause“ (steht schon oben). */}
                <span className="text-xs text-muted-2">bis Satz {setIndex + 2}</span>
              </div>
            </div>
            <p className="mb-6 text-sm text-muted">
              Als Nächstes: Satz {setIndex + 2} · {sets[setIndex + 1].reps} Wdh. · {formatWeight(weights[setIndex + 1])}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={skipRest} className={primaryButton}>
                <SkipForward size={18} />
                Pause überspringen
              </button>
            </div>
          </>
        )}

        {phase === 'done' && (
          <>
            <p className="mb-4 mt-6 font-semibold text-accent">Übung abgeschlossen! 🎉</p>
            <ol className="mb-6 flex flex-col gap-1.5 text-left">
              {sets.map((s, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-bg-soft px-3 py-2 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-accent">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-ink">
                    {s.reps} × {formatWeight(weights[i])}
                  </span>
                  {weights[i] !== s.weightKg && <span className="text-xs text-muted-2">vorher {formatWeight(s.weightKg)}</span>}
                </li>
              ))}
            </ol>
            {changed ? (
              <>
                {/* C11: Gewichte nur auf Wunsch in die Vorlage übernehmen (Abstimmung im Team). */}
                <p className="mb-4 text-sm font-semibold text-ink">Neue Gewichte für das nächste Mal übernehmen?</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      applyStrengthWeights(exercise.id, weights);
                      onClose();
                    }}
                    className={primaryButton}
                  >
                    <Check size={18} />
                    Übernehmen
                  </button>
                  <button type="button" onClick={onClose} className={secondaryButton}>
                    Nur heute
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className={primaryButton}>
                  Fertig
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
