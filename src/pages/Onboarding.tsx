// C10: Neue App-Einführung – ersetzt die alte dreiteilige Tischtennis-Einführung (Abstimmung im Team).
// Entwurf mit Claude Design (Link in docs/chunks/C10.md), umgesetzt 1:1 mit den App-Bausteinen.
// Sechs Schritte: Sportart wählen · Übungen · Trainingspläne · Kalender · Kernziele · Los geht's.
// Design-Regeln aus bisherigem Feedback: Sportfarbe umrandet das GANZE Element (C2b/C2c), keine Extra-Kästchen,
// Vergangenes grau statt rot (C6a), kurze Texte ohne Umbruch am Handy (C9a), feste Positionen für
// „Überspringen“ (oben rechts) und „Weiter“ (unten bzw. am Desktop unter dem Text).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, CircleDot, SlidersHorizontal, Target } from 'lucide-react';
import { BlobBackground } from '../components/BlobBackground';
import { TrainerProMark } from '../components/Logo';
import { CalendarPreview, ExercisePreview, GoalsPreview, PlanPreview } from '../components/OnboardingPreviews';
import { useSport } from '../context/SportContext';
import { markOnboardingSeen } from '../lib/onboarding';
import { PRESET_SPORTS, hasServeTraining } from '../lib/sport';
import { sportFrameStyle } from '../lib/sportStyle';
import type { Sport } from '../types';

// C10: Vorauswahl im ersten Schritt – die bekanntesten Sportarten; „Alle anzeigen“ blendet die übrigen ein.
const QUICK_SPORT_IDS = ['tischtennis', 'fussball', 'tennis', 'basketball', 'handball', 'volleyball', 'schwimmen', 'turnen'];

interface Step {
  eyebrow: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    eyebrow: 'Willkommen bei TrainerPro',
    title: 'Für welche Sportart trainierst du?',
    body: 'Deine Pläne, Übungen und Ziele werden je Sportart getrennt gespeichert. Wechseln geht jederzeit oben rechts.',
  },
  {
    eyebrow: 'Schritt 2 · Übungen',
    title: 'Deine Übungsdatenbank',
    body: 'Lege Übungen mit Ziel, Schwierigkeitsgrad und Dauer an – auf die Sekunde genau.',
  },
  {
    eyebrow: 'Schritt 3 · Trainingspläne',
    title: 'Pläne bauen, Training starten',
    body: 'Stelle Übungen zu Plänen zusammen und führe das Training mit Timer durch – Übung für Übung.',
  },
  {
    eyebrow: 'Schritt 4 · Kalender',
    title: 'Trainings fest einplanen',
    body: 'Lege Pläne auf Tage – einmalig oder jede Woche zur gleichen Uhrzeit. Einzelne Termine trägst du einfach aus.',
  },
  {
    eyebrow: 'Schritt 5 · Kernziele',
    title: 'Ziele im Blick behalten',
    body: 'Bis zu drei Kernziele je Sportart erscheinen auf deiner Startseite. Erreicht? Einfach abhaken.',
  },
  {
    eyebrow: 'Fertig eingerichtet',
    title: 'Los geht’s!',
    body: 'Du startest mit dieser Sportart. Alles Weitere passt du jederzeit in den Einstellungen an.',
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { from?: string; replay?: boolean } | null;
  const { sport, sports, setSport } = useSport();
  const [step, setStep] = useState(0);
  const [showAllSports, setShowAllSports] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  // C10: Fokus nach jedem Schrittwechsel auf die Überschrift – Screenreader lesen den neuen Schritt vor,
  // Tastatur-Nutzer:innen starten oben im neuen Inhalt (nicht beim ersten Laden).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  // C10: Pfeiltasten ← → blättern (nicht, solange ein Eingabefeld/Button den Fokus hat und selbst reagiert).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.key === 'ArrowRight') setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (event.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function finish() {
    markOnboardingSeen();
    // C10: „Erneut ansehen“ aus den Einstellungen führt dorthin zurück; sonst zur ursprünglich gewünschten Seite.
    const target = routeState?.replay ? '/einstellungen' : routeState?.from && routeState.from !== '/onboarding' ? routeState.from : '/plaene';
    navigate(target, { replace: true });
  }

  // C10: Sportarten im ersten Schritt – Vorauswahl plus die aktuell gewählte (falls nicht dabei, z. B. eine eigene).
  const quickSports = QUICK_SPORT_IDS.map((id) => sports.find((s) => s.id === id)).filter((s): s is Sport => Boolean(s));
  if (!quickSports.some((s) => s.id === sport.id)) quickSports.unshift(sport);
  const visibleSports = showAllSports
    ? [...quickSports, ...sports.filter((s) => !quickSports.some((q) => q.id === s.id))]
    : quickSports;

  const nextLabel = isFirst ? `Weiter mit ${sport.name}` : isLast ? 'Los geht’s' : 'Weiter';

  const navButtons = (
    <div className="flex items-center gap-3">
      {!isFirst && (
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          aria-label="Zurück"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink transition hover:bg-surface-2"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <button
        type="button"
        onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
        className="flex h-14 min-w-0 flex-1 items-center justify-center gap-2 truncate rounded-full bg-gradient-to-br from-primary to-primary-dark px-6 font-semibold text-white shadow-[0_10px_25px_rgba(37,99,235,0.35)] transition hover:brightness-110 lg:w-64 lg:flex-none"
      >
        {nextLabel}
      </button>
    </div>
  );

  return (
    // C10: pb-16 am Handy, damit der feste Hinweis-Streifen unten (Disclaimer) die Buttons nicht überdeckt.
    <div className="relative flex min-h-dvh flex-col px-6 pb-16 pt-6 lg:px-12 lg:pb-12 lg:pt-8">
      <BlobBackground />

      {/* C10: Kopfzeile – Logo, Fortschritt (am Handy darunter, am Desktop daneben), „Überspringen“ oben rechts. */}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white">
          <TrainerProMark mono className="h-5 w-auto" />
        </div>
        <span className="font-display text-lg font-extrabold text-ink">TrainerPro</span>
        <div
          role="progressbar"
          aria-label={`Schritt ${step + 1} von ${STEPS.length}`}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          className="order-last flex w-full gap-1.5 lg:order-none lg:ml-12 lg:w-auto lg:max-w-sm lg:flex-1"
        >
          {STEPS.map((s, index) => (
            <span
              key={s.title}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index === step
                  ? 'bg-gradient-to-r from-primary to-primary-dark'
                  : index < step
                    ? 'bg-primary'
                    : 'bg-surface-2'
              }`}
            />
          ))}
        </div>
        {!isLast && (
          <button
            type="button"
            onClick={() => setStep(STEPS.length - 1)}
            className="ml-auto px-1 py-3 text-sm font-semibold text-muted transition hover:text-ink"
          >
            Überspringen
          </button>
        )}
      </header>

      {/* C10: Inhalt – am Handy untereinander, ab lg zweispaltig (Text links, Vorschau rechts) wie im Entwurf. */}
      <main
        key={step}
        // C10: Schritt 1 hat keine Vorschau → am Desktop einspaltig und zentriert statt leerer rechter Spalte.
        className={`animate-fade-in mx-auto flex w-full max-w-md flex-1 flex-col gap-8 pt-8 lg:pt-0 ${
          isFirst ? 'lg:max-w-2xl lg:justify-center' : 'lg:grid lg:max-w-5xl lg:grid-cols-2 lg:items-center lg:gap-16'
        }`}
      >
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-accent">{current.eyebrow}</p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-1.5 text-balance font-display text-3xl font-extrabold leading-tight text-ink outline-none lg:text-5xl"
          >
            {current.title}
          </h1>
          {/* C10: text-pretty verhindert einzelne Wörter in der letzten Zeile (Feinschliff nach Test am Handy). */}
          <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted lg:text-base">{current.body}</p>

          {isFirst && (
            <SportChoice
              sports={visibleSports}
              selectedId={sport.id}
              onSelect={setSport}
              showAll={showAllSports}
              onToggleAll={() => setShowAllSports((v) => !v)}
            />
          )}

          {/* C10: Am Desktop stehen die Buttons direkt unter dem Text (Entwurf „Desktop“). */}
          <div className="mt-10 hidden lg:block">{navButtons}</div>
          <p className="mt-4 hidden text-xs text-muted-2 lg:block">Tipp: Mit den Pfeiltasten ← → blätterst du durch die Einführung.</p>
        </div>

        {!isFirst && (
          <div className="w-full">
            {step === 1 && <ExercisePreview />}
            {step === 2 && <PlanPreview />}
            {step === 3 && <CalendarPreview />}
            {step === 4 && <GoalsPreview />}
            {isLast && <FinalStep sport={sport} />}
          </div>
        )}
      </main>

      {/* C10: Am Handy stehen die Buttons fest unten. */}
      <div className="mx-auto mt-8 w-full max-w-md lg:hidden">
        {isFirst && <p className="mb-3 text-center text-xs text-muted-2">Eigene Sportarten legst du später in den Einstellungen an.</p>}
        {navButtons}
        {isLast && <p className="mt-3 text-center text-xs text-muted-2">Die Einführung findest du später in den Einstellungen.</p>}
      </div>
    </div>
  );
}

// C10: Sportart-Auswahl – Chips im Stil von C2c (ganzes Element in Sportfarbe umrandet, gewählt = stärker getönt
// + Ring + Häkchen). Mindesthöhe 44 px für Touch.
function SportChoice({
  sports,
  selectedId,
  onSelect,
  showAll,
  onToggleAll,
}: {
  sports: Sport[];
  selectedId: string;
  onSelect: (id: string) => void;
  showAll: boolean;
  onToggleAll: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <div role="group" aria-label="Sportart wählen" className="flex flex-wrap gap-2">
        {sports.map((item) => {
          const selected = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={selected}
              style={sportFrameStyle(item.color, selected ? '40' : '0f')}
              className={`inline-flex h-11 items-center gap-2 rounded-2xl border-2 px-3.5 text-sm font-semibold transition ${
                selected ? 'text-ink ring-2 ring-ink ring-offset-2 ring-offset-bg' : 'text-muted hover:text-ink'
              }`}
            >
              <span aria-hidden="true">{item.emoji}</span>
              <span className="max-w-[10rem] truncate">{item.name}</span>
              {selected && <Check size={14} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onToggleAll}
        aria-expanded={showAll}
        className="self-start py-2 text-sm font-semibold text-accent underline-offset-2 hover:underline"
      >
        {showAll ? 'Weniger anzeigen' : `Alle ${PRESET_SPORTS.length} Sportarten anzeigen`}
      </button>
      <p className="hidden text-xs text-muted-2 lg:block">Eigene Sportarten legst du später in den Einstellungen an.</p>
    </div>
  );
}

// C10: Letzter Schritt – gewählte Sportart (wie die Anzeige oben rechts, C2b) und Hinweise auf die Einstellungen.
// Das Aufschlagtraining erscheint nur bei Tischtennis (C3).
function FinalStep({ sport }: { sport: Sport }) {
  const tips: { icon: ReactNode; title: string; text: string }[] = [
    { icon: <Target size={18} />, title: 'Kernziele festlegen', text: 'Einstellungen › Kernziele' },
    {
      icon: <SlidersHorizontal size={18} />,
      title: 'Trainer-Funktionen anpassen',
      text: 'Zielgruppe und Schwierigkeitsgrad ein- oder ausblenden',
    },
  ];
  if (hasServeTraining(sport)) {
    tips.push({ icon: <CircleDot size={18} />, title: 'Aufschlagtraining', text: 'Übungen › Aufschlagtraining' });
  }
  return (
    <div className="flex flex-col gap-6">
      <span
        style={sportFrameStyle(sport.color)}
        className="inline-flex h-11 items-center gap-2.5 self-start rounded-2xl border-2 px-4 font-semibold text-ink"
      >
        <span aria-hidden="true">{sport.emoji}</span>
        {sport.name}
      </span>
      <ul className="flex flex-col gap-4">
        {tips.map((tip) => (
          <li key={tip.title} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-accent" aria-hidden="true">
              {tip.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{tip.title}</p>
              <p className="text-sm text-muted">{tip.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
