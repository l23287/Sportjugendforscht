// C8: Neue Komponente – Kernziele auf der Startseite (Trainingspläne).
// Flache Kacheln (am Handy untereinander, ab sm nebeneinander), damit die Pläne nicht weit nach unten rutschen.
// Abhaken direkt hier; Festlegen/Bearbeiten in den Einstellungen.
import { Link } from 'react-router-dom';
import { Check, Target } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useSport } from '../context/SportContext';
import { CoreGoalBadge } from './CoreGoalBadge';

export function CoreGoalsPanel() {
  const { goals, toggleGoalAchieved } = useAppData();
  const { sport } = useSport();

  // C8: Ohne Kernziele ein dezenter Hinweis mit Link (Abstimmung im Team) – gleicher gestrichelter Stil wie andere
  // leere Zustände, aber nur eine Zeile hoch.
  if (goals.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-dashed border-border px-4 py-3 text-sm">
        <Target size={18} className="shrink-0 text-muted-2" aria-hidden="true" />
        <span className="text-muted">Noch keine Kernziele für {sport.name}.</span>
        <Link to="/einstellungen#kernziele" className="font-semibold text-accent underline-offset-2 hover:underline">
          Kernziele festlegen
        </Link>
      </div>
    );
  }

  return (
    <section aria-labelledby="core-goals-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="core-goals-title" className="font-display text-lg font-bold text-ink">
          Kernziele
        </h2>
        <Link to="/einstellungen#kernziele" className="text-sm font-medium text-muted underline-offset-2 hover:text-ink hover:underline">
          Bearbeiten
        </Link>
      </div>
      <ol className={`grid grid-cols-1 gap-3 ${goals.length > 1 ? 'sm:grid-cols-2' : ''} ${goals.length > 2 ? 'xl:grid-cols-3' : ''}`}>
        {goals.map((goal, index) => (
          <li
            key={goal.id}
            className={`flex items-start gap-3 rounded-2xl border bg-surface p-3 sm:p-4 ${
              goal.achieved ? 'border-accent/40' : 'border-border'
            }`}
          >
            {/* C8: Nummer = Rangfolge; Klick hakt ab. Erreicht = gefüllter Akzent-Kreis mit Häkchen. */}
            <button
              type="button"
              onClick={() => toggleGoalAchieved(goal.id)}
              aria-pressed={goal.achieved}
              aria-label={goal.achieved ? `„${goal.text}“ als offen markieren` : `„${goal.text}“ als erreicht markieren`}
              title={goal.achieved ? 'Als offen markieren' : 'Als erreicht markieren'}
              className={`group flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                goal.achieved
                  ? 'bg-accent text-[#04263f] hover:brightness-110'
                  : 'bg-primary-soft text-accent hover:bg-primary hover:text-white'
              }`}
            >
              {goal.achieved ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                <>
                  <span className="group-hover:hidden">{index + 1}</span>
                  <Check size={16} strokeWidth={3} className="hidden group-hover:block" />
                </>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`break-words text-sm font-semibold leading-snug ${goal.achieved ? 'text-muted' : 'text-ink'}`}>
                {goal.text}
              </p>
              <div className="mt-1.5 empty:hidden">
                <CoreGoalBadge goal={goal} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
