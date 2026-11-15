// C2a: Neue Komponente – Sportart-Anzeige (Sporticon mit farbiger Umrandung + Name) für die Ecke oben rechts.
// Wird von der Handy-Kopfzeile (MobileTopBar) und der Desktop-Kopfzeile (AppShell) gemeinsam genutzt,
// damit das Sporticon auf allen Geräten an derselben Stelle und gleich aussieht.
// Ein Klick führt zu den Einstellungen, wo die Sportart gewechselt wird.
// C2b: Die farbige Umrandung liegt jetzt um die GESAMTE Anzeige (Symbol + Name) statt nur um das kleine Emoji-Kästchen.
import { Link } from 'react-router-dom';
import { useSport } from '../context/SportContext';
// C2c: Rahmen-Stil in gemeinsamen Helfer ausgelagert (auch im Auswahlbereich der Einstellungen genutzt).
import { sportFrameStyle } from '../lib/sportStyle';

export function SportPill({ className = '' }: { className?: string }) {
  const { sport } = useSport();

  // C2b: Rahmen in voller Sportfarbe (Kontrast ≥ 3:1, siehe C2), Hintergrund leicht getönt (≈ 12 %).
  const style = sportFrameStyle(sport.color);

  return (
    <Link
      to="/einstellungen"
      title="Sportart wechseln"
      aria-label={`Aktuelle Sportart: ${sport.name} – Sportart wechseln`}
      style={style}
      // C2b: border-2 statt border/border-border, damit die Sportfarbe deutlich sichtbar ist.
      className={`flex h-9 items-center gap-2 rounded-2xl border-2 px-3 text-xs font-medium text-ink transition hover:brightness-125 md:text-sm ${className}`}
    >
      {/* C2b: Emoji ohne eigenes Kästchen – die Umrandung trägt jetzt die ganze Anzeige. */}
      <span className="text-base leading-none" aria-hidden="true">
        {sport.emoji}
      </span>
      <span className="max-w-[7rem] truncate md:max-w-[12rem]">{sport.name}</span>
    </Link>
  );
}
