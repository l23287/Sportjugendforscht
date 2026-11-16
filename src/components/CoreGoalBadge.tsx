// C8: Badge für ein Kernziel – „Erreicht“ oder das Zieldatum in den Statusfarben aus C6a
// (heute = Akzent, ausstehend = Primär, vergangen = neutral grau – bewusst nicht rot, wie bei den Plänen).
import { Calendar, Check } from 'lucide-react';
import type { CoreGoal } from '../types';
import { PLAN_STATUS_META, getPlanStatus } from '../lib/planStatus';
import { formatDate } from '../lib/time';

export function CoreGoalBadge({ goal }: { goal: CoreGoal }) {
  const base = 'inline-flex items-center gap-1 rounded-2xl px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap';
  if (goal.achieved) {
    return (
      <span className={`${base} ${PLAN_STATUS_META.heute.badgeClass}`}>
        <Check size={12} aria-hidden="true" /> Erreicht
      </span>
    );
  }
  const status = getPlanStatus(goal.dueDate);
  if (!status || !goal.dueDate) return null;
  return (
    <span className={`${base} ${PLAN_STATUS_META[status].badgeClass}`}>
      <Calendar size={12} aria-hidden="true" />
      {status === 'heute' ? 'Heute fällig' : `bis ${formatDate(goal.dueDate)}`}
    </span>
  );
}
