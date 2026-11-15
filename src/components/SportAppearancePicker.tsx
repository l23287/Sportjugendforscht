// C2: Neue Komponente – Auswahl von Symbol und Farbe für eigene Sportarten.
// Wird beim Anlegen und beim nachträglichen Bearbeiten einer eigenen Sportart verwendet.
// Nur feste Listen (CUSTOM_SPORT_EMOJIS / CUSTOM_SPORT_COLORS), damit alle Farben den Kontrast einhalten.
import { Check } from 'lucide-react';
import { labelClass } from '../lib/formStyles';
import { CUSTOM_SPORT_COLORS, CUSTOM_SPORT_EMOJIS, type SportAppearance } from '../lib/sport';

interface SportAppearancePickerProps {
  value: SportAppearance;
  onChange: (value: SportAppearance) => void;
  /** C2: Präfix für eindeutige IDs, falls die Komponente mehrfach auf einer Seite vorkommt. */
  idPrefix: string;
}

export function SportAppearancePicker({ value, onChange, idPrefix }: SportAppearancePickerProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className={labelClass} id={`${idPrefix}-emoji-label`}>
          Symbol
        </p>
        {/* C2: Radiogruppe statt einzelner Buttons – Screenreader erkennen die Einfachauswahl. */}
        <div role="radiogroup" aria-labelledby={`${idPrefix}-emoji-label`} className="grid grid-cols-8 gap-1.5">
          {CUSTOM_SPORT_EMOJIS.map((emoji) => {
            const selected = value.emoji === emoji;
            return (
              <button
                key={emoji}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Symbol ${emoji}`}
                onClick={() => onChange({ ...value, emoji })}
                className={`flex aspect-square items-center justify-center rounded-xl border text-lg transition ${
                  selected ? 'border-primary bg-primary-soft' : 'border-border bg-bg-soft hover:border-muted-2'
                }`}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className={labelClass} id={`${idPrefix}-color-label`}>
          Farbe
        </p>
        <div role="radiogroup" aria-labelledby={`${idPrefix}-color-label`} className="flex flex-wrap gap-2">
          {CUSTOM_SPORT_COLORS.map((color) => {
            const selected = value.color === color.value;
            return (
              <button
                key={color.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={color.label}
                title={color.label}
                onClick={() => onChange({ ...value, color: color.value })}
                // C2: Farbe per style (nicht als dynamische Tailwind-Klasse, die nicht generiert würde).
                style={{ backgroundColor: color.value }}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[#0a0f1c] transition ${
                  selected ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : 'hover:scale-110'
                }`}
              >
                {selected && <Check size={16} strokeWidth={3} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
