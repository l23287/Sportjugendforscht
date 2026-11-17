// C14a: Zahl = Tage in Folge.
// C14: Kleine Flamme mit Zahl für die Startseite (Begrüßungszeile). Gleiche Farbregel wie die Streak-Karte:
// orange nur bei laufender Serie, sonst grau. Führt zur Statistik-Seite.
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { computeStreak } from '../lib/streak';
import { todayKey } from '../lib/dateKey';

export function StreakBadge() {
  const { streakActivity } = useAppData();
  const { current } = computeStreak(streakActivity, todayKey());
  const active = current > 0;
  return (
    <Link
      to="/statistiken"
      aria-label={active ? `Flammenstreak: ${current} ${current === 1 ? 'Tag' : 'Tage'} in Folge – zur Statistik` : 'Noch keine Serie – zur Statistik'}
      title="Flammenstreak"
      className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-bold tabular-nums transition hover:brightness-125 ${
        active ? 'bg-flame/15 text-flame' : 'bg-surface-2 text-muted-2'
      }`}
    >
      <Flame size={14} fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
      {current}
    </Link>
  );
}
