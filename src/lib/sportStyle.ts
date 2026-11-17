import type { CSSProperties } from 'react';

// C2c: Gemeinsamer Stil für die Sportfarbe eines ganzen Sport-Elements (Anzeige oben rechts, Auswahl-Chips,
// aktuelle Sportart, Vorschauen, Sporticon). Per style statt dynamischer Tailwind-Klasse – Tailwind generiert keine
// Klassen aus Laufzeitwerten.
//
// C15: Dezenter – statt Rahmen in VOLLER Sportfarbe (C2b/C2c) nur noch ein leichtes Leuchten (Abstimmung im Team):
//  • feiner 1-px-Rahmen in der Sportfarbe mit geringer Deckkraft (nur eine Andeutung der Kante),
//  • weicher farbiger Schatten (Glow) nach außen,
//  • schwach getönter Hintergrund.
// Drei Stufen: `soft` (Chips in langen Listen), `default` (einzelne Anzeigen), `strong` (ausgewählt).
// Alle Elemente setzen dazu die Klasse `border` (1 px) – nie mehr `border-2`.
export type SportGlowLevel = 'soft' | 'default' | 'strong';

// Hex-Alpha: 1f ≈ 12 %, 33 = 20 %, 4d = 30 %, 59 = 35 %, 73 = 45 %, 0a ≈ 4 %, 14 ≈ 8 %, 24 ≈ 14 %.
const GLOW: Record<SportGlowLevel, { border: string; tint: string; shadow: (c: string) => string }> = {
  soft: { border: '1f', tint: '0a', shadow: (c) => `0 0 10px -4px ${c}59` },
  default: { border: '4d', tint: '14', shadow: (c) => `0 0 14px -3px ${c}59` },
  strong: { border: '73', tint: '24', shadow: (c) => `0 0 18px -2px ${c}73` },
};

export function sportGlowStyle(color: string, level: SportGlowLevel = 'default'): CSSProperties {
  const g = GLOW[level];
  return {
    '--sport-color': color,
    borderColor: `${color}${g.border}`,
    backgroundColor: `${color}${g.tint}`,
    boxShadow: g.shadow(color),
  } as CSSProperties;
}
