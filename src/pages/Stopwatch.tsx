// C12: Neue Seite – Stoppuhr im Übungsbereich (Reiter „Stoppuhr“, alle Sportarten).
// Große Zeit auf Hundertstel in derselben Schrift/Ziffernform wie Timer und Satz-Ansicht; feste Button-Positionen
// (Start/Stopp links als Hauptaktion, Zurücksetzen rechts, „Wert speichern“ darunter). Speichern geht auch während die
// Uhr läuft (Zwischenzeit). Bis zu 10 benannte Werte je Sportart – Liste im Stil der Kernziele (C8).
import { useEffect, useState, type FormEvent } from 'react';
import { Flag, Pause, Pencil, Play, RotateCcw, Timer as TimerIcon, Trash2, Trophy } from 'lucide-react';
import { useStopwatch } from '../context/StopwatchContext';
import { useAppData } from '../context/AppDataContext';
import { useSport } from '../context/SportContext';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { inputClass, labelClass } from '../lib/formStyles';
import { MAX_STOPWATCH_VALUES, STOPWATCH_NAME_MAX_LENGTH, bestValueId, elapsedMs, formatStopwatch } from '../lib/stopwatch';
import { formatDateTime } from '../lib/time';
import { PLAN_STATUS_META } from '../lib/planStatus';
import type { StopwatchValue } from '../types';

const primaryButton =
  'flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-dark font-semibold text-white shadow-[0_10px_25px_rgba(37,99,235,0.35)] transition hover:brightness-110';
const secondaryButton =
  'flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-border font-semibold text-muted transition hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-40';

export function Stopwatch() {
  const { state, running, start, stop, reset } = useStopwatch();
  const { stopwatchValues, addStopwatchValue, renameStopwatchValue, deleteStopwatchValue } = useAppData();
  const { sport } = useSport();

  // C12: Anzeige pro Bildschirm-Frame aus den Zeitstempeln berechnen (flüssige Hundertstel, keine Abweichung).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return undefined;
    let frame = requestAnimationFrame(function tick() {
      setNow(Date.now());
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [running]);
  const elapsed = running ? elapsedMs(state, now) : elapsedMs(state);

  const [saveDraft, setSaveDraft] = useState<{ ms: number; name: string; error: string } | null>(null);
  const [renameDraft, setRenameDraft] = useState<{ value: StopwatchValue; name: string; error: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StopwatchValue | null>(null);

  const isFull = stopwatchValues.length >= MAX_STOPWATCH_VALUES;
  const bestId = bestValueId(stopwatchValues);

  function openSave() {
    // C12: Zeit im Moment des Klicks festhalten – auch wenn die Uhr weiterläuft (Zwischenzeit).
    setSaveDraft({ ms: elapsedMs(state), name: `Messung ${stopwatchValues.length + 1}`, error: '' });
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!saveDraft) return;
    const result = addStopwatchValue(saveDraft.name, saveDraft.ms);
    if (!result.ok) return setSaveDraft({ ...saveDraft, error: result.error });
    setSaveDraft(null);
  }

  function handleRename(event: FormEvent) {
    event.preventDefault();
    if (!renameDraft) return;
    const result = renameStopwatchValue(renameDraft.value.id, renameDraft.name);
    if (!result.ok) return setRenameDraft({ ...renameDraft, error: result.error });
    setRenameDraft(null);
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* C12: Uhr-Karte im Kartenstil der App. */}
      <section aria-label="Stoppuhr" className="flex flex-col gap-6 rounded-3xl border border-border bg-surface p-5 sm:p-8">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-2">{running ? 'Läuft' : elapsed > 0 ? 'Angehalten' : 'Bereit'}</p>
          {/* C12: Zeit – tabellarische Ziffern, damit die Zahl beim Laufen nicht „springt“. Für Screenreader nur beim
              Anhalten angesagt (laufende Hundertstel wären unbrauchbar). */}
          <p
            className="mt-2 font-display text-6xl font-extrabold tabular-nums tracking-tight text-ink sm:text-7xl"
            aria-live={running ? 'off' : 'polite'}
          >
            {formatStopwatch(elapsed)}
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-col gap-3">
          <div className="flex gap-3">
            <button type="button" onClick={running ? stop : start} className={primaryButton}>
              {running ? <Pause size={18} /> : <Play size={18} />}
              {running ? 'Stopp' : elapsed > 0 ? 'Weiter' : 'Start'}
            </button>
            <button type="button" onClick={reset} disabled={running || elapsed === 0} className={secondaryButton}>
              <RotateCcw size={18} />
              Zurücksetzen
            </button>
          </div>
          {isFull ? (
            // C12: Obergrenze sichtbar machen – nichts wird still überschrieben (wie bei den Kernzielen).
            <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted">
              Maximal {MAX_STOPWATCH_VALUES} Werte. Lösche einen, um einen neuen zu speichern.
            </p>
          ) : (
            <button
              type="button"
              onClick={openSave}
              disabled={elapsed === 0}
              // C12: flex-none – mit flex-1 fiel die Höhe in der senkrechten Anordnung zusammen (im Test gefunden).
              className={`${secondaryButton} flex-none`}
            >
              <Flag size={18} className="text-accent" />
              Wert speichern
            </button>
          )}
        </div>
      </section>

      {/* C12: Gespeicherte Werte der aktiven Sportart. */}
      <section aria-labelledby="stopwatch-values-title" className="flex flex-col gap-3">
        <h2 id="stopwatch-values-title" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          Gespeicherte Werte
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
            {stopwatchValues.length}/{MAX_STOPWATCH_VALUES}
          </span>
        </h2>

        {stopwatchValues.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted">
            <TimerIcon size={18} className="shrink-0 text-muted-2" aria-hidden="true" />
            Noch keine Werte für {sport.name}. Miss eine Zeit und tippe auf „Wert speichern“.
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {stopwatchValues.map((value) => {
              const isBest = value.id === bestId;
              return (
                <li
                  key={value.id}
                  className={`flex items-center gap-3 rounded-2xl border bg-surface p-3 sm:p-4 ${isBest ? 'border-accent/60' : 'border-border'}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-ink">{value.name}</span>
                      {/* C12: Bestwert-Badge in den Farben des „Heute“-Badges (C6a), mit Pokal-Symbol. */}
                      {isBest && (
                        <span className={`inline-flex items-center gap-1 rounded-2xl px-2.5 py-0.5 text-xs font-semibold ${PLAN_STATUS_META.heute.badgeClass}`}>
                          <Trophy size={12} aria-hidden="true" /> Bestwert
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-2">{formatDateTime(value.recordedAt)}</p>
                  </div>
                  <span className="shrink-0 font-display text-xl font-extrabold tabular-nums text-ink">{formatStopwatch(value.ms)}</span>
                  <div className="flex shrink-0 gap-1.5">
                    <IconButton
                      icon={<Pencil size={16} />}
                      label={`„${value.name}“ umbenennen`}
                      onClick={() => setRenameDraft({ value, name: value.name, error: '' })}
                    />
                    <IconButton icon={<Trash2 size={16} />} label={`„${value.name}“ löschen`} onClick={() => setPendingDelete(value)} />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* C12: Benennen beim Speichern – Zeit groß zur Kontrolle, Name vorbelegt („Messung 3“). */}
      <Modal open={saveDraft !== null} title="Wert speichern" onClose={() => setSaveDraft(null)}>
        {saveDraft && (
          <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
            <p className="text-center font-display text-4xl font-extrabold tabular-nums text-ink">{formatStopwatch(saveDraft.ms)}</p>
            <div>
              <label className={labelClass} htmlFor="stopwatch-name">
                Name
              </label>
              <input
                id="stopwatch-name"
                autoFocus
                className={inputClass}
                value={saveDraft.name}
                maxLength={STOPWATCH_NAME_MAX_LENGTH + 10}
                onChange={(event) => setSaveDraft({ ...saveDraft, name: event.target.value, error: '' })}
                onFocus={(event) => event.target.select()}
                placeholder="z. B. Sprint 30 m"
              />
            </div>
            {saveDraft.error && (
              <p className="text-sm font-medium text-danger" role="alert">
                {saveDraft.error}
              </p>
            )}
            <div className="flex gap-3">
              <PrimaryButton variant="ghost" className="h-12 flex-1 border border-border" onClick={() => setSaveDraft(null)}>
                Abbrechen
              </PrimaryButton>
              <PrimaryButton type="submit" className="h-12 flex-1">
                Speichern
              </PrimaryButton>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={renameDraft !== null} title="Wert umbenennen" onClose={() => setRenameDraft(null)}>
        {renameDraft && (
          <form onSubmit={handleRename} noValidate className="flex flex-col gap-4">
            <div>
              <label className={labelClass} htmlFor="stopwatch-rename">
                Name
              </label>
              <input
                id="stopwatch-rename"
                autoFocus
                className={inputClass}
                value={renameDraft.name}
                maxLength={STOPWATCH_NAME_MAX_LENGTH + 10}
                onChange={(event) => setRenameDraft({ ...renameDraft, name: event.target.value, error: '' })}
              />
            </div>
            {renameDraft.error && (
              <p className="text-sm font-medium text-danger" role="alert">
                {renameDraft.error}
              </p>
            )}
            <div className="flex gap-3">
              <PrimaryButton variant="ghost" className="h-12 flex-1 border border-border" onClick={() => setRenameDraft(null)}>
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
        title="Wert löschen?"
        description={pendingDelete ? `„${pendingDelete.name}“ (${formatStopwatch(pendingDelete.ms)}) wird entfernt.` : undefined}
        onConfirm={() => {
          if (pendingDelete) deleteStopwatchValue(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
