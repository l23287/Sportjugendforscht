// C15: Neue Komponenten – einheitliches Ein-/Ausklappen in der ganzen App.
//  • `Collapse`: animiert die Höhe (CSS-Grid 0fr ↔ 1fr, ~200 ms) – ohne feste Höhen, daher für jeden Inhalt geeignet.
//    Eingeklappter Inhalt ist `inert` (nicht fokussierbar, für Screenreader verborgen).
//  • `CollapsibleSection`: Karte im bestehenden Einstellungen-Stil (rounded-3xl, border, bg-surface, p-5). Die ganze
//    Kopfzeile ist der Button (aria-expanded), rechts ein drehender Pfeil; eingeklappt zeigt eine kurze Zusammenfassung
//    den Stand, damit man nicht aufklappen muss.
import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export function Collapse({ open, id, children }: { open: boolean; id?: string; children: ReactNode }) {
  return (
    <div
      id={id}
      className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
      inert={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/** C15: Drehender Pfeil – gleiche Größe und Farbe an allen Klapp-Stellen. */
export function CollapseChevron({ open, size = 20 }: { open: boolean; size?: number }) {
  return (
    <ChevronDown
      size={size}
      aria-hidden="true"
      className={`shrink-0 text-muted transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
    />
  );
}

interface CollapsibleSectionProps {
  title: ReactNode;
  /** Kurzer Stand im Kopf (z. B. „2 von 3 erreicht“) – immer sichtbar. */
  summary?: ReactNode;
  /** Erklärtext – erscheint erst aufgeklappt, damit der Kopf einzeilig ruhig bleibt. */
  description?: ReactNode;
  defaultOpen?: boolean;
  /** HTML-id der Karte (z. B. Sprungziel „#kernziele“). */
  id?: string;
  children: ReactNode;
}

export function CollapsibleSection({ title, summary, description, defaultOpen = false, id, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  return (
    <section id={id} className="scroll-mt-6 rounded-3xl border border-border bg-surface">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-3 rounded-3xl p-5 text-left transition hover:bg-surface-2/40"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-bold text-ink">{title}</span>
            {summary && <span className="mt-0.5 flex min-w-0 items-center gap-2 text-sm text-muted">{summary}</span>}
          </span>
          <CollapseChevron open={open} />
        </button>
      </h2>
      <Collapse open={open} id={contentId}>
        {/* Innenabstand im überlaufenden Bereich – so werden Fokus-Ringe nicht abgeschnitten. */}
        <div className="flex flex-col gap-4 px-5 pb-5">
          {description && <p className="-mt-1 text-sm text-muted">{description}</p>}
          {children}
        </div>
      </Collapse>
    </section>
  );
}
