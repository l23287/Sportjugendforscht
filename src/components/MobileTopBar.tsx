import { TrainerProMark } from './Logo';
// C2a: Sportart-Anzeige oben rechts in eigene Komponente ausgelagert (gemeinsam mit Desktop).
import { SportPill } from './SportPill';

export function MobileTopBar() {
  return (
    <header className="flex items-center gap-3 px-4 pt-4 pb-2 md:hidden">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white">
        <TrainerProMark mono className="h-5 w-auto" />
      </div>
      <p className="font-display text-base font-extrabold leading-none text-ink">TrainerPro</p>
      {/* C2: Sporticon oben rechts mit Umrandung in der Farbe der Sportart. */}
      {/* C2a: Jetzt über die gemeinsame Komponente SportPill. */}
      <SportPill className="ml-auto" />
    </header>
  );
}
