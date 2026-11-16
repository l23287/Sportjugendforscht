// C6a: Zeitlicher Status eines Plans – ersetzt die Einteilung „überfällig / nicht überfällig“.
// Ein Plan mit Datum ist entweder heute, ausstehend (Zukunft) oder vergangen. Vergangene Pläne sind kein Fehler,
// sondern erledigte bzw. zurückliegende Trainings – deshalb neutral grau statt rot (Abstimmung im Team).
// Farben, Texte und Reihenfolge liegen NUR hier, damit Plankarte, Plandetail, Pläne-Übersicht und Kalender
// garantiert gleich aussehen.
import { isDateKey, todayKey } from './dateKey';
// C7: Serien-Termine für den Status ganzer Pläne.
import { lastOccurrenceBefore, nextOccurrence } from './recurrence';
import type { TrainingPlan } from '../types';

export type PlanStatus = 'heute' | 'ausstehend' | 'vergangen';

/** C6a: Status aus dem Plandatum (`JJJJ-MM-TT`); ohne/ungültiges Datum → null. */
export function getPlanStatus(date: string | null, today: string = todayKey()): PlanStatus | null {
  if (!date || !isDateKey(date)) return null;
  if (date === today) return 'heute';
  // DateKeys sind als Text sortierbar.
  return date > today ? 'ausstehend' : 'vergangen';
}

interface PlanStatusMeta {
  /** Kurzlabel für Badges, z. B. „Heute“. */
  label: string;
  /** Überschrift für Abschnitte in der Pläne-Übersicht. */
  sectionTitle: string;
  /** Badge (Text auf Fläche) – Farbpaare aus dem bestehenden Design, Textkontrast ≥ 4,5:1. */
  badgeClass: string;
  /** Punkt im Kalender / in der Legende (Nicht-Text-Kontrast ≥ 3:1 auf den App-Hintergründen). */
  dotClass: string;
  /** Textfarbe für Plannamen im Kalender (Desktop). */
  textClass: string;
}

export const PLAN_STATUS_META: Record<PlanStatus, PlanStatusMeta> = {
  // Heute: kräftiges Akzent-Blau wie der Akzent-Button – das Wichtigste des Tages fällt sofort auf.
  heute: {
    label: 'Heute',
    sectionTitle: 'Pläne des Tages',
    badgeClass: 'bg-accent text-[#04263f]',
    dotClass: 'bg-accent',
    textClass: 'text-accent',
  },
  // Ausstehend: ruhiges Primär-Blau (wie die Ziel-Chips im Aufschlagtraining).
  ausstehend: {
    label: 'Ausstehend',
    sectionTitle: 'Ausstehende Pläne',
    badgeClass: 'bg-primary-soft text-accent',
    dotClass: 'bg-primary',
    textClass: 'text-ink',
  },
  // Vergangen: neutral grau – zurückliegend, aber nicht alarmierend.
  vergangen: {
    label: 'Vergangen',
    sectionTitle: 'Vergangene Pläne',
    badgeClass: 'bg-surface-2 text-muted',
    dotClass: 'bg-muted-2',
    // text-muted statt text-muted-2: kleine Schrift braucht ≥ 4,5:1 (muted-2 hätte nur 4,39:1).
    textClass: 'text-muted',
  },
};

/** C6a: Reihenfolge der Abschnitte in der Pläne-Übersicht. */
export const PLAN_STATUS_ORDER: PlanStatus[] = ['heute', 'ausstehend', 'vergangen'];

// C7: Status und maßgeblicher Termin eines ganzen Plans – berücksichtigt Serien (Abstimmung im Team):
//   Heute      = heute ist ein Termin (bei Serien: einer der Termine),
//   Ausstehend = es kommt noch ein Termin → `date` ist der NÄCHSTE Termin,
//   Vergangen  = kein Termin mehr (Einzeltermin vorbei bzw. Serie beendet) → `date` ist der LETZTE Termin.
// Für Pläne ohne Wiederholung ergibt das genau dasselbe wie getPlanStatus(plan.date).
export interface PlanSchedule {
  status: PlanStatus;
  date: string;
}

export function getPlanSchedule(
  plan: Pick<TrainingPlan, 'date' | 'recurrence'>,
  today: string = todayKey(),
): PlanSchedule | null {
  if (!plan.date || !isDateKey(plan.date)) return null;
  if (!plan.recurrence) {
    const status = getPlanStatus(plan.date, today);
    return status ? { status, date: plan.date } : null;
  }
  const next = nextOccurrence(plan, today);
  if (next) return { status: next === today ? 'heute' : 'ausstehend', date: next };
  const last = lastOccurrenceBefore(plan, today);
  return last ? { status: 'vergangen', date: last } : null;
}
