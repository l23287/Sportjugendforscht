// C2: Neue Komponente – einheitliches Sporticon mit farblicher Umrandung in der Farbe der Sportart.
// Wird überall verwendet, wo das Sporticon erscheint (TopBar, Sidebar, Pläne, Statistiken, Einstellungen),
// damit Aussehen und spätere Änderungen an genau einer Stelle liegen.
//
// Die Farbe wird bewusst per `style` (CSS-Variable) gesetzt und NICHT als dynamische Tailwind-Klasse
// (z. B. `border-${color}`): Tailwind erzeugt nur Klassen, die wörtlich im Quellcode stehen.
import type { Sport } from '../types';
// C15: Gemeinsamer Leucht-Stil.
import { sportGlowStyle } from '../lib/sportStyle';

type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

const sizeClasses: Record<BadgeSize, string> = {
  // C15: einheitlich 1-px-Rahmen (vorher 1,5–2,5 px in voller Sportfarbe) – die Farbe trägt das Leuchten.
  xs: 'h-6 w-6 rounded-lg border text-xs',
  sm: 'h-8 w-8 rounded-xl border text-base',
  md: 'h-11 w-11 rounded-2xl border text-xl',
  lg: 'h-14 w-14 rounded-2xl border text-3xl',
};

interface SportBadgeProps {
  sport: Pick<Sport, 'emoji' | 'color' | 'name'>;
  size?: BadgeSize;
  className?: string;
  /** C2: true, wenn der Name direkt daneben steht – dann ist das Icon rein dekorativ für Screenreader. */
  decorative?: boolean;
}

export function SportBadge({ sport, size = 'sm', className = '', decorative = true }: SportBadgeProps) {
  // C2: Rahmen in voller Sportfarbe (Kontrast ≥ 3:1 geprüft), Hintergrund leicht getönt (Hex-Alpha 1f ≈ 12 %).
  // C15: Ersetzt durch das gemeinsame dezente Leuchten (feiner Rahmen + farbiger Glow) – wie alle Sport-Elemente.
  const style = sportGlowStyle(sport.color);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center leading-none ${sizeClasses[size]} ${className}`}
      style={style}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': sport.name })}
    >
      {sport.emoji}
    </span>
  );
}
