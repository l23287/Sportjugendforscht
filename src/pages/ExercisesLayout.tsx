// C3: Neue Seite – gemeinsamer Rahmen für den Übungsbereich mit Reitern „Übungen | Aufschlagtraining“.
// C12: Zusätzlich Reiter „Stoppuhr“ für alle Sportarten.
// Der Reiter „Aufschlagtraining“ erscheint nur, wenn Tischtennis aktiv ist; bei allen anderen Sportarten
// ist er komplett ausgeblendet (Abstimmung im Team). Die Inhalte der Reiter kommen über <Outlet />.
import { NavLink, Outlet } from 'react-router-dom';
import { Crosshair, Dumbbell, Timer as TimerIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { useSport } from '../context/SportContext';
import { useAppData } from '../context/AppDataContext';
// C12: Punkt am Reiter, solange die Stoppuhr läuft.
import { useStopwatch } from '../context/StopwatchContext';
import { hasServeTraining } from '../lib/sport';

interface Tab {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  /** C3: `end` = nur bei exakt dieser Adresse aktiv (sonst wäre „Übungen“ auch im Unterreiter aktiv). */
  end?: boolean;
  /** C3: Kleiner Punkt am Reiter, z. B. wenn eine Aufschlag-Session noch läuft. */
  indicator?: boolean;
  /** C12: Text für den Punkt (Screenreader/Tooltip), z. B. „Stoppuhr läuft“. */
  indicatorLabel?: string;
}

export function ExercisesLayout() {
  const { sport } = useSport();
  const { serveSessions } = useAppData();
  const showServeTraining = hasServeTraining(sport);
  const hasActiveServeSession = serveSessions.some((session) => session.endedAt === null);
  const { running: stopwatchRunning } = useStopwatch();

  const tabs: Tab[] = [
    { to: '/uebungen', label: 'Übungen', icon: Dumbbell, end: true },
    ...(showServeTraining
      ? [{ to: '/uebungen/aufschlagtraining', label: 'Aufschlag', icon: Crosshair, indicator: hasActiveServeSession, indicatorLabel: 'Session läuft' }]
      : []),
    // C12: Stoppuhr für alle Sportarten → die Reiterleiste erscheint jetzt immer.
    { to: '/uebungen/stoppuhr', label: 'Stoppuhr', icon: TimerIcon, indicator: stopwatchRunning, indicatorLabel: 'Stoppuhr läuft' },
  ];
  // C12: „Aufschlag“ statt „Aufschlagtraining“ – drei Reiter passen so am Handy in eine Zeile (Regel aus C9a);
  //      die Seitenüberschrift im Reiter heißt weiterhin „Aufschlagtraining“.

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-3xl font-extrabold text-ink">Übungen</h1>

        {/* C3: Reiterleiste nur, wenn es mehr als einen Reiter gibt. C12: durch die Stoppuhr jetzt immer der Fall. */}
        {tabs.length > 1 && (
          <nav
            aria-label="Bereiche im Übungsbereich"
            className="flex w-full gap-1 self-start rounded-2xl border border-border bg-surface p-1 sm:w-auto"
          >
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                // C12: Am Handy kleinerer Innenabstand (px-2) – drei Reiter passen sonst nicht in eine Zeile.
                // C3: Gleicher Aktiv-Stil wie die Hauptnavigation (blauer Verlauf), damit das Design einheitlich bleibt.
                className={({ isActive }) =>
                  `relative flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold whitespace-nowrap transition sm:flex-none sm:gap-2 sm:px-4 ${
                    isActive
                      ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)]'
                      : 'text-muted hover:bg-surface-2 hover:text-ink'
                  }`
                }
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.indicator && (
                  <span className="h-2 w-2 rounded-full bg-accent" title={tab.indicatorLabel} aria-label={tab.indicatorLabel} />
                )}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <Outlet />
    </div>
  );
}
