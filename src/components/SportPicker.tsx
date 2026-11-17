// C1: Neue Komponente – Sportart-Auswahl für die Einstellungen.
// Ersetzt die PillSelect-Auswahl, die bei 25+ Optionen (vor allem am Handy) unübersichtlich wäre:
// aktuelle Sportart oben, darunter Suche, nach Kategorien gruppierte Liste und Formular für eigene Sportarten.
// C2: Sporticons mit farbiger Umrandung (SportBadge); Symbol + Farbe für eigene Sportarten wählbar und änderbar.
// C2c: Wie oben rechts (C2b) ist jetzt das GESAMTE Element in der Sportfarbe umrandet (Chips, aktuelle Sportart,
// Vorschauen) statt nur das Emoji-Kästchen.
import { useMemo, useState, type FormEvent } from 'react';
import { Check, Pencil, Plus, X } from 'lucide-react';
import { useSport } from '../context/SportContext';
// C5: Pläne/Übungen einer eigenen Sportart werden beim Löschen mit entfernt.
import { useAppData } from '../context/AppDataContext';
import { SearchInput } from './SearchInput';
import { PrimaryButton } from './PrimaryButton';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
// C2c: SportBadge wird hier nicht mehr benötigt; Rahmen über gemeinsamen Stil-Helfer.
import { sportGlowStyle } from '../lib/sportStyle';
import { SportAppearancePicker } from './SportAppearancePicker';
import { inputClass, labelClass } from '../lib/formStyles';
import {
  CUSTOM_SPORT_DEFAULT_COLOR,
  CUSTOM_SPORT_EMOJI,
  SPORT_NAME_MAX_LENGTH,
  cleanSportName,
  normalizeSportName,
  type SportAppearance,
} from '../lib/sport';
import { SPORT_CATEGORIES, type Sport } from '../types';

export function SportPicker() {
  const { sport: activeSport, sports, setSport, addCustomSport, updateCustomSport, removeCustomSport } = useSport();
  const { countSportData, deleteSportData } = useAppData();
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Sport | null>(null);
  // C2: Symbol/Farbe für die nächste neue eigene Sportart.
  const [newAppearance, setNewAppearance] = useState<SportAppearance>({
    emoji: CUSTOM_SPORT_EMOJI,
    color: CUSTOM_SPORT_DEFAULT_COLOR,
  });
  // C2: Eigene Sportart, deren Symbol/Farbe gerade bearbeitet wird (inkl. Entwurf bis zum Speichern).
  const [editing, setEditing] = useState<{ sport: Sport; draft: SportAppearance } | null>(null);

  // C1: Suche ignoriert Groß-/Kleinschreibung und überflüssige Leerzeichen.
  const groups = useMemo(() => {
    const needle = normalizeSportName(query);
    const filtered = needle ? sports.filter((s) => normalizeSportName(s.name).includes(needle)) : sports;
    return SPORT_CATEGORIES.map((category) => ({
      category,
      items: filtered
        .filter((s) => s.category === category)
        .sort((a, b) => a.name.localeCompare(b.name, 'de')),
    })).filter((group) => group.items.length > 0);
  }, [sports, query]);

  function submitName(name: string) {
    // C2: Gewähltes Symbol + Farbe mitgeben.
    const result = addCustomSport(name, newAppearance);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // C1: Neu angelegte Sportart direkt auswählen – das ist in der Regel die Absicht.
    setSport(result.sport.id);
    setNewName('');
    setQuery('');
    setError('');
    // C2: Auswahl für die nächste Sportart zurücksetzen.
    setNewAppearance({ emoji: CUSTOM_SPORT_EMOJI, color: CUSTOM_SPORT_DEFAULT_COLOR });
  }

  // C2: Änderungen erst beim Speichern übernehmen (Abbrechen verwirft den Entwurf).
  function saveEditing() {
    if (editing) updateCustomSport(editing.sport.id, editing.draft);
    setEditing(null);
  }

  function startEditing(item: Sport) {
    setEditing({ sport: item, draft: { emoji: item.emoji, color: item.color } });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submitName(newName);
  }

  function confirmDelete() {
    // C5: Erst die Daten der Sportart löschen, dann die Sportart selbst – so bleiben keine unsichtbaren,
    // verwaisten Pläne/Übungen im Speicher zurück (eine neu angelegte Sportart bekäme ohnehin eine neue ID).
    if (pendingDelete) {
      deleteSportData(pendingDelete.id);
      removeCustomSport(pendingDelete.id);
    }
    setPendingDelete(null);
  }

  const cleanedQuery = cleanSportName(query);

  return (
    <div className="flex flex-col gap-5">
      {/* C1: Aktuelle Auswahl gut sichtbar oben. */}
      {/* C2c: Ganze Karte in der Sportfarbe umrandet (2 px) und leicht getönt, Emoji ohne eigenes Kästchen.
          C15: jetzt dezentes Leuchten statt 2-px-Rahmen. */}
      <div className="flex items-center gap-3 rounded-2xl border p-4" style={sportGlowStyle(activeSport.color)}>
        {/* C2: Großes Sporticon mit Umrandung in der Sportfarbe. */}
        <span className="text-4xl leading-none" aria-hidden="true">
          {activeSport.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-2">Aktuelle Sportart</p>
          <p className="truncate font-display text-lg font-bold text-ink">{activeSport.name}</p>
        </div>
        {/* C2: Eigene Sportarten lassen sich auch hier direkt anpassen. */}
        {activeSport.custom && (
          <PrimaryButton
            variant="ghost"
            className="h-10 shrink-0 border border-border px-3 text-sm"
            icon={<Pencil size={14} />}
            onClick={() => startEditing(activeSport)}
          >
            Anpassen
          </PrimaryButton>
        )}
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Sportart suchen…" />

      {groups.length === 0 ? (
        // C1: Kein Treffer → Suchbegriff direkt als eigene Sportart anbieten.
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border p-4">
          <p className="text-sm text-muted">Keine Sportart zu „{cleanedQuery}“ gefunden.</p>
          {cleanedQuery.length <= SPORT_NAME_MAX_LENGTH && (
            <PrimaryButton variant="ghost" className="h-11 border border-border px-4" icon={<Plus size={16} />} onClick={() => submitName(query)}>
              „{cleanedQuery}“ als eigene Sportart hinzufügen
            </PrimaryButton>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <section key={group.category} aria-label={group.category}>
              <p className={labelClass}>{group.category}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <SportChip
                    key={item.id}
                    sport={item}
                    selected={item.id === activeSport.id}
                    onSelect={() => setSport(item.id)}
                    onEdit={item.custom ? () => startEditing(item) : undefined}
                    onDelete={item.custom ? () => setPendingDelete(item) : undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* C1: Eigene Sportart per Eingabe hinzufügen. */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-border pt-5" noValidate>
        <label className={labelClass} htmlFor="custom-sport-name">
          Eigene Sportart hinzufügen
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="custom-sport-name"
            className={inputClass}
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value);
              if (error) setError('');
            }}
            placeholder="z. B. Ultimate Frisbee"
            maxLength={SPORT_NAME_MAX_LENGTH + 10}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'custom-sport-error' : undefined}
          />
          <PrimaryButton type="submit" icon={<Plus size={18} />} className="shrink-0">
            Hinzufügen
          </PrimaryButton>
        </div>
        {error && (
          <p id="custom-sport-error" className="text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        )}
        {/* C2: Symbol + Farbe der neuen Sportart wählen, mit Live-Vorschau. */}
        <div className="mt-2 flex flex-col gap-4 rounded-2xl border border-border bg-bg-soft p-4">
          {/* C2c: Vorschau zeigt die ganze Umrandung so, wie sie später in Auswahl und Kopfzeile erscheint. */}
          <div className="flex items-center gap-3 rounded-2xl border p-3" style={sportGlowStyle(newAppearance.color)}>
            <span className="text-2xl leading-none" aria-hidden="true">
              {newAppearance.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-2">Vorschau</p>
              <p className="truncate font-semibold text-ink">{cleanSportName(newName) || 'Neue Sportart'}</p>
            </div>
          </div>
          <SportAppearancePicker idPrefix="new-sport" value={newAppearance} onChange={setNewAppearance} />
        </div>
      </form>

      {/* C2: Dialog zum nachträglichen Ändern von Symbol und Farbe einer eigenen Sportart. */}
      <Modal open={editing !== null} title="Sportart anpassen" onClose={() => setEditing(null)}>
        {editing && (
          <div className="flex flex-col gap-5">
            {/* C2c: Vorschau im Dialog mit Umrandung des ganzen Elements. */}
            <div className="flex items-center gap-3 rounded-2xl border p-4" style={sportGlowStyle(editing.draft.color)}>
              <span className="text-3xl leading-none" aria-hidden="true">
                {editing.draft.emoji}
              </span>
              <p className="truncate font-display text-lg font-bold text-ink">{editing.sport.name}</p>
            </div>
            <SportAppearancePicker
              idPrefix="edit-sport"
              value={editing.draft}
              onChange={(draft) => setEditing({ ...editing, draft })}
            />
            <div className="flex gap-3">
              <PrimaryButton variant="ghost" className="h-12 flex-1 border border-border" onClick={() => setEditing(null)}>
                Abbrechen
              </PrimaryButton>
              <PrimaryButton className="h-12 flex-1" onClick={saveEditing}>
                Speichern
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Sportart löschen?"
        // C5: Dialog nennt, wie viele Pläne/Übungen mitgelöscht werden.
        description={pendingDelete ? deleteDescription(pendingDelete, activeSport.id, countSportData(pendingDelete.id)) : undefined}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

// C5: Text für den Löschdialog, z. B. „„Floorball“ und 3 Pläne und 12 Übungen werden gelöscht.“
function deleteDescription(
  sport: Sport,
  activeSportId: string,
  counts: { plans: number; exercises: number; goals: number; stopwatchValues: number; notes: number },
): string {
  const parts: string[] = [];
  if (counts.plans > 0) parts.push(`${counts.plans} ${counts.plans === 1 ? 'Plan' : 'Pläne'}`);
  if (counts.exercises > 0) parts.push(`${counts.exercises} ${counts.exercises === 1 ? 'Übung' : 'Übungen'}`);
  // C8: Kernziele werden mitgelöscht und daher mitgenannt.
  if (counts.goals > 0) parts.push(`${counts.goals} ${counts.goals === 1 ? 'Kernziel' : 'Kernziele'}`);
  // C12: Gespeicherte Stoppuhr-Werte werden ebenfalls mitgelöscht.
  // C13: Notizen ebenfalls nennen.
  if (counts.notes > 0) parts.push(`${counts.notes} ${counts.notes === 1 ? 'Notiz' : 'Notizen'}`);
  if (counts.stopwatchValues > 0) {
    parts.push(`${counts.stopwatchValues} ${counts.stopwatchValues === 1 ? 'Stoppuhr-Wert' : 'Stoppuhr-Werte'}`);
  }
  // C8: Aufzählung „A, B und C“ statt „A und B und C“.
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} und ${parts[parts.length - 1]}` : parts[0];
  const main =
    parts.length > 0
      ? `„${sport.name}“ und ${list} werden unwiderruflich gelöscht.`
      : `„${sport.name}“ wird aus deiner Liste entfernt.`;
  const fallback = sport.id === activeSportId ? ' Da sie gerade aktiv ist, wird Tischtennis ausgewählt.' : '';
  return main + fallback;
}

// C1: Kompakter Auswahl-Chip; eigene Sportarten bekommen zusätzlich einen Lösch-Button.
// C2: Emoji als SportBadge mit Sportfarbe; eigene Sportarten zusätzlich mit Bearbeiten-Button.
function SportChip({
  sport,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  sport: Sport;
  selected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    // C15: Statt voller Umrandung dezentes Leuchten; ausgewählt = stärkeres Leuchten + Häkchen + helle Schrift
    //      (der weiße Ring entfällt – er wirkte wie eine zweite, harte Umrandung).
    // C2c: Ganzer Chip in der Sportfarbe umrandet. Ausgewählt = stärker getönt + weißer Ring + Häkchen
    // (statt blauem Verlauf, der die Sportfarbe überdecken würde).
    <span
      style={sportGlowStyle(sport.color, selected ? 'strong' : 'soft')}
      className={`inline-flex h-10 items-center rounded-2xl border text-sm font-semibold transition ${
        selected
          ? 'text-ink'
          : 'text-muted hover:text-ink'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`inline-flex h-full items-center gap-2 ${onDelete ? 'pl-3 pr-1.5' : 'px-3'}`}
      >
        {/* C2c: Emoji ohne eigenes Kästchen – die Umrandung trägt der ganze Chip. */}
        <span aria-hidden="true">{sport.emoji}</span>
        <span className="max-w-[12rem] truncate">{sport.name}</span>
        {selected && <Check size={14} aria-hidden="true" />}
      </button>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${sport.name} anpassen`}
          title={`${sport.name} anpassen`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-xl opacity-70 transition hover:bg-black/20 hover:opacity-100"
        >
          <Pencil size={13} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`${sport.name} löschen`}
          title={`${sport.name} löschen`}
          className="mr-1.5 inline-flex h-7 w-7 items-center justify-center rounded-xl opacity-70 transition hover:bg-black/20 hover:opacity-100"
        >
          <X size={14} />
        </button>
      )}
    </span>
  );
}
