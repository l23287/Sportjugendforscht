import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { SearchInput } from '../components/SearchInput';
import { PlanCard } from '../components/PlanCard';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useSport } from '../context/SportContext';
// C6a: Pläne nach Status gruppieren (Heute / Ausstehend / Vergangen / Ohne Datum).
import { PLAN_STATUS_META, PLAN_STATUS_ORDER, getPlanSchedule, type PlanStatus } from '../lib/planStatus';
import type { TrainingPlan } from '../types';
// C8: Kernziele auf der Startseite.
import { CoreGoalsPanel } from '../components/CoreGoalsPanel';
// C14: Flammenstreak auf der Startseite.
import { StreakBadge } from '../components/StreakBadge';
// C2: Einheitliches Sporticon mit farbiger Umrandung.
import { SportBadge } from '../components/SportBadge';
// C17: Pläne duplizieren.
import { DuplicatePlanDialog } from '../components/DuplicatePlanDialog';

export function PlansOverview() {
  const { plans, exercises, deletePlan } = useAppData();
  const { sport } = useSport();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // C17: Plan, für den der Dialog „Plan duplizieren“ offen ist.
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  const filteredPlans = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((plan) => plan.name.toLowerCase().includes(q));
  }, [plans, query]);

  const pendingDeletePlan = plans.find((plan) => plan.id === pendingDeleteId);

  // C6a: Abschnitte „Pläne des Tages“, „Ausstehende Pläne“ (nächster Termin zuerst),
  // „Vergangene Pläne“ (jüngster zuerst) und „Ohne Datum“. Leere Abschnitte werden ausgeblendet.
  const sections = useMemo(() => {
    const groups: Record<PlanStatus | 'ohne', TrainingPlan[]> = { heute: [], ausstehend: [], vergangen: [], ohne: [] };
    // C7: Einteilung und Sortierung nach dem maßgeblichen Termin (bei Serien: nächster bzw. letzter Termin)
    // und innerhalb eines Tages nach Uhrzeit.
    const scheduleOf = new Map(filteredPlans.map((plan) => [plan.id, getPlanSchedule(plan)]));
    for (const plan of filteredPlans) groups[scheduleOf.get(plan.id)?.status ?? 'ohne'].push(plan);
    const sortKey = (plan: TrainingPlan) => `${scheduleOf.get(plan.id)?.date ?? ''} ${plan.time ?? '99:99'}`;
    const byDate = (a: TrainingPlan, b: TrainingPlan) => sortKey(a).localeCompare(sortKey(b));
    // C7: Pläne des Tages nach Uhrzeit.
    groups.heute.sort(byDate);
    groups.ausstehend.sort(byDate);
    groups.vergangen.sort((a, b) => byDate(b, a));
    return [
      ...PLAN_STATUS_ORDER.map((status) => ({ key: status, title: PLAN_STATUS_META[status].sectionTitle, plans: groups[status] })),
      { key: 'ohne', title: 'Ohne Datum', plans: groups.ohne },
    ].filter((section) => section.plans.length > 0);
  }, [filteredPlans]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        {/* C1: Emoji aus dem Sportart-Objekt. */}
        {/* C2: Sporticon als SportBadge statt reinem Emoji. */}
        <p className="flex items-center gap-2 text-sm text-muted-2">
          <SportBadge sport={sport} size="xs" /> Willkommen zurück
          {/* C14: Flammenstreak klein in der Begrüßungszeile – führt zur Statistik. */}
          <StreakBadge />
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-extrabold text-ink">Trainingspläne</h1>
          <PrimaryButton icon={<Plus size={18} />} onClick={() => navigate('/plaene/neu')}>
            Neuer Plan
          </PrimaryButton>
        </div>
      </header>

      {/* C8a: Suchleiste über den Kernzielen (Abstimmung im Team) – Suche bleibt das erste Werkzeug der Seite. */}
      <SearchInput value={query} onChange={setQuery} placeholder="Pläne durchsuchen…" className="max-w-md" />

      {/* C8: Kernziele der aktiven Sportart direkt unter der Begrüßung, vor den Plänen.
          C8a: jetzt zwischen Suchleiste und Plänen. */}
      <CoreGoalsPanel />

      {filteredPlans.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          // C5: Sportart im leeren Zustand nennen – nach einem Wechsel wirkt die leere Liste sonst wie Datenverlust.
          title={plans.length === 0 ? `Noch keine Trainingspläne für ${sport.name}` : 'Keine Treffer'}
          description={
            plans.length === 0
              ? `Erstelle deinen ersten ${sport.name}-Trainingsplan. Pläne anderer Sportarten findest du, wenn du oben rechts die Sportart wechselst.`
              : 'Für deine Suche wurden keine Pläne gefunden.'
          }
          action={
            plans.length === 0 ? (
              <PrimaryButton icon={<Plus size={18} />} onClick={() => navigate('/plaene/neu')}>
                Neuen Plan erstellen
              </PrimaryButton>
            ) : undefined
          }
        />
      ) : (
        // C6a: Ein Abschnitt je Status; Überschriften im Stil der übrigen Abschnittsüberschriften (h2, font-display).
        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.key} aria-labelledby={`plans-section-${section.key}`} className="flex flex-col gap-4">
              <h2 id={`plans-section-${section.key}`} className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                {section.title}
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">{section.plans.length}</span>
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {section.plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    exercises={exercises}
                    onEdit={() => navigate(`/plaene/${plan.id}/bearbeiten`)}
                    onDelete={() => setPendingDeleteId(plan.id)}
                    onDuplicate={() => setDuplicateId(plan.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* C17: Gemeinsamer Dialog – führt nach dem Duplizieren direkt zur Kopie. */}
      <DuplicatePlanDialog plan={plans.find((p) => p.id === duplicateId) ?? null} onClose={() => setDuplicateId(null)} />

      <ConfirmDialog
        open={Boolean(pendingDeletePlan)}
        title="Plan löschen?"
        description={
          pendingDeletePlan ? `„${pendingDeletePlan.name}“ wird unwiderruflich gelöscht.` : undefined
        }
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) deletePlan(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
