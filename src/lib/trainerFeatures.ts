// C9: Ein-/ausschaltbare Trainer-Funktionen. Eine zentrale Liste – neue Schalter werden nur hier ergänzt,
// Einstellungs-Karte und Speicherung übernehmen sie automatisch.
import { Gauge, Users } from 'lucide-react';
import type { ComponentType } from 'react';

export type TrainerFeatureKey = 'targetGroup' | 'difficulty';

export type TrainerFeatures = Record<TrainerFeatureKey, boolean>;

export interface TrainerFeatureDefinition {
  key: TrainerFeatureKey;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const TRAINER_FEATURES: TrainerFeatureDefinition[] = [
  {
    key: 'targetGroup',
    label: 'Zielgruppe',
    description: 'Zielgruppe bei Trainingsplänen erfassen und anzeigen.',
    icon: Users,
  },
  {
    key: 'difficulty',
    label: 'Schwierigkeitsgrad',
    description: 'Schwierigkeitsgrad bei Übungen erfassen, anzeigen und in den Statistiken auswerten.',
    icon: Gauge,
  },
];

// C9: Standard = alles eingeschaltet → für bestehende Nutzer:innen sieht die App unverändert aus.
export const DEFAULT_TRAINER_FEATURES: TrainerFeatures = { targetGroup: true, difficulty: true };

/** C9: Gespeicherte Schalter defensiv einlesen; fehlende/ungültige Werte → Standard (eingeschaltet). */
export function sanitizeTrainerFeatures(value: unknown): TrainerFeatures {
  const result = { ...DEFAULT_TRAINER_FEATURES };
  if (!value || typeof value !== 'object') return result;
  for (const { key } of TRAINER_FEATURES) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v === 'boolean') result[key] = v;
  }
  return result;
}
