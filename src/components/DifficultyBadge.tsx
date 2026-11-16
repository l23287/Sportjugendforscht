import type { Difficulty } from '../types';
// C9: Badge respektiert den Schalter „Schwierigkeitsgrad“ zentral – alle Verwendungsstellen (Übungskarte, Übungspool,
// ausgewählte Übungen, Plandetail) blenden ihn dadurch automatisch aus.
import { useTrainerFeatures } from '../context/TrainerFeaturesContext';

// C9: `difficulty` kann null sein („ohne Angabe“) – dann wird kein Badge angezeigt.
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty | null }) {
  const { features } = useTrainerFeatures();
  if (!features.difficulty || !difficulty) return null;
  const isAdvanced = difficulty === 'Fortgeschritten';
  return (
    <span
      className={`inline-flex items-center rounded-2xl px-3 py-1 text-xs font-semibold whitespace-nowrap ${
        isAdvanced ? 'bg-primary-soft text-accent' : 'bg-surface-2 text-muted'
      }`}
    >
      {difficulty}
    </span>
  );
}
