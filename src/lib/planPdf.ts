// C16: Trainingsplan als PDF (A4 hochkant) – komplett im Browser erzeugt, nichts wird hochgeladen.
// Bewusst ein PAPIER-Layout statt App-Design (Abstimmung im Team): weißer Grund, dunkle Schrift, wenig Farbe –
// gut lesbar, tintensparend, zum Aushängen oder Verteilen. Farbakzente nur: TrainerPro-Blau im Kopf und ein schmaler
// Streifen in der Sportfarbe (Emojis kann die PDF-Standardschrift nicht darstellen).
// jsPDF wird erst beim Antippen nachgeladen (dynamischer Import) – der App-Start bleibt unverändert schnell.
import type { jsPDF as JsPDF } from 'jspdf';
import type { Exercise, Sport, TrainingPlan } from '../types';
import { formatDate, formatDuration } from './time';
import { summarizeStrength } from './strength';
import { describeRecurrence, weekdayOf, WEEKDAY_SHORT } from './recurrence';
import { getPlanSchedule } from './planStatus';
import { todayKey } from './dateKey';

export interface PlanPdfInput {
  plan: TrainingPlan;
  exercises: Exercise[];
  sport: Pick<Sport, 'name' | 'color'>;
  /** C9: Trainer-Funktionen – ausgeschaltete Angaben erscheinen auch im PDF nicht. */
  showTargetGroup: boolean;
  showDifficulty: boolean;
}

// ---- Maße (mm) und Farben ---------------------------------------------------------------------------------------
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const FOOTER_Y = PAGE_H - 10;
const BOTTOM_LIMIT = PAGE_H - 20;
const INK: RGB = [15, 23, 42];
const MUTED: RGB = [71, 85, 105];
const LIGHT: RGB = [148, 163, 184];
const LINE: RGB = [226, 232, 240];
const HEAD_BG: RGB = [241, 245, 249];
const BLUE: RGB = [37, 99, 235];
type RGB = [number, number, number];

const PT_TO_MM = 0.3528;
const lineHeight = (pt: number) => pt * PT_TO_MM * 1.35;

/**
 * C16: Die PDF-Standardschrift (Helvetica, WinAnsi) kennt Umlaute, ß, „“, – und ·, aber keine Emojis oder Pfeile.
 * Bekannte Zeichen werden ersetzt, alles andere Nicht-Darstellbare entfernt – sonst erschiene Zeichensalat.
 */
export function pdfText(text: string): string {
  const winAnsiExtra = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
  return text
    .replace(/→/g, '->')
    // Vergleichszeichen ersetzen statt entfernen – „≥ 7 von 10“ darf nicht zu „7 von 10“ werden (im Test gefunden).
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/≈/g, '~')
    .replace(/≠/g, '!=')
    .replace(/−/g, '-')
    .replace(/[✓✔]/g, 'x')
    .replace(/ | /g, ' ')
    .split('')
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || ch === '\n' || winAnsiExtra.includes(ch);
    })
    .join('')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** C16: Dateiname aus Planname und (nächstem) Termin, nur unproblematische ASCII-Zeichen. */
export function planPdfFileName(plan: Pick<TrainingPlan, 'name' | 'date' | 'recurrence'>, today: string = todayKey()): string {
  const base =
    plan.name
      .normalize('NFC')
      // Umlaute umschreiben: Manche Browser verwerfen Dateinamen mit Nicht-ASCII-Zeichen (im Test gefunden: „download“).
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss')
      .replace(/[^A-Za-z0-9_-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 60) || 'Trainingsplan';
  const date = getPlanSchedule(plan, today)?.date;
  return date ? `${base}_${date}.pdf` : `${base}.pdf`;
}

function hexToRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return BLUE;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const longDate = (key: string) => `${WEEKDAY_SHORT[weekdayOf(key)]}, ${formatDate(key)}`;

/** C16: Eckdaten des Plans als Bezeichnung/Wert-Paare (leere werden weggelassen). */
export function planPdfFacts(input: PlanPdfInput, today: string = todayKey()): [string, string][] {
  const { plan, exercises, showTargetGroup } = input;
  const facts: [string, string][] = [];
  const schedule = getPlanSchedule(plan, today);
  const time = plan.time ? ` · ${plan.time} Uhr` : '';
  if (plan.recurrence) {
    facts.push(['Wiederholung', `${describeRecurrence(plan.recurrence, plan.date)}${time}`]);
    if (schedule) facts.push([schedule.status === 'vergangen' ? 'Letzter Termin' : 'Nächster Termin', longDate(schedule.date)]);
  } else if (plan.date) {
    facts.push(['Termin', `${longDate(plan.date)}${time}`]);
  } else if (plan.time) {
    facts.push(['Uhrzeit', `${plan.time} Uhr`]);
  }
  if (showTargetGroup && plan.targetGroup.trim()) facts.push(['Zielgruppe', plan.targetGroup.trim()]);
  const total = exercises.reduce((sum, e) => sum + e.durationSeconds, 0);
  facts.push(['Umfang', `${exercises.length} ${exercises.length === 1 ? 'Übung' : 'Übungen'} · ${formatDuration(total)}`]);
  return facts;
}

export async function downloadPlanPdf(input: PlanPdfInput): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  buildPlanPdf(doc, input);
  doc.save(planPdfFileName(input.plan));
}

/** C16: Baut das Dokument (getrennt vom Speichern – so auch testbar). */
export function buildPlanPdf(doc: JsPDF, input: PlanPdfInput): void {
  const { plan, exercises, sport, showDifficulty } = input;
  const today = todayKey();
  const setColor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (size: number, style: 'normal' | 'bold' = 'normal', color: RGB = INK) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    setColor(color);
  };
  const wrap = (text: string, width: number) => doc.splitTextToSize(pdfText(text), width) as string[];
  doc.setProperties({ title: pdfText(plan.name), subject: `Trainingsplan ${pdfText(sport.name)}`, creator: 'TrainerPro' });

  // ---- Kopf ------------------------------------------------------------------------------------------------------
  let y = MARGIN;
  font(9, 'bold', BLUE);
  doc.text('TRAINERPRO', MARGIN, y + 3);
  // Sportart rechts mit kleinem Farbpunkt in der Sportfarbe.
  font(9, 'normal', MUTED);
  const sportLabel = pdfText(`Sportart: ${sport.name}`);
  const sportW = doc.getTextWidth(sportLabel);
  doc.text(sportLabel, PAGE_W - MARGIN, y + 3, { align: 'right' });
  const [r, g, b] = hexToRgb(sport.color);
  doc.setFillColor(r, g, b);
  doc.circle(PAGE_W - MARGIN - sportW - 3, y + 2, 1.4, 'F');
  y += 7;
  // Schmaler Streifen in der Sportfarbe – der einzige farbige Akzent des Dokuments.
  doc.setFillColor(r, g, b);
  doc.rect(MARGIN, y, CONTENT_W, 1.2, 'F');
  y += 9;

  font(22, 'bold');
  for (const line of wrap(plan.name, CONTENT_W)) {
    doc.text(line, MARGIN, y);
    y += lineHeight(22);
  }
  y += 1;

  // ---- Eckdaten --------------------------------------------------------------------------------------------------
  const labelW = 34;
  for (const [label, value] of planPdfFacts(input, today)) {
    font(9.5, 'bold', MUTED);
    doc.text(pdfText(label), MARGIN, y);
    font(9.5, 'normal', INK);
    const lines = wrap(value, CONTENT_W - labelW);
    lines.forEach((line, i) => doc.text(line, MARGIN + labelW, y + i * lineHeight(9.5)));
    y += lines.length * lineHeight(9.5) + 1.2;
  }

  if (plan.description.trim()) {
    y += 2;
    font(10, 'normal', MUTED);
    for (const line of wrap(plan.description, CONTENT_W)) {
      if (y > BOTTOM_LIMIT) {
        doc.addPage();
        y = MARGIN + 4;
      }
      doc.text(line, MARGIN, y);
      y += lineHeight(10);
    }
  }
  y += 5;

  // ---- Übungstabelle ---------------------------------------------------------------------------------------------
  // Spalten: Abhak-Kästchen · Nr. · Übung (mit Ziel, Beschreibung, Sätzen darunter) · Dauer · Niveau (nur mit C9).
  const colCheck = MARGIN;
  const colNr = MARGIN + 10;
  const colName = MARGIN + 20;
  const levelW = showDifficulty ? 28 : 0;
  const durW = 26;
  const colDur = PAGE_W - MARGIN - levelW - durW;
  const colLevel = PAGE_W - MARGIN - levelW;
  const nameW = colDur - colName - 4;

  const drawCheckIcon = (x: number, yy: number) => {
    doc.setDrawColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.setLineWidth(0.4);
    doc.line(x, yy, x + 1.2, yy + 1.2);
    doc.line(x + 1.2, yy + 1.2, x + 3.4, yy - 1.4);
  };
  const drawHeader = () => {
    doc.setFillColor(HEAD_BG[0], HEAD_BG[1], HEAD_BG[2]);
    doc.rect(MARGIN, y, CONTENT_W, 8, 'F');
    drawCheckIcon(colCheck + 1.6, y + 4.2);
    font(8.5, 'bold', MUTED);
    doc.text('Nr.', colNr, y + 5.3);
    doc.text('Übung', colName, y + 5.3);
    doc.text('Dauer', colDur, y + 5.3);
    if (showDifficulty) doc.text('Niveau', colLevel, y + 5.3);
    y += 8;
  };

  if (exercises.length === 0) {
    font(10, 'normal', MUTED);
    doc.text('Dieser Plan enthält noch keine Übungen.', MARGIN, y + 4);
  } else {
    drawHeader();
    exercises.forEach((exercise, index) => {
      // Zeilenhöhe vorab berechnen, damit keine Übung über einen Seitenumbruch zerrissen wird.
      font(10.5, 'bold');
      const nameLines = wrap(exercise.name, nameW);
      font(8.5);
      const details: { lines: string[]; style: 'normal' | 'bold' }[] = [];
      if (exercise.goal.trim()) details.push({ lines: wrap(`Ziel: ${exercise.goal}`, nameW), style: 'normal' });
      if (exercise.description.trim()) details.push({ lines: wrap(exercise.description, nameW), style: 'normal' });
      if (exercise.strength) {
        // „Sätze:“ nur, wenn die Zusammenfassung es nicht schon sagt („3 Sätze · …“ vs. „3 × 10 · 40 kg“).
        const summary = summarizeStrength(exercise.strength);
        details.push({ lines: wrap(summary.includes('Sätze') ? summary : `Sätze: ${summary}`, nameW), style: 'bold' });
      }
      const detailCount = details.reduce((n, d) => n + d.lines.length, 0);
      const rowH = 4 + nameLines.length * lineHeight(10.5) + detailCount * lineHeight(8.5) + (detailCount ? 1 : 0) + 2.5;

      if (y + rowH > BOTTOM_LIMIT) {
        doc.addPage();
        y = MARGIN;
        // Folgeseiten: Planname klein als Orientierung, dann wieder der Tabellenkopf.
        font(9, 'bold', MUTED);
        doc.text(`${wrap(plan.name, CONTENT_W - 30)[0]} (Fortsetzung)`, MARGIN, y + 3);
        y += 7;
        drawHeader();
      }
      const top = y;
      // Leeres Kästchen zum Abhaken mit dem Stift.
      doc.setDrawColor(LIGHT[0], LIGHT[1], LIGHT[2]);
      doc.setLineWidth(0.35);
      doc.roundedRect(colCheck + 1, top + 3, 4.2, 4.2, 0.8, 0.8, 'S');
      font(10, 'bold', MUTED);
      doc.text(`${index + 1}.`, colNr, top + 6.5);
      font(10.5, 'bold', INK);
      let ty = top + 6.5;
      nameLines.forEach((line) => {
        doc.text(line, colName, ty);
        ty += lineHeight(10.5);
      });
      ty += 0.5;
      for (const detail of details) {
        font(8.5, detail.style, MUTED);
        for (const line of detail.lines) {
          doc.text(line, colName, ty);
          ty += lineHeight(8.5);
        }
      }
      font(10, 'normal', INK);
      doc.text(pdfText(formatDuration(exercise.durationSeconds)), colDur, top + 6.5);
      if (showDifficulty) {
        font(9, 'normal', MUTED);
        doc.text(exercise.difficulty ? pdfText(exercise.difficulty) : '–', colLevel, top + 6.5);
      }
      y = top + rowH;
      doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    });

    // Summe unter der Tabelle.
    if (y + 10 > BOTTOM_LIMIT) {
      doc.addPage();
      y = MARGIN;
    }
    const total = exercises.reduce((sum, e) => sum + e.durationSeconds, 0);
    font(10, 'bold', INK);
    doc.text(pdfText(`Gesamt: ${formatDuration(total)}`), colDur + durW + levelW - 0.1, y + 7, { align: 'right' });
  }

  // ---- Fußzeile auf jeder Seite ----------------------------------------------------------------------------------
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, FOOTER_Y - 4, PAGE_W - MARGIN, FOOTER_Y - 4);
    font(8, 'normal', LIGHT);
    doc.text(pdfText(`Erstellt am ${formatDate(today)} mit TrainerPro`), MARGIN, FOOTER_Y);
    doc.text(`Seite ${page}/${pages}`, PAGE_W - MARGIN, FOOTER_Y, { align: 'right' });
  }
}
