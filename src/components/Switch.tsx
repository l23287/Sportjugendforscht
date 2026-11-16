// C9: Neue Komponente – Ein/Aus-Schalter im App-Design.
// Eingeschaltet: blauer Verlauf wie die aktive Navigation; ausgeschaltet: neutrale Fläche mit Rahmen.
// Barrierefrei als role="switch" mit aria-checked; per Tastatur (Leertaste/Enter) bedienbar, da <button>.
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** ID des sichtbaren Labels (aria-labelledby). */
  labelledBy: string;
  /** ID der Erklärung (aria-describedby). */
  describedBy?: string;
}

export function Switch({ checked, onChange, labelledBy, describedBy }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        checked
          ? 'border-transparent bg-gradient-to-br from-primary to-primary-dark shadow-[0_6px_16px_rgba(37,99,235,0.35)]'
          : 'border-border bg-bg-soft'
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 rounded-full shadow transition-transform ${
          checked ? 'translate-x-6 bg-white' : 'translate-x-1 bg-muted-2'
        }`}
      />
    </button>
  );
}
