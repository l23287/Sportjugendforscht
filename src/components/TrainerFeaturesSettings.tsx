// C9: Neue Komponente – Karte „Trainer-Funktionen“ in den Einstellungen.
// Gleicher Kartenstil wie „Kernziele“ und „Sportart“; je Funktion eine Zeile mit Symbol, Titel, Erklärung und Schalter.
// Änderungen wirken sofort (kein Speichern-Button), wie die Sportart-Auswahl.
import { useTrainerFeatures } from '../context/TrainerFeaturesContext';
import { TRAINER_FEATURES } from '../lib/trainerFeatures';
import { Switch } from './Switch';

export function TrainerFeaturesSettings() {
  const { features, setFeature } = useTrainerFeatures();

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Trainer-Funktionen</h2>
        <p className="mt-1 text-sm text-muted">
          Blende Angaben aus, die du nicht brauchst. Bereits gespeicherte Werte bleiben erhalten.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
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
