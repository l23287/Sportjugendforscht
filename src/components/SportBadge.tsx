// C2: Neue Komponente – einheitliches Sporticon mit farblicher Umrandung in der Farbe der Sportart.
// Wird überall verwendet, wo das Sporticon erscheint (TopBar, Sidebar, Pläne, Statistiken, Einstellungen),
// damit Aussehen und spätere Änderungen an genau einer Stelle liegen.
//
// Die Farbe wird bewusst per `style` (CSS-Variable) gesetzt und NICHT als dynamische Tailwind-Klasse
// (z. B. `border-${color}`): Tailwind erzeugt nur Klassen, die wörtlich im Quellcode stehen.
import type { CSSProperties } from 'react';
import type { Sport } from '../types';

type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

const sizeClasses: Record<BadgeSize, string> = {
  xs: 'h-6 w-6 rounded-lg border-[1.5px] text-xs',
  sm: 'h-8 w-8 rounded-xl border-2 text-base',
  md: 'h-11 w-11 rounded-2xl border-2 text-xl',
  lg: 'h-14 w-14 rounded-2xl border-[2.5px] text-3xl',
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
  const style = {
    '--sport-color': sport.color,
    borderColor: 'var(--sport-color)',
    backgroundColor: `${sport.color}1f`,
  } as CSSProperties;

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
