import { BarChart3, ClipboardList, Dumbbell, Settings } from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/plaene', label: 'Trainingspläne', icon: ClipboardList },
  { to: '/uebungen', label: 'Übungen', icon: Dumbbell },
  { to: '/statistiken', label: 'Statistiken', icon: BarChart3 },
  // C3: Eigener Menüpunkt „Aufschlagtraining“ entfernt – das Aufschlagtraining ist jetzt ein Reiter im
  // Übungsbereich (/uebungen/aufschlagtraining) und nur bei Tischtennis sichtbar.
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings },
];
