import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// C10: Symbol für „Einführung erneut ansehen“.
import { PlayCircle } from 'lucide-react';
// C8: Kernziele festlegen.
import { CoreGoalsSettings } from '../components/CoreGoalsSettings';
// C9: Trainer-Funktionen ein-/ausschalten.
import { TrainerFeaturesSettings } from '../components/TrainerFeaturesSettings';
// C1: SportPicker ersetzt die PillSelect-Auswahl (25 Sportarten + eigene).
import { SportPicker } from '../components/SportPicker';
import { ImpressumDialog } from '../components/ImpressumDialog';
import { DatenschutzDialog } from '../components/DatenschutzDialog';
// C15: Einheitliche Klapp-Karte; Sporticon als Zusammenfassung im Kopf.
import { CollapsibleSection } from '../components/Collapsible';
import { SportBadge } from '../components/SportBadge';
import { useSport } from '../context/SportContext';

export function Settings() {
  const [impressumOpen, setImpressumOpen] = useState(false);
  const [datenschutzOpen, setDatenschutzOpen] = useState(false);
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { sport } = useSport();

  // C8: Link „Kernziele festlegen/Bearbeiten“ von der Startseite (#kernziele) springt direkt zur Karte.
  useEffect(() => {
    if (hash === '#kernziele') document.getElementById('kernziele')?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-extrabold text-ink">Einstellungen</h1>
        <p className="text-sm text-muted">Passe TrainerPro an deine Bedürfnisse an.</p>
      </header>

      {/* C8: Kernziele über „Sportart“, weil die Sportart-Auswahl sehr lang ist (Abstimmung im Team). */}
      {/* C15: Alle Bereiche anfangs geschlossen – nur der Sprung von der Startseite öffnet die Kernziele. */}
      <CoreGoalsSettings defaultOpen={hash === '#kernziele'} />

      {/* C9: Zwischen „Kernziele“ und „Sportart“, damit die Karte nicht unter der langen Sportart-Liste verschwindet. */}
      <TrainerFeaturesSettings />

      {/* C15: Ein-/ausklappbar, anfangs geschlossen; im Kopf die aktive Sportart. */}
      <CollapsibleSection
        title="Sportart"
        summary={
          <>
            <SportBadge sport={sport} size="xs" /> <span className="truncate">{sport.name}</span>
          </>
        }
      >
        {/* C1: Auswahl aus 25 Sportarten plus eigene Sportarten hinzufügen/löschen. */}
        <SportPicker />
      </CollapsibleSection>

      {/* C10: Einführung erneut ansehen – runder Sekundär-Button im Stil von „Heute“ im Kalender (C6). */}
      <button
        type="button"
        onClick={() => navigate('/onboarding', { state: { replay: true } })}
        className="inline-flex h-11 items-center gap-2 self-start rounded-full border border-border bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-surface-2"
      >
        <PlayCircle size={16} className="text-accent" aria-hidden="true" />
        Einführung erneut ansehen
      </button>

      <div className="flex items-center gap-3 text-sm font-medium text-muted">
        <button
          type="button"
          onClick={() => setDatenschutzOpen(true)}
          className="underline-offset-2 transition hover:text-ink hover:underline"
        >
          Datenschutz
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={() => setImpressumOpen(true)}
          className="underline-offset-2 transition hover:text-ink hover:underline"
        >
          Impressum
        </button>
      </div>

      <DatenschutzDialog open={datenschutzOpen} onClose={() => setDatenschutzOpen(false)} />
      <ImpressumDialog open={impressumOpen} onClose={() => setImpressumOpen(false)} />
    </div>
  );
}
