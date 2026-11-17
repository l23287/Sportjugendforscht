// C11: Kurzbeschreibung der Sätze („3 Sätze · 8–12 Wdh. · 30–40 kg · Pause 1:30 Min.“) als gemeinsamer Baustein für
// Übungskarte und Plandetail. Jeder Teil bleibt zusammen (kein Umbruch mitten in „30–40 kg“), umbrochen wird nur
// zwischen den Teilen; das Symbol schrumpft nicht (im Handy-Test gefunden).
import { Fragment } from 'react';
import { Layers } from 'lucide-react';
import type { StrengthSpec } from '../types';
import { summarizeStrength } from '../lib/strength';

export function StrengthSummary({ spec, className = '' }: { spec: StrengthSpec; className?: string }) {
  const parts = summarizeStrength(spec).split(' · ');
  return (
    <span className={`inline-flex items-start gap-1 text-xs text-muted-2 ${className}`}>
      <Layers size={13} className="mt-px shrink-0" aria-hidden="true" />
      <span>
        {/* Teil + „ ·“ bleiben zusammen; das Leerzeichen danach steht AUSSERHALB → dort darf umbrochen werden. */}
        {parts.map((part, i) => (
          <Fragment key={i}>
            <span className="whitespace-nowrap">
              {part}
              {i < parts.length - 1 && ' ·'}
            </span>
            {i < parts.length - 1 && ' '}
          </Fragment>
        ))}
      </span>
    </span>
  );
}
