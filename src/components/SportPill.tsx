// C2a: Neue Komponente – Sportart-Anzeige (Sporticon mit farbiger Umrandung + Name) für die Ecke oben rechts.
// Wird von der Handy-Kopfzeile (MobileTopBar) und der Desktop-Kopfzeile (AppShell) gemeinsam genutzt,
// damit das Sporticon auf allen Geräten an derselben Stelle und gleich aussieht.
// Ein Klick führt zu den Einstellungen, wo die Sportart gewechselt wird.
import { Link } from 'react-router-dom';
import { useSport } from '../context/SportContext';
import { SportBadge } from './SportBadge';

export function SportPill({ className = '' }: { className?: string }) {
  const { sport } = useSport();

  return (
    <Link
      to="/einstellungen"
      title="Sportart wechseln"
      aria-label={`Aktuelle Sportart: ${sport.name} – Sportart wechseln`}
      className={`flex items-center gap-2 rounded-2xl border border-border bg-surface py-1 pl-1 pr-3 text-xs text-muted transition hover:text-ink md:text-sm ${className}`}
    >
      <SportBadge sport={sport} size="xs" />
      <span className="max-w-[7rem] truncate md:max-w-[12rem]">{sport.name}</span>
    </Link>
  );
}
