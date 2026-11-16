import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppDataProvider } from './context/AppDataContext';
import { SportProvider } from './context/SportContext';
// C9: Trainer-Funktionen (app-weit).
import { TrainerFeaturesProvider } from './context/TrainerFeaturesContext';
import { AppShell } from './components/AppShell';
import { Disclaimer } from './components/Disclaimer';
import { SiteGate } from './components/SiteGate';
import { ScrollToTop } from './components/ScrollToTop';
// C3: ServeTrainingGuard sperrt das Aufschlagtraining für andere Sportarten als Tischtennis.
// C10: RequireOnboarding – Einführung vor jedem Einstieg in die App.
import { RequireOnboarding, RootRedirect, ServeTrainingGuard } from './components/RouteGuards';
import { Onboarding } from './pages/Onboarding';
import { PlansOverview } from './pages/PlansOverview';
import { PlanForm } from './pages/PlanForm';
import { PlanDetail } from './pages/PlanDetail';
import { Exercises } from './pages/Exercises';
// C3: Übungsbereich mit Reitern.
import { ExercisesLayout } from './pages/ExercisesLayout';
import { Settings } from './pages/Settings';
import { Statistics } from './pages/Statistics';
import { ServeTraining } from './pages/ServeTraining';
// C6: Kalender mit Monatsansicht.
import { Calendar } from './pages/Calendar';

export default function App() {
  return (
    <SportProvider>
      <SiteGate>
        <AppDataProvider>
          {/* C9: Schalter für Zielgruppe/Schwierigkeitsgrad – für alle Seiten verfügbar. */}
          <TrainerFeaturesProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/onboarding" element={<Onboarding />} />

              {/* C10: Alle App-Seiten setzen die (aktuelle) Einführung voraus. */}
              <Route
                element={
                  <RequireOnboarding>
                    <AppShell />
                  </RequireOnboarding>
                }
              >
                <Route path="/plaene" element={<PlansOverview />} />
                <Route path="/plaene/neu" element={<PlanForm />} />
                <Route path="/plaene/:id" element={<PlanDetail />} />
                <Route path="/plaene/:id/bearbeiten" element={<PlanForm />} />
                {/* C3: Übungsbereich mit Reitern; Aufschlagtraining als Unterseite, nur für Tischtennis. */}
                <Route path="/uebungen" element={<ExercisesLayout />}>
                  <Route index element={<Exercises />} />
                  <Route
                    path="aufschlagtraining"
                    element={
                      <ServeTrainingGuard>
                        <ServeTraining />
                      </ServeTrainingGuard>
                    }
                  />
                </Route>
                {/* C6: Kalender */}
                <Route path="/kalender" element={<Calendar />} />
                <Route path="/statistiken" element={<Statistics />} />
                {/* C3: Alte Adresse bleibt für Lesezeichen erhalten und leitet in den Übungsbereich weiter. */}
                <Route path="/aufschlagtraining" element={<Navigate to="/uebungen/aufschlagtraining" replace />} />
                <Route path="/einstellungen" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          </TrainerFeaturesProvider>
        </AppDataProvider>
      </SiteGate>
      <Disclaimer />
    </SportProvider>
  );
}
