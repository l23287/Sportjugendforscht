// C14: Neue Statistik-Bereiche („markante Werte“) für die aktive Sportart. Alle im bestehenden Statistik-Stil:
// Kacheln wie StatTile, Karten mit h2 wie „Meist genutzte Übungen“, Fortschrittsbalken wie „Übungen nach
// Schwierigkeitsgrad“. Blau bleibt die Farbe der Kennzahlen – Orange gehört nur dem Streak.
import type { ReactNode } from 'react';
import { CalendarCheck, Clock, Hourglass, Target, Timer as TimerIcon, TrendingUp, Trophy } from 'lucide-react';
import { StatTile } from './StatTile';
import { formatDuration, formatDate } from '../lib/time';
import { formatStopwatch } from '../lib/stopwatch';
import { formatWeight } from '../lib/strength';
import type { GymProgress, StaleResult, StopwatchBest } from '../lib/insights';
import { PLAN_STATUS_META } from '../lib/planStatus';

const cardClass = 'flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5';

function CardTitle({ icon, children, aside }: { icon: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
        <span className="text-accent" aria-hidden="true">
          {icon}
        </span>
        {children}
      </h2>
      {aside}
    </div>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted">{children}</p>;
}

/** C14 (2): Diese Woche / dieser Monat – beendete Übungen und Trainingszeit. */
export function PeriodTiles({
  week,
  month,
}: {
  week: { count: number; seconds: number };
  month: { count: number; seconds: number };
}) {
  // C14: Kurze Beschriftungen – zweispaltig auf dem Handy ohne Umbruch.
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatTile icon={<CalendarCheck size={20} />} label="Übungen · Woche" value={week.count} />
      <StatTile icon={<Clock size={20} />} label="Zeit · Woche" value={formatDuration(week.seconds)} />
      <StatTile icon={<CalendarCheck size={20} />} label="Übungen · Monat" value={month.count} />
      <StatTile icon={<Clock size={20} />} label="Zeit · Monat" value={formatDuration(month.seconds)} />
    </div>
  );
}

/** C14 (4): Planerfüllung der letzten 4 Wochen (bzw. seit Datenbeginn). */
export function PlanFulfillmentCard({
  scheduled,
  fulfilled,
  sinceLabel,
}: {
  scheduled: number;
  fulfilled: number;
  sinceLabel: string | null;
}) {
  const percent = scheduled === 0 ? 0 : Math.round((fulfilled / scheduled) * 100);
  return (
    <section className={cardClass} aria-label="Planerfüllung">
      <CardTitle icon={<CalendarCheck size={18} />}>Planerfüllung</CardTitle>
      {sinceLabel === null ? (
        <EmptyLine>Sobald du Übungen aus geplanten Terminen beendest, siehst du hier, wie viele Termine du gehalten hast.</EmptyLine>
      ) : scheduled === 0 ? (
        <EmptyLine>Keine geplanten Termine {sinceLabel}. Lege Pläne im Kalender auf Tage.</EmptyLine>
      ) : (
        <>
          <p className="font-display text-3xl font-extrabold text-ink">
            {percent} %
            <span className="ml-2 font-sans text-sm font-medium text-muted">
              {fulfilled} von {scheduled} Terminen gehalten
            </span>
          </p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-bg-soft" aria-hidden="true">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-muted-2">Geplante Termine {sinceLabel} (inkl. Wiederholungen, ohne ausgetragene).</p>
        </>
      )}
    </section>
  );
}

/** C14 (7): Kernziele – erreicht / gesamt. */
export function GoalsCard({ achieved, total }: { achieved: number; total: number }) {
  return (
    <section className={cardClass} aria-label="Kernziele">
      <CardTitle icon={<Target size={18} />}>Kernziele</CardTitle>
      {total === 0 ? (
        <EmptyLine>Noch keine Kernziele festgelegt (Einstellungen › Kernziele).</EmptyLine>
      ) : (
        <>
          <p className="font-display text-3xl font-extrabold text-ink">
            {achieved} von {total}
            <span className="ml-2 font-sans text-sm font-medium text-muted">erreicht</span>
          </p>
          {/* C14: Je Ziel ein Segment – erreicht in der „Erreicht“-Farbe aus C8. */}
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`h-3 flex-1 rounded-full ${i < achieved ? 'bg-accent' : 'bg-bg-soft'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/** C14 (5 + 6): Persönliche Bestwerte – Stoppuhr je Name, bei Gym Maximalgewicht und Steigerung je Übung. */
export function BestsCard({ stopwatch, gym, showGym }: { stopwatch: StopwatchBest[]; gym: GymProgress[]; showGym: boolean }) {
  const empty = stopwatch.length === 0 && (!showGym || gym.length === 0);
  return (
    <section className={cardClass} aria-label="Persönliche Bestwerte">
      <CardTitle icon={<Trophy size={18} />}>Persönliche Bestwerte</CardTitle>
      {empty ? (
        <EmptyLine>
          {showGym
            ? 'Beende Gym-Übungen oder speichere Stoppuhr-Werte – deine Bestwerte erscheinen hier.'
            : 'Speichere Zeiten mit der Stoppuhr (Übungen › Stoppuhr) – deine Bestwerte erscheinen hier.'}
        </EmptyLine>
      ) : (
        <div className="flex flex-col gap-4">
          {showGym && gym.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-2">Gewichte</p>
              <ul className="flex flex-col gap-2">
                {gym.map((g) => {
                  const delta = g.lastKg - g.firstKg;
                  return (
                    <li key={g.exerciseId} className="flex items-center gap-3 rounded-2xl bg-bg-soft px-3 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{g.name}</span>
                        {/* C14 (6): Steigerung seit der ersten protokollierten Ausführung. */}
                        <span className="block text-xs text-muted-2">
                          {g.sessions < 2
                            ? 'Erst eine Ausführung'
                            : `${formatWeight(g.firstKg)} → ${formatWeight(g.lastKg)} · ${g.sessions} Ausführungen`}
                        </span>
                      </span>
                      {g.sessions >= 2 && delta !== 0 && (
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-2xl px-2.5 py-0.5 text-xs font-semibold ${
                            delta > 0 ? PLAN_STATUS_META.ausstehend.badgeClass : PLAN_STATUS_META.vergangen.badgeClass
                          }`}
                        >
                          {delta > 0 && <TrendingUp size={12} aria-hidden="true" />}
                          {delta > 0 ? '+' : '−'}
                          {formatWeight(Math.abs(delta))}
                        </span>
                      )}
                      <span className="shrink-0 text-right">
                        <span className="block font-display text-lg font-extrabold tabular-nums text-ink">{formatWeight(g.bestKg)}</span>
                        <span className="block text-[11px] text-muted-2">Bestwert</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {stopwatch.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-2">Stoppuhr</p>
              <ul className="flex flex-col gap-2">
                {stopwatch.map((b) => (
                  <li key={b.name} className="flex items-center gap-3 rounded-2xl bg-bg-soft px-3 py-2.5">
                    <TimerIcon size={16} className="shrink-0 text-accent" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{b.name}</span>
                      <span className="block text-xs text-muted-2">{b.count === 1 ? '1 Messung' : `${b.count} Messungen`}</span>
                    </span>
                    <span className="shrink-0 font-display text-lg font-extrabold tabular-nums text-ink">{formatStopwatch(b.ms)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** C14 (8): Übungen, die seit über 30 Tagen nicht durchgeführt wurden – ehrlich erst ab genug Verlauf. */
export function StaleCard({ result }: { result: StaleResult }) {
  return (
    <section className={cardClass} aria-label="Lange nicht trainiert">
      <CardTitle icon={<Hourglass size={18} />}>Lange nicht trainiert</CardTitle>
      {!result.available ? (
        <EmptyLine>
          {result.availableFrom
            ? `Verfügbar ab ${formatDate(result.availableFrom)} – dafür braucht es 30 Tage Verlauf.`
            : 'Verfügbar, sobald du Übungen beendest und 30 Tage Verlauf vorhanden sind.'}
        </EmptyLine>
      ) : result.items.length === 0 ? (
        <EmptyLine>Alles im Blick – jede Übung wurde in den letzten 30 Tagen trainiert.</EmptyLine>
      ) : (
        <ul className="flex flex-col gap-2">
          {result.items.map(({ exercise, lastDone, daysSince }) => (
            <li key={exercise.id} className="flex items-center gap-3 rounded-2xl bg-bg-soft px-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{exercise.name}</span>
                <span className="block text-xs text-muted-2">
                  {lastDone ? `Zuletzt am ${formatDate(lastDone)}` : 'Noch nie beendet'}
                </span>
              </span>
              {/* C14: neutral grau wie „Vergangen“ (C6a) – ein Hinweis, kein Fehler. */}
              <span className={`shrink-0 rounded-2xl px-2.5 py-0.5 text-xs font-semibold ${PLAN_STATUS_META.vergangen.badgeClass}`}>
                {daysSince} Tage
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
