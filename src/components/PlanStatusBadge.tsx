// C6a: Neue Komponente – einheitliches Status-Badge für Pläne mit Datum („Heute“ / „Ausstehend“ / „Vergangen“).
// Ersetzt die rote „Überfällig“-Markierung in Plankarte, Plandetail und Kalender.
import { Calendar } from 'lucide-react';
import { PLAN_STATUS_META, type PlanStatus } from '../lib/planStatus';
import { formatDate } from '../lib/time';

interface PlanStatusBadgeProps {
  status: PlanStatus;
  /** Optional: Datum im Badge anzeigen („Ausstehend · 20.11.2026“). */
  date?: string;
}

export function PlanStatusBadge({ status, date }: PlanStatusBadgeProps) {
  const meta = PLAN_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-2xl px-3 py-1 text-xs font-semibold whitespace-nowrap ${meta.badgeClass}`}
    >
      <Calendar size={12} aria-hidden="true" />
      {meta.label}
      {date && <span className="font-medium opacity-90">· {formatDate(date)}</span>}
    </span>
  );
}
