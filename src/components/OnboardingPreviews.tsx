// C10: Neue Komponente – Mini-Vorschauen echter App-Bausteine für die Einführung (Entwurf: Claude Design, siehe
// docs/chunks/C10.md). Statt Deko-Grafiken zeigen sie, wie Übungen, Pläne, Kalender und Kernziele später aussehen –
// mit denselben Farben, Badges und Formen wie in der App. Inhalte sind sportartneutrale Beispiele.
// Die Vorschauen sind rein dekorativ (aria-hidden) – der Text daneben erklärt alles.
import { Check, Clock, Dumbbell, Repeat } from 'lucide-react';
import { WEEKDAY_LABELS, getMonthGrid } from '../lib/calendar';
import { parseDateKey, todayKey } from '../lib/dateKey';
import { PLAN_STATUS_META, PLAN_STATUS_ORDER, getPlanStatus } from '../lib/planStatus';
import { addDays, weekdayOf } from '../lib/recurrence';
import { formatDate } from '../lib/time';

const cardClass = 'rounded-3xl border border-border bg-surface p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)] sm:p-5';

/** C10: Schritt 2 – Übungskarte + Dauer-Eingabe „Min. : Sek.“ (C4). */
export function ExercisePreview() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className={`${cardClass} flex flex-col gap-3`}>
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-dark text-[#04263f]">
            <Dumbbell size={20} />
          </span>
          <span className="rounded-2xl bg-primary-soft px-3 py-1 text-xs font-semibold text-accent">Fortgeschritten</span>
        </div>
        <div>
          <p className="font-display text-lg font-bold text-ink">Technik-Drill</p>
          <p className="text-sm text-muted">Ziel: Präzision unter Druck</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-2">
          <Clock size={13} /> 1:30 Min.
        </span>
      </div>
      <div className="flex flex-col gap-2 px-1">
        <span className="text-sm font-medium text-muted">Dauer</span>
        <div className="flex items-center gap-2">
          <span className="flex h-12 flex-1 items-center justify-end gap-1.5 rounded-2xl border border-primary bg-bg-soft px-4 tabular-nums text-ink">
            1 <span className="text-sm text-muted-2">Min.</span>
          </span>
          <span className="font-display text-xl font-bold text-muted-2">:</span>
          <span className="flex h-12 flex-1 items-center justify-end gap-1.5 rounded-2xl border border-border bg-bg-soft px-4 tabular-nums text-ink">
            30 <span className="text-sm text-muted-2">Sek.</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** C10: Schritt 3 – Plankarte „Heute“ mit Übungsliste + Timer-Ring. */
export function PlanPreview() {
  return (
    <div className="flex flex-col items-center gap-5" aria-hidden="true">
      <div className={`${cardClass} w-full border-accent/60`}>
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-lg font-bold text-ink">Techniktraining</p>
          <span className={`whitespace-nowrap rounded-2xl px-2.5 py-1 text-xs font-semibold ${PLAN_STATUS_META.heute.badgeClass}`}>
            Heute · 18:00
          </span>
        </div>
        <ol className="mt-3 flex flex-col gap-2">
          {[
            ['Aufwärmen', '10:00 Min.'],
            ['Technik-Drill', '1:30 Min.'],
          ].map(([name, duration], index) => (
            <li key={name} className="flex items-center gap-3 rounded-2xl bg-bg-soft px-3 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-accent">
                {index + 1}
              </span>
              <span className="flex-1 text-sm font-semibold text-ink">{name}</span>
              <span className="text-xs text-muted-2">{duration}</span>
            </li>
          ))}
        </ol>
      </div>
      {/* C10: Timer-Ring im Stil des Übungs-Timers (Fortschritt im Primärblau). */}
      <div
        className="flex h-36 w-36 items-center justify-center rounded-full"
        style={{ background: 'conic-gradient(var(--color-primary) 0 62%, var(--color-surface-2) 62% 100%)' }}
      >
        <div className="flex h-[124px] w-[124px] flex-col items-center justify-center rounded-full bg-bg">
          <span className="font-display text-3xl font-extrabold tabular-nums text-ink">00:34</span>
          <span className="text-xs text-muted-2">Technik-Drill</span>
        </div>
      </div>
    </div>
  );
}

/**
 * C10: Schritt 4 – Mini-Kalender des AKTUELLEN Monats mit einer Beispiel-Serie (Mo + Do). Tage ohne Rahmen,
 * Statuspunkte und Legende genau wie im Kalender (C6a); berechnet mit denselben Helfern wie die Kalenderseite.
 */
export function CalendarPreview() {
  const today = todayKey();
  const now = parseDateKey(today);
  const grid = getMonthGrid(now.getFullYear(), now.getMonth());
  // C10: Fünf Wochen reichen für die Vorschau, wenn die sechste nur Folgemonat ist.
  const days = grid.slice(35).every((d) => !d.inMonth) ? grid.slice(0, 35) : grid;
  const title = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className={`${cardClass} flex flex-col gap-2.5`}>
        <p className="text-center font-display text-base font-bold text-ink">{title}</p>
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted-2">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((day) => {
            const wd = weekdayOf(day.key);
            const status = day.inMonth && (wd === 0 || wd === 3) ? getPlanStatus(day.key, today) : null;
            const isToday = day.key === today;
            return (
              <div key={day.key} className="flex h-10 flex-col items-center gap-0.5">
                <span
                  className={`flex h-[30px] w-[30px] items-center justify-center rounded-full text-[13px] ${
                    isToday
                      ? 'bg-gradient-to-br from-primary to-primary-dark font-extrabold text-white shadow-[0_6px_16px_rgba(37,99,235,0.35)]'
                      : `font-semibold ${day.inMonth ? 'text-ink' : 'text-muted-2 opacity-40'}`
                  }`}
                >
                  {day.dayOfMonth}
                </span>
                <span className={`h-[5px] w-[5px] rounded-full ${status ? PLAN_STATUS_META[status].dotClass : ''}`} />
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-4 border-t border-border pt-2.5 text-[11px] text-muted">
          {PLAN_STATUS_ORDER.map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span className={`h-[7px] w-[7px] rounded-full ${PLAN_STATUS_META[status].dotClass}`} />
              {PLAN_STATUS_META[status].label}
            </span>
          ))}
        </div>
      </div>
      <p className="flex items-center gap-2 px-1 text-[13px] text-muted">
        <Repeat size={14} />
        <span>
          <span className="font-semibold text-accent">18:00</span> Vereinstraining · Wöchentlich · Mo, Do
        </span>
      </p>
    </div>
  );
}

/** C10: Schritt 5 – drei Kernziel-Kacheln wie auf der Startseite (C8): offen, Datum vorbei (grau), erreicht. */
export function GoalsPreview() {
  // C10: Beispieldaten relativ zu heute, damit „ausstehend“ (blau) und „vorbei“ (grau) immer stimmen.
  const today = todayKey();
  const goals = [
    { text: 'Trainingsbeteiligung auf 80 % steigern', badge: `bis ${formatDate(addDays(today, 45))}`, badgeClass: PLAN_STATUS_META.ausstehend.badgeClass },
    { text: 'Neue Technik sicher beherrschen', badge: `bis ${formatDate(addDays(today, -6))}`, badgeClass: PLAN_STATUS_META.vergangen.badgeClass },
    { text: 'Saisonziel: Aufstieg in die nächste Liga', badge: 'Erreicht', badgeClass: PLAN_STATUS_META.heute.badgeClass, done: true },
  ];
  return (
    <ol className="flex flex-col gap-2.5" aria-hidden="true">
      {goals.map((goal, index) => (
        <li
          key={goal.text}
          className={`flex items-start gap-3 rounded-2xl border bg-surface p-3.5 ${goal.done ? 'border-accent/40' : 'border-border'}`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              goal.done ? 'bg-accent text-[#04263f]' : 'bg-primary-soft text-accent'
            }`}
          >
            {goal.done ? <Check size={16} strokeWidth={3} /> : index + 1}
          </span>
          <div className="flex flex-col gap-1.5">
            <span className={`text-sm font-semibold leading-snug ${goal.done ? 'text-muted' : 'text-ink'}`}>{goal.text}</span>
            <span className={`self-start rounded-2xl px-2.5 py-0.5 text-xs font-semibold ${goal.badgeClass}`}>{goal.badge}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
