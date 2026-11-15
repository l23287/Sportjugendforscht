// C1: Neue Komponente – Sportart-Auswahl für die Einstellungen.
// Ersetzt die PillSelect-Auswahl, die bei 25+ Optionen (vor allem am Handy) unübersichtlich wäre:
// aktuelle Sportart oben, darunter Suche, nach Kategorien gruppierte Liste und Formular für eigene Sportarten.
// C2: Sporticons mit farbiger Umrandung (SportBadge); Symbol + Farbe für eigene Sportarten wählbar und änderbar.
import { useMemo, useState, type FormEvent } from 'react';
import { Check, Pencil, Plus, X } from 'lucide-react';
import { useSport } from '../context/SportContext';
import { SearchInput } from './SearchInput';
import { PrimaryButton } from './PrimaryButton';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import { SportBadge } from './SportBadge';
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
    if (pendingDelete) removeCustomSport(pendingDelete.id);
    setPendingDelete(null);
  }

  const cleanedQuery = cleanSportName(query);

  return (
    <div className="flex flex-col gap-5">
      {/* C1: Aktuelle Auswahl gut sichtbar oben. */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg-soft p-4">
        {/* C2: Großes Sporticon mit Umrandung in der Sportfarbe. */}
        <SportBadge sport={activeSport} size="lg" />
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
          <div className="flex items-center gap-3">
            <SportBadge
              sport={{ ...newAppearance, name: cleanSportName(newName) || 'Vorschau' }}
              size="md"
            />
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
            <div className="flex items-center gap-3">
              <SportBadge sport={{ ...editing.draft, name: editing.sport.name }} size="lg" />
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
        description={
          pendingDelete
            ? `„${pendingDelete.name}“ wird aus deiner Liste entfernt.${
                pendingDelete.id === activeSport.id ? ' Da sie gerade aktiv ist, wird Tischtennis ausgewählt.' : ''
              }`
            : undefined
        }
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
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
    <span
      className={`inline-flex h-10 items-center rounded-2xl border text-sm font-semibold transition ${
        selected
          ? 'border-transparent bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_8px_18px_rgba(37,99,235,0.3)]'
          : 'border-border bg-bg-soft text-muted hover:text-ink'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`inline-flex h-full items-center gap-2 ${onDelete ? 'pl-2 pr-1.5' : 'pl-2 pr-3.5'}`}
      >
        <SportBadge sport={sport} size="xs" />
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
