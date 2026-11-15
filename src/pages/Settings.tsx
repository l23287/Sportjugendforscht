import { useState } from 'react';
// C1: SportPicker ersetzt die PillSelect-Auswahl (25 Sportarten + eigene).
import { SportPicker } from '../components/SportPicker';
import { ImpressumDialog } from '../components/ImpressumDialog';
import { DatenschutzDialog } from '../components/DatenschutzDialog';

export function Settings() {
  const [impressumOpen, setImpressumOpen] = useState(false);
  const [datenschutzOpen, setDatenschutzOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-extrabold text-ink">Einstellungen</h1>
        <p className="text-sm text-muted">Passe TrainerPro an deine Bedürfnisse an.</p>
      </header>

      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-ink">Sportart</h2>
        {/* C1: Auswahl aus 25 Sportarten plus eigene Sportarten hinzufügen/löschen. */}
        <SportPicker />
      </div>

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
