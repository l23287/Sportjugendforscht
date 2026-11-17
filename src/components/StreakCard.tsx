// C14: Neue Komponente – Flammenstreak oben auf der Statistik-Seite.
// Design-Einbettung (siehe docs/chunks/C14.md):
//  • Orange (Token `flame`) ist der EINZIGE warme Akzent der App und steht ausschließlich für den Streak – Flamme,
//    Streak-Zahl und Aktivitäts-Kalender. Alles andere bleibt im blauen App-Design.
//  • Karte, Abstände und Schriften wie die übrigen Statistik-Karten; Zahl groß in derselben Display-Schrift.
//  • Kein Rot und kein Vorwurf: „noch offen“ statt „gefährdet“, graue Flamme ohne Serie (Feedback aus C6a).
import { Flame } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { computeStreak, heatLevel, heatmapWeeks } from '../lib/streak';
import { todayKey } from '../lib/dateKey';
import { formatDate } from '../lib/time';
import { formatLongDay } from '../lib/calendar';

// C14: Stufen des Aktivitäts-Kalenders. Leer = dunkle Fläche; aktiv ≥ 3:1 dagegen (geprüft), dann kräftiger.
const LEVEL_CLASS = ['bg-bg-soft', 'bg-flame/55', 'bg-flame/80', 'bg-flame'] as const;

// C14a: Streak in Tagen.
const daysLabel = (n: number) => (n === 1 ? '1 Tag' : `${n} Tagen`);
const daysCount = (n: number) => (n === 1 ? '1 Tag' : `${n} Tage`);

export function StreakCard() {
  const { streakActivity, trackingStartKey } = useAppData();
  const today = todayKey();
  const streak = computeStreak(streakActivity, today);
  const weeks = heatmapWeeks(today);
  const active = streak.current > 0;

  return (
    <section aria-labelledby="streak-title" className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-5 lg:flex-row lg:items-center lg:gap-10">
      <div className="flex items-center gap-4 lg:min-w-[300px]">
        {/* C14: Flamme – gefüllt und orange bei laufender Serie, grau ohne Serie. */}
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16 ${active ? 'bg-flame/15 text-flame' : 'bg-surface-2 text-muted-2'}`}
          aria-hidden="true"
        >
          <Flame size={28} fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 1.5 : 2} />
        </span>
        <div className="min-w-0">
          <h2 id="streak-title" className="text-sm font-medium text-muted">
            Flammenstreak
          </h2>
          {/* C14: Auf dem Handy eine Stufe kleiner und ohne Umbruch (Feedback: kurze Texte, kein Umbruch mobil). */}
          <p className="whitespace-nowrap font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
            {active ? (
              <>
                <span className="text-flame">{streak.current}</span> {streak.current === 1 ? 'Tag' : 'Tage'} in Folge
              </>
            ) : (
              'Noch keine Serie'
            )}
          </p>
          <p className="mt-1 text-sm text-muted">
            {/* C14: Hinweis bei „offener“ Woche – freundlich, nicht alarmierend.
                C14a: jetzt bezogen auf heute. */}
            {!active
              ? 'Beende eine Übung, um deine Serie zu starten.'
              : streak.atRisk
                ? 'Heute noch offen – beende eine Übung, um die Serie zu halten.'
                : `Heute: ${streak.today} ${streak.today === 1 ? 'Aktivität' : 'Aktivitäten'}`}
          </p>
          <p className="mt-0.5 text-xs text-muted-2">Längste Serie: {daysCount(streak.longest)} · alle Sportarten</p>
        </div>
      </div>

      {/* C14: Aktivitäts-Kalender der letzten 12 Wochen (Spalten = Wochen, Zeilen = Mo–So). */}
      <div className="min-w-0 flex-1">
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="img" aria-label={`Aktivität der letzten 12 Wochen, aktuelle Serie ${daysLabel(streak.current)}`}>
          <div className="flex shrink-0 flex-col gap-1 pr-1 text-[10px] leading-3 text-muted-2" aria-hidden="true">
            {['Mo', '', 'Mi', '', 'Fr', '', 'So'].map((label, i) => (
              <span key={i} className="h-3.5">
                {label}
              </span>
            ))}
          </div>
          {weeks.map((week) => (
            <div key={week[0]} className="flex shrink-0 flex-col gap-1">
              {week.map((day) => {
                const count = streakActivity.get(day) ?? 0;
                const future = day > today;
                return (
                  <span
                    key={day}
                    title={future ? undefined : `${formatLongDay(day)}: ${count === 0 ? 'keine Aktivität' : count === 1 ? '1 Aktivität' : `${count} Aktivitäten`}`}
                    className={`h-3.5 w-3.5 rounded-[4px] ${future ? 'bg-transparent' : LEVEL_CLASS[heatLevel(count)]} ${
                      day === today ? 'ring-1 ring-ink ring-offset-1 ring-offset-surface' : ''
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-2">
          <span>{trackingStartKey ? `Daten seit ${formatDate(trackingStartKey)}` : 'Noch keine beendeten Übungen'}</span>
          <span className="flex items-center gap-1" aria-hidden="true">
            weniger
            {LEVEL_CLASS.map((cls) => (
              <span key={cls} className={`h-2.5 w-2.5 rounded-[3px] ${cls}`} />
            ))}
            mehr
          </span>
        </div>
      </div>
    </section>
  );
}
