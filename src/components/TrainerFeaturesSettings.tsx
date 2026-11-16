// C9: Neue Komponente – Karte „Trainer-Funktionen“ in den Einstellungen.
// Gleicher Kartenstil wie „Kernziele“ und „Sportart“; je Funktion eine Zeile mit Symbol, Titel, Erklärung und Schalter.
// Änderungen wirken sofort (kein Speichern-Button), wie die Sportart-Auswahl.
import { SlidersHorizontal } from 'lucide-react';
import { useTrainerFeatures } from '../context/TrainerFeaturesContext';
import { TRAINER_FEATURES } from '../lib/trainerFeatures';
import { Switch } from './Switch';

export function TrainerFeaturesSettings() {
  const { features, setFeature, setAllFeatures } = useTrainerFeatures();
  // C9a: Zustand des Hauptschalters aus den Einzelschaltern ableiten.
  const enabledCount = TRAINER_FEATURES.filter(({ key }) => features[key]).length;
  const allState: boolean | 'mixed' =
    enabledCount === TRAINER_FEATURES.length ? true : enabledCount === 0 ? false : 'mixed';
  const allHint =
    allState === true ? 'Alle eingeschaltet' : allState === false ? 'Alle ausgeschaltet' : `${enabledCount} von ${TRAINER_FEATURES.length} eingeschaltet`;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Trainer-Funktionen</h2>
        <p className="mt-1 text-sm text-muted">
          Blende Angaben aus, die du nicht brauchst. Bereits gespeicherte Werte bleiben erhalten.
        </p>
      </div>
      {/* C9a: Hauptschalter – gleicher Zeilenaufbau wie die Einzelschalter, aber hervorgehoben (Primär-Rahmen/-Fläche),
          damit klar ist, dass er die Zeilen darunter steuert. */}
      <div
        className={`flex items-center gap-3 rounded-2xl border p-3 transition sm:p-4 ${
          allState === false ? 'border-border bg-bg-soft' : 'border-primary/40 bg-primary-soft/60'
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
            allState === false ? 'bg-surface-2 text-muted-2' : 'bg-gradient-to-br from-primary to-primary-dark text-white'
          }`}
          aria-hidden="true"
        >
          <SlidersHorizontal size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p id="feature-all-label" className="font-semibold text-ink">
            {/* C9a: Kurz „Alle Funktionen“ – die Karte heißt bereits „Trainer-Funktionen“; verhindert Umbruch am Handy. */}
            Alle Funktionen
          </p>
          <p id="feature-all-desc" className="text-xs text-muted-2" aria-live="polite">
            {allHint}
          </p>
        </div>
        <Switch checked={allState} onChange={setAllFeatures} labelledBy="feature-all-label" describedBy="feature-all-desc" />
      </div>

      {/* C9a: Einzelschalter eingerückt mit Linie – zeigt die Zugehörigkeit zum Hauptschalter. */}
      <ul className="ml-3 flex flex-col gap-2 border-l-2 border-border pl-3 sm:ml-5 sm:pl-4">
        {TRAINER_FEATURES.map(({ key, label, description, icon: Icon }) => {
          const enabled = features[key];
          return (
            <li key={key} className="flex items-center gap-3 rounded-2xl border border-border bg-bg-soft p-3 sm:p-4">
              {/* C9: Symbol in Primärfarben, wenn aktiv – neutral, wenn ausgeschaltet. */}
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                  enabled ? 'bg-primary-soft text-accent' : 'bg-surface-2 text-muted-2'
                }`}
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p id={`feature-${key}-label`} className="font-semibold text-ink">
                  {label}
                </p>
                <p id={`feature-${key}-desc`} className="text-xs text-muted-2">
                  {description}
                </p>
              </div>
              <Switch
                checked={enabled}
                onChange={(value) => setFeature(key, value)}
                labelledBy={`feature-${key}-label`}
                describedBy={`feature-${key}-desc`}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
