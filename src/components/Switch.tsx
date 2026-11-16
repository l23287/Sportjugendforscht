// C9: Neue Komponente – Ein/Aus-Schalter im App-Design.
// Eingeschaltet: blauer Verlauf wie die aktive Navigation; ausgeschaltet: neutrale Fläche mit Rahmen.
// Barrierefrei als role="switch" mit aria-checked; per Tastatur (Leertaste/Enter) bedienbar, da <button>.
// C9a: Zusätzlich Zwischenzustand 'mixed' (für den Hauptschalter, wenn nur ein Teil eingeschaltet ist).
interface SwitchProps {
  checked: boolean | 'mixed';
  onChange: (checked: boolean) => void;
  /** ID des sichtbaren Labels (aria-labelledby). */
  labelledBy: string;
  /** ID der Erklärung (aria-describedby). */
  describedBy?: string;
}

export function Switch({ checked, onChange, labelledBy, describedBy }: SwitchProps) {
  const mixed = checked === 'mixed';
  return (
    <button
      type="button"
      // C9a: role="checkbox" kennt den Zwischenzustand „mixed“ offiziell (role="switch" nicht) – nur dafür.
      role={mixed ? 'checkbox' : 'switch'}
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      // C9a: Aus dem Zwischenzustand heraus wird eingeschaltet (wie bei „Alle auswählen“).
      onClick={() => onChange(mixed ? true : !checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        checked === true
          ? 'border-transparent bg-gradient-to-br from-primary to-primary-dark shadow-[0_6px_16px_rgba(37,99,235,0.35)]'
          : mixed
            ? 'border-primary/60 bg-primary-soft'
            : 'border-border bg-bg-soft'
      }`}
    >
      {/* C9a: Zwischenzustand = Knopf in der Mitte, Akzentfarbe. */}
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 rounded-full shadow transition-transform ${
          checked === true ? 'translate-x-6 bg-white' : mixed ? 'translate-x-3.5 bg-accent' : 'translate-x-1 bg-muted-2'
        }`}
      />
    </button>
  );
}
