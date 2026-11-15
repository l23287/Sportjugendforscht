import type { CSSProperties } from 'react';

// C2c: Gemeinsamer Stil für die farbige Umrandung eines ganzen Sport-Elements (Anzeige oben rechts,
// Auswahl-Chips, aktuelle Sportart, Vorschauen). Eine Stelle für Rahmen- und Tönungsfarbe.
// Per style statt dynamischer Tailwind-Klasse – Tailwind generiert keine Klassen aus Laufzeitwerten.
// `tint` ist der Hex-Alpha-Wert der Hintergrundtönung: '1f' ≈ 12 %, '0f' ≈ 6 %, '40' ≈ 25 %.
export function sportFrameStyle(color: string, tint: '0f' | '1f' | '40' = '1f'): CSSProperties {
  return {
    '--sport-color': color,
    borderColor: 'var(--sport-color)',
    backgroundColor: `${color}${tint}`,
  } as CSSProperties;
}
