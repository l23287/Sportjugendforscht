import { useMemo, useState, type FormEvent } from 'react';
// C5: Navigate für den Schutz beim Bearbeiten von Plänen einer anderen Sportart.
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
// C6: Datum aus dem Kalender übernehmen (?datum=JJJJ-MM-TT).
import { isDateKey } from '../lib/dateKey';
// C7: Uhrzeit und Wiederholung.
import { PillSelect } from '../components/PillSelect';
// C9: Schalter „Zielgruppe“.
import { useTrainerFeatures } from '../context/TrainerFeaturesContext';
import { MAX_WEEK_INTERVAL, WEEKDAY_SHORT, describeRecurrence, nextOccurrence, weekdayOf } from '../lib/recurrence';
import { todayKey } from '../lib/dateKey';
import { formatDate } from '../lib/time';
import type { Recurrence } from '../types';

// C7: Auswahlwerte für die Pill-Buttons (gleiche Komponente wie Aufschlagtraining/Einstellungen).
type RepeatOption = 'Keine' | 'Wöchentlich' | 'Monatlich';
const REPEAT_OPTIONS: RepeatOption[] = ['Keine', 'Wöchentlich', 'Monatlich'];
type EndOption = 'Nie' | 'Am Datum';
const END_OPTIONS: EndOption[] = ['Nie', 'Am Datum'];
import { ArrowDown, ArrowUp, CalendarX, Check, ChevronLeft, Plus, Repeat, Star, Undo2, X } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { IconButton } from '../components/IconButton';
import { SearchInput } from '../components/SearchInput';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { inputClass, labelClass, selectClass, textareaClass } from '../lib/formStyles';
import { formatDuration } from '../lib/time';
import type { Exercise, PlanInput } from '../types';
// C18: Favoriten im Übungspool.
import { favoriteIds, usageScores } from '../lib/favorites';

// C5: Schutz vor dem Formular. Wird `/plaene/<id>/bearbeiten` mit einem Plan aufgerufen, der nicht zur aktiven
// Sportart gehört (oder nicht existiert), geht es zur Übersicht. Vorher wäre stattdessen ein leeres
// „Neuen Plan erstellen“-Formular erschienen, das beim Speichern einen NEUEN Plan angelegt hätte.
export function PlanForm() {
  const { id } = useParams<{ id: string }>();
  const { getPlan } = useAppData();
  if (id && !getPlan(id)) return <Navigate to="/plaene" replace />;
  // C5: `key` erzwingt ein neues Formular je Plan. Ohne key verwendet React dieselbe Instanz weiter, wenn man
  // direkt von /plaene/neu zu /plaene/<id>/bearbeiten wechselt – die leeren Felder des neuen Plans hätten dann
  // beim Speichern Zielgruppe und Übungen des bestehenden Plans überschrieben (im C5-Test entdeckt).
  return <PlanFormContent key={id ?? 'neu'} />;
}

function PlanFormContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exercises, plans, addPlan, updatePlan, exerciseLog } = useAppData();
  const editingPlan = id ? plans.find((plan) => plan.id === id) : undefined;
  const isEditing = Boolean(editingPlan);

  const [name, setName] = useState(editingPlan?.name ?? '');
  const [description, setDescription] = useState(editingPlan?.description ?? '');
  // C9: Auch bei ausgeschalteter Zielgruppe wird der gespeicherte Wert hier gehalten und beim Speichern unverändert
  //     mitgeschickt – Ausblenden darf nichts löschen.
  const [targetGroup, setTargetGroup] = useState(editingPlan?.targetGroup ?? '');
  const { features } = useTrainerFeatures();
  // C6: Neuer Plan aus dem Kalender („Neuer Plan für diesen Tag“) – Datum vorbelegen, sofern gültig.
  const [searchParams] = useSearchParams();
  const presetDate = searchParams.get('datum');
  const [date, setDate] = useState(editingPlan?.date ?? (isDateKey(presetDate) ? presetDate : ''));
  // C6: Aus dem Kalender gekommen → „Zurück“/„Abbrechen“ führt wieder in den Kalender.
  const backTarget = editingPlan ? `/plaene/${editingPlan.id}` : isDateKey(presetDate) ? '/kalender' : '/plaene';
  // C7: Uhrzeit und Wiederholung (Formularzustand; gespeichert wird eine Recurrence oder null).
  const [time, setTime] = useState(editingPlan?.time ?? '');
  const initialRule = editingPlan?.recurrence ?? null;
  const [repeat, setRepeat] = useState<RepeatOption>(
    initialRule?.freq === 'weekly' ? 'Wöchentlich' : initialRule?.freq === 'monthly' ? 'Monatlich' : 'Keine',
  );
  const [weekdays, setWeekdays] = useState<number[]>(initialRule?.weekdays ?? []);
  const [weekInterval, setWeekInterval] = useState(initialRule?.interval ?? 1);
  const [endOption, setEndOption] = useState<EndOption>(initialRule?.until ? 'Am Datum' : 'Nie');
  const [until, setUntil] = useState(initialRule?.until ?? '');
  // C7a: Ausgetragene Termine der Serie – bleiben beim Bearbeiten erhalten und lassen sich hier wiederherstellen.
  const [exceptions, setExceptions] = useState<string[]>(initialRule?.exceptions ?? []);
  const [exerciseIds, setExerciseIds] = useState<string[]>(editingPlan?.exerciseIds ?? []);
  const [poolQuery, setPoolQuery] = useState('');
  const [error, setError] = useState('');

  const selectedExercises = useMemo(
    () =>
      exerciseIds
        .map((exerciseId) => exercises.find((e) => e.id === exerciseId))
        .filter((e): e is Exercise => Boolean(e)),
    [exerciseIds, exercises],
  );

  const availableExercises = useMemo(() => {
    const q = poolQuery.trim().toLowerCase();
    return exercises
      .filter((exercise) => !exerciseIds.includes(exercise.id))
      .filter((exercise) => !q || exercise.name.toLowerCase().includes(q));
  }, [exercises, exerciseIds, poolQuery]);

  // C18: Favoriten = die (höchstens 5) meistgenutzten Übungen der Sportart (Pläne + Ausführungen der letzten 8 Wochen).
  // Ausgewählte Favoriten verschwinden wie jede Übung aus dem Pool; sind alle ausgewählt, entfällt der Abschnitt.
  const scores = useMemo(() => usageScores(exercises, plans, exerciseLog, todayKey()), [exercises, plans, exerciseLog]);
  const favorites = useMemo(() => favoriteIds(exercises, scores), [exercises, scores]);
  const poolSections = useMemo(() => {
    const favSet = new Set(favorites);
    const favs = favorites
      .map((id) => availableExercises.find((e) => e.id === id))
      .filter((e): e is Exercise => Boolean(e));
    const rest = availableExercises.filter((e) => !favSet.has(e.id));
    // Bei der Suche eine einzige Trefferliste (Favoriten zuerst, weiter hervorgehoben) – ohne Zwischenüberschriften.
    if (poolQuery.trim()) return [{ key: 'treffer', title: null, items: [...favs, ...rest] }];
    if (favs.length === 0) return [{ key: 'alle', title: null, items: rest }];
    return [
      { key: 'favoriten', title: 'Favoriten', items: favs },
      ...(rest.length > 0 ? [{ key: 'alle', title: 'Alle Übungen', items: rest }] : []),
    ];
  }, [favorites, availableExercises, poolQuery]);

  // C7: Wiederholung wählen – bei „Wöchentlich“ ohne Tage den Wochentag des Startdatums vorschlagen.
  function changeRepeat(option: RepeatOption) {
    setRepeat(option);
    if (option === 'Wöchentlich' && weekdays.length === 0 && isDateKey(date)) setWeekdays([weekdayOf(date)]);
  }

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  // C7: Aktuelle Regel aus dem Formular (ohne Prüfung) – für Vorschau und Speichern.
  const draftRule: Recurrence | null =
    repeat === 'Keine'
      ? null
      : {
          freq: repeat === 'Wöchentlich' ? 'weekly' : 'monthly',
          interval: repeat === 'Wöchentlich' ? weekInterval : 1,
          weekdays: repeat === 'Wöchentlich' ? weekdays : [],
          until: endOption === 'Am Datum' && isDateKey(until) ? until : null,
          exceptions,
        };
  // C7: Vorschau „Ergibt: …“ inkl. nächstem Termin, damit die Regel vor dem Speichern nachvollziehbar ist.
  const previewNext =
    draftRule && isDateKey(date) && (draftRule.freq === 'monthly' || draftRule.weekdays.length > 0)
      ? nextOccurrence({ date, recurrence: draftRule }, todayKey())
      : null;

  function addExerciseToPlan(exerciseId: string) {
    setExerciseIds((prev) => [...prev, exerciseId]);
  }

  function removeExerciseFromPlan(exerciseId: string) {
    setExerciseIds((prev) => prev.filter((eid) => eid !== exerciseId));
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setExerciseIds((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Bitte gib einen Namen für den Plan ein.');
      return;
    }
    // C7: Prüfregeln für Wiederholungen.
    if (draftRule) {
      if (!isDateKey(date)) {
        setError('Für eine Wiederholung brauchst du ein Startdatum.');
        return;
      }
      if (draftRule.freq === 'weekly' && draftRule.weekdays.length === 0) {
        setError('Bitte wähle mindestens einen Wochentag.');
        return;
      }
      if (endOption === 'Am Datum' && !isDateKey(until)) {
        setError('Bitte gib ein Enddatum für die Wiederholung an.');
        return;
      }
      if (draftRule.until && draftRule.until < date) {
        setError('Das Enddatum darf nicht vor dem Startdatum liegen.');
        return;
      }
    }
    const input: PlanInput = {
      name: name.trim(),
      description: description.trim(),
      targetGroup: targetGroup.trim(),
      date: date || null,
      exerciseIds,
      // C7: Uhrzeit und Wiederholung speichern.
      time: time || null,
      recurrence: draftRule,
    };
    if (editingPlan) {
      updatePlan(editingPlan.id, input);
      navigate(`/plaene/${editingPlan.id}`);
    } else {
      const plan = addPlan(input);
      navigate(`/plaene/${plan.id}`);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-3">
        <IconButton icon={<ChevronLeft size={18} />} label="Zurück" onClick={() => navigate(backTarget)} />
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
          {isEditing ? 'Plan bearbeiten' : 'Neuen Plan erstellen'}
        </h1>
      </div>

      {/* C7: noValidate – sonst blockiert die Browser-Prüfung (z. B. min am Enddatum) das Absenden mit einer eigenen
          Sprechblase, und die einheitlich gestaltete Fehlermeldung der App erscheint nicht (wie C4 im Übungsformular). */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <section className="grid grid-cols-1 gap-5 rounded-3xl border border-border bg-surface p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="plan-name">
              Name
            </label>
            <input
              id="plan-name"
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="z. B. Techniktraining U14"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="plan-description">
              Beschreibung
            </label>
            <textarea
              id="plan-description"
              className={textareaClass}
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Worum geht es in dieser Einheit?"
            />
          </div>
          {/* C7: Volle Breite, da Datum in den neuen Abschnitt „Termin“ umgezogen ist.
              C9: Nur bei eingeschalteter Trainer-Funktion „Zielgruppe“. */}
          {features.targetGroup && (
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="plan-target-group">
                Zielgruppe
              </label>
              <input
                id="plan-target-group"
                className={inputClass}
                value={targetGroup}
                onChange={(event) => setTargetGroup(event.target.value)}
                placeholder="z. B. U14, Fortgeschrittene"
              />
            </div>
          )}
        </section>

        {/* C7: Eigener Abschnitt „Termin“ – Datum, Uhrzeit und Wiederholung. Gleicher Kartenstil wie die übrigen
            Formularabschnitte; Auswahl über die vorhandenen Pill-Buttons, Felder mit inputClass/selectClass. */}
        <section aria-labelledby="plan-schedule-title" className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-5">
          <h2 id="plan-schedule-title" className="font-display text-lg font-bold text-ink">
            Termin
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="plan-date">
                {/* C7: Bei Wiederholung ist das Datum der erste Termin der Serie. */}
                {repeat === 'Keine' ? 'Datum (optional)' : 'Startdatum'}
              </label>
              <input
                id="plan-date"
                type="date"
                className={`${inputClass} [color-scheme:dark]`}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="plan-time">
                Uhrzeit (optional)
              </label>
              <input
                id="plan-time"
                type="time"
                className={`${inputClass} [color-scheme:dark]`}
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>

          <PillSelect label="Wiederholung" options={REPEAT_OPTIONS} value={repeat} onChange={changeRepeat} />

          {repeat === 'Wöchentlich' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto]">
              <div>
                <p className={labelClass} id="plan-weekdays-label">
                  Wochentage
                </p>
                {/* C7: Mehrfachauswahl im Stil der Pill-Buttons; aria-pressed zeigt den Zustand an. */}
                <div role="group" aria-labelledby="plan-weekdays-label" className="flex flex-wrap gap-2">
                  {WEEKDAY_SHORT.map((label, day) => {
                    const active = weekdays.includes(day);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleWeekday(day)}
                        aria-pressed={active}
                        className={`h-11 w-12 rounded-2xl border text-sm font-semibold transition ${
                          active
                            ? 'border-transparent bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_8px_18px_rgba(37,99,235,0.3)]'
                            : 'border-border bg-bg-soft text-muted hover:text-ink'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="plan-interval">
                  Abstand
                </label>
                <select
                  id="plan-interval"
                  className={`${selectClass} sm:w-48`}
                  value={weekInterval}
                  onChange={(event) => setWeekInterval(Number(event.target.value))}
                >
                  {Array.from({ length: MAX_WEEK_INTERVAL }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? 'Jede Woche' : `Alle ${n} Wochen`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {repeat !== 'Keine' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:items-end">
              <PillSelect label="Endet" options={END_OPTIONS} value={endOption} onChange={setEndOption} />
              {endOption === 'Am Datum' && (
                <div>
                  <label className={labelClass} htmlFor="plan-until">
                    Letzter möglicher Termin
                  </label>
                  <input
                    id="plan-until"
                    type="date"
                    min={isDateKey(date) ? date : undefined}
                    className={`${inputClass} [color-scheme:dark]`}
                    value={until}
                    onChange={(event) => setUntil(event.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* C7a: Ausgetragene Termine als Chips (Stil der Info-Chips); ✕ stellt einen Termin wieder her. */}
          {repeat !== 'Keine' && exceptions.length > 0 && (
            <div>
              <p className={labelClass}>Ausgetragene Termine</p>
              <ul className="flex flex-wrap gap-2">
                {exceptions.map((day) => (
                  <li key={day}>
                    <span className="inline-flex items-center gap-1.5 rounded-2xl bg-surface-2 py-1 pl-3 pr-1 text-xs font-semibold text-muted">
                      <CalendarX size={13} aria-hidden="true" />
                      <span className="line-through decoration-muted-2">{formatDate(day)}</span>
                      <button
                        type="button"
                        onClick={() => setExceptions((prev) => prev.filter((d) => d !== day))}
                        aria-label={`Termin am ${formatDate(day)} wiederherstellen`}
                        title="Wiederherstellen"
                        className="flex h-6 w-6 items-center justify-center rounded-xl transition hover:bg-black/20 hover:text-ink"
                      >
                        <Undo2 size={13} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* C7: Zusammenfassung der Regel in Klartext, im Stil der Info-Chips (primary-soft/accent). */}
          {draftRule && isDateKey(date) && (draftRule.freq === 'monthly' || draftRule.weekdays.length > 0) && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-primary-soft px-4 py-3 text-sm text-accent">
              <Repeat size={16} aria-hidden="true" />
              <span className="font-semibold">{describeRecurrence(draftRule, date)}</span>
              {time && <span>· {time} Uhr</span>}
              <span className="text-muted">
                {previewNext ? `· nächster Termin ${formatDate(previewNext)}` : '· keine weiteren Termine'}
              </span>
            </p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-bold text-ink">Übungspool</h2>
            <SearchInput value={poolQuery} onChange={setPoolQuery} placeholder="Übung suchen…" />
            <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
              {availableExercises.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-2">Keine Übungen gefunden.</p>
              )}
              {/* C18: Abschnitte „Favoriten“ und „Alle Übungen“ (Zwischenüberschriften im Stil von „Gewichte“/„Stoppuhr“
                  in den Statistiken). Favoriten leicht hervorgehoben: getönte Fläche + feiner blauer Rand, App-Blau statt
                  Sport- oder Streakfarbe; darunter „★ n× genutzt“, damit klar ist, warum die Übung oben steht. */}
              {poolSections.map((section) => (
                <div key={section.key} className="flex flex-col gap-2">
                  {section.title && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-2">
                      {section.key === 'favoriten' && <Star size={12} className="text-accent" fill="currentColor" aria-hidden="true" />}
                      {section.title}
                    </p>
                  )}
                  {section.items.map((exercise) => {
                    const isFavorite = favorites.includes(exercise.id);
                    const score = scores.get(exercise.id)?.score ?? 0;
                    return (
                      <button
                        type="button"
                        key={exercise.id}
                        onClick={() => addExerciseToPlan(exercise.id)}
                        aria-label={isFavorite ? `${exercise.name} hinzufügen (Favorit, ${score}× genutzt)` : undefined}
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition hover:border-primary ${
                          isFavorite ? 'border-primary/30 bg-primary-soft/40' : 'border-border bg-bg-soft'
                        }`}
                      >
                        <span className="min-w-0">
                          {/* C18: „★ n× genutzt“ in der Namenszeile – so bleibt die zweite Zeile wie bisher und am Handy
                              entsteht kein Umbruch (im Test gefunden: neben „Fortgeschritten“ rutschte der Hinweis um). */}
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="block truncate text-sm font-semibold text-ink">{exercise.name}</span>
                            {isFavorite && (
                              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-accent">
                                <Star size={11} fill="currentColor" aria-hidden="true" />
                                {score}× genutzt
                              </span>
                            )}
                          </span>
                          <span className="mt-1.5 flex items-center gap-2 text-xs text-muted-2">
                            <DifficultyBadge difficulty={exercise.difficulty} />
                            {formatDuration(exercise.durationSeconds) /* C4: sekundengenau */}
                          </span>
                        </span>
                        <Plus size={18} className="shrink-0 text-primary" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-bold text-ink">
              Ausgewählte Übungen {selectedExercises.length > 0 && `(${selectedExercises.length})`}
            </h2>
            {selectedExercises.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-2">
                Noch keine Übungen ausgewählt. Wähle Übungen aus dem Pool aus.
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {selectedExercises.map((exercise, index) => (
                  <li
                    key={exercise.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-bg-soft px-4 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-xs font-bold text-accent">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{exercise.name}</span>
                      <span className="mt-1.5 flex items-center gap-2 text-xs text-muted-2">
                        <DifficultyBadge difficulty={exercise.difficulty} />
                        {formatDuration(exercise.durationSeconds) /* C4: sekundengenau */}
                      </span>
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveExercise(index, -1)}
                        aria-label="Nach oben verschieben"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={index === selectedExercises.length - 1}
                        onClick={() => moveExercise(index, 1)}
                        aria-label="Nach unten verschieben"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExerciseFromPlan(exercise.id)}
                        aria-label="Entfernen"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-danger/10 hover:text-danger"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="flex flex-col gap-3 md:flex-row">
          <PrimaryButton type="submit" icon={<Check size={18} />} className="w-full md:w-auto">
            {isEditing ? 'Änderungen speichern' : 'Plan erstellen'}
          </PrimaryButton>
          <PrimaryButton
            type="button"
            variant="ghost"
            className="w-full border border-border md:w-auto"
            onClick={() => navigate(backTarget)}
          >
            Abbrechen
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
