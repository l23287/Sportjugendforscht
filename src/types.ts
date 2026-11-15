export type Difficulty = 'Anfänger' | 'Fortgeschritten';

export const DIFFICULTIES: Difficulty[] = ['Anfänger', 'Fortgeschritten'];

// C1: Die Sportart ist kein fester Union-Typ mehr ('Tischtennis' | 'Beach Volleyball'),
// sondern ein Objekt mit stabiler ID. So können Nutzer:innen eigene Sportarten anlegen,
// und spätere Chunks können Daten über die ID zuordnen (C5: Pläne/Übungen je Sportart),
// ohne dass ein Umbenennen Zuordnungen zerstört. Symbol/Farbe folgen in C2.
export type SportId = string;

// C1: Kategorien zur Gruppierung der Vorauswahl in den Einstellungen.
export type SportCategory =
  | 'Ballsport'
  | 'Rückschlagsport'
  | 'Turnen & Tanz'
  | 'Kampfsport'
  | 'Ausdauer'
  | 'Wassersport'
  | 'Outdoor & Präzision'
  | 'Eigene';

export const SPORT_CATEGORIES: SportCategory[] = [
  'Ballsport',
  'Rückschlagsport',
  'Turnen & Tanz',
  'Kampfsport',
  'Ausdauer',
  'Wassersport',
  'Outdoor & Präzision',
  'Eigene',
];

// C1: Definition einer Sportart (vorgegeben oder eigen).
export interface Sport {
  id: SportId;
  name: string;
  emoji: string;
  /** C2: Akzentfarbe (Hex, z. B. "#f97316") für die farbliche Umrandung des Sporticons. */
  color: string;
  category: SportCategory;
  /** C1: true = von Nutzer:in angelegt (löschbar), false = Teil der Vorauswahl. */
  custom: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  goal: string;
  durationMinutes: number;
  difficulty: Difficulty;
  createdAt: string;
}

export type ExerciseInput = Omit<Exercise, 'id' | 'createdAt'>;

export interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  targetGroup: string;
  date: string | null;
  exerciseIds: string[];
  createdAt: string;
}

export type PlanInput = Omit<TrainingPlan, 'id' | 'createdAt'>;

export type ServeLength = 'Kurz' | 'Halblang' | 'Lang';

export const SERVE_LENGTHS: ServeLength[] = ['Kurz', 'Halblang', 'Lang'];

export type ServePlacement = 'Vorhand' | 'Mitte' | 'Rückhand';

export const SERVE_PLACEMENTS: ServePlacement[] = ['Vorhand', 'Mitte', 'Rückhand'];

export type ServeResult = 'gut' | 'schlecht';

export interface ServeAttempt {
  id: string;
  result: ServeResult;
  createdAt: string;
}

export interface ServeSessionGoal {
  length: ServeLength;
  placement: ServePlacement;
  type: string;
}

export interface ServeSession extends ServeSessionGoal {
  id: string;
  attempts: ServeAttempt[];
  startedAt: string;
  endedAt: string | null;
}
