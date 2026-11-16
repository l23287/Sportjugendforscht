// C6: CalendarDays für den neuen Menüpunkt „Kalender“.
import { BarChart3, CalendarDays, ClipboardList, Dumbbell, Settings } from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/plaene', label: 'Trainingspläne', icon: ClipboardList },
  { to: '/uebungen', label: 'Übungen', icon: Dumbbell },
  // C6: Kalender als eigener Menüpunkt.
  // C6a: Position rechts neben bzw. unter „Übungen“ (vorher direkt nach „Trainingspläne“).
  { to: '/kalender', label: 'Kalender', icon: CalendarDays },
  { to: '/statistiken', label: 'Statistiken', icon: BarChart3 },
  // C3: Eigener Menüpunkt „Aufschlagtraining“ entfernt – das Aufschlagtraining ist jetzt ein Reiter im
  // Übungsbereich (/uebungen/aufschlagtraining) und nur bei Tischtennis sichtbar.
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings },
];
