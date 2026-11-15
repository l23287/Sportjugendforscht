import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { hasSeenOnboarding } from '../lib/onboarding';
// C3: Für den Sportart-Schutz des Aufschlagtrainings.
import { useSport } from '../context/SportContext';
import { hasServeTraining } from '../lib/sport';

export function RootRedirect() {
  return <Navigate to={hasSeenOnboarding() ? '/plaene' : '/onboarding'} replace />;
}

// C3: Schutz der Aufschlagtraining-Route. Nicht nur der Reiter wird ausgeblendet – auch ein direkter Aufruf
// (Lesezeichen, alte Adresse) führt bei anderen Sportarten zurück in den Übungsbereich.
// Gespeicherte Sessions (auch eine laufende) bleiben dabei unangetastet und sind nach dem Zurückwechseln
// zu Tischtennis wieder da.
export function ServeTrainingGuard({ children }: { children: ReactNode }) {
  const { sport } = useSport();
  if (!hasServeTraining(sport)) return <Navigate to="/uebungen" replace />;
  return <>{children}</>;
}
