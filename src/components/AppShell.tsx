import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileTopBar } from './MobileTopBar';
import { BlobBackground } from './BlobBackground';
// C2a: Sportart-Anzeige oben rechts auch am Desktop.
import { SportPill } from './SportPill';

export function AppShell() {
  return (
    <div className="relative min-h-dvh md:flex">
      <BlobBackground />
      <Sidebar />
      <div className="min-w-0 flex-1">
        <MobileTopBar />
        {/* C2a: Desktop-Kopfzeile mit Sporticon oben rechts (am Handy übernimmt das die MobileTopBar). */}
        <header className="mx-auto hidden max-w-6xl justify-end px-8 pt-6 md:flex">
          <SportPill />
        </header>
        {/* C2a: Oberer Abstand am Desktop von pt-8 auf pt-2 reduziert, da die Kopfzeile darüber liegt. */}
        <main className="mx-auto max-w-6xl px-4 pt-2 pb-28 md:px-8 md:pb-12 md:pt-2">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
