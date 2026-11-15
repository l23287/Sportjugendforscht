// C3: Neue Seite – gemeinsamer Rahmen für den Übungsbereich mit Reitern „Übungen | Aufschlagtraining“.
// Der Reiter „Aufschlagtraining“ erscheint nur, wenn Tischtennis aktiv ist; bei allen anderen Sportarten
// ist er komplett ausgeblendet (Abstimmung im Team). Die Inhalte der Reiter kommen über <Outlet />.
import { NavLink, Outlet } from 'react-router-dom';
import { Crosshair, Dumbbell } from 'lucide-react';
import type { ComponentType } from 'react';
import { useSport } from '../context/SportContext';
import { useAppData } from '../context/AppDataContext';
import { hasServeTraining } from '../lib/sport';

interface Tab {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  /** C3: `end` = nur bei exakt dieser Adresse aktiv (sonst wäre „Übungen“ auch im Unterreiter aktiv). */
  end?: boolean;
  /** C3: Kleiner Punkt am Reiter, z. B. wenn eine Aufschlag-Session noch läuft. */
  indicator?: boolean;
}

export function ExercisesLayout() {
  const { sport } = useSport();
  const { serveSessions } = useAppData();
  const showServeTraining = hasServeTraining(sport);
  const hasActiveServeSession = serveSessions.some((session) => session.endedAt === null);

  const tabs: Tab[] = [
    { to: '/uebungen', label: 'Übungen', icon: Dumbbell, end: true },
    ...(showServeTraining
      ? [{ to: '/uebungen/aufschlagtraining', label: 'Aufschlagtraining', icon: Crosshair, indicator: hasActiveServeSession }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-3xl font-extrabold text-ink">Übungen</h1>

        {/* C3: Reiterleiste nur, wenn es mehr als einen Reiter gibt – bei anderen Sportarten bleibt die Seite wie bisher. */}
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
                // C3: Gleicher Aktiv-Stil wie die Hauptnavigation (blauer Verlauf), damit das Design einheitlich bleibt.
                className={({ isActive }) =>
                  `relative flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition sm:flex-none ${
                    isActive
                      ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)]'
                      : 'text-muted hover:bg-surface-2 hover:text-ink'
                  }`
                }
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.indicator && (
                  <span className="h-2 w-2 rounded-full bg-accent" title="Session läuft" aria-label="Session läuft" />
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
