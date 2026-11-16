// C10: Gesehen-Markierung mit Versionsnummer. Version 2 = neue Einführung aus C10.
// Vorher (Version 1) gab es nur 'trainerpro:onboarding-seen' = '1' → bestehende Nutzer:innen sehen die neue
// Einführung einmal (Abstimmung im Team), danach nicht mehr.
const VERSION_KEY = 'trainerpro:onboarding-version';
const LEGACY_KEY = 'trainerpro:onboarding-seen';
export const ONBOARDING_VERSION = 2;

export function hasSeenOnboarding(): boolean {
  // C10: Abgesichert wie loadJSON – ohne verfügbaren Speicher (z. B. privater Modus) würde die Einführung sonst bei
  // jedem Seitenwechsel erneut erscheinen. Dann lieber direkt in die App.
  try {
    return Number(localStorage.getItem(VERSION_KEY)) >= ONBOARDING_VERSION;
  } catch {
    return true;
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(VERSION_KEY, String(ONBOARDING_VERSION));
    // C10: Alte Markierung aufräumen.
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Speicher nicht verfügbar – Einführung wird beim nächsten Besuch erneut gezeigt.
  }
}
