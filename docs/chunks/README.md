# Entwicklungs-Chunks – Übersicht

Jede Weiterentwicklung von TrainerPro ist in **Chunks** eingeteilt. Für jeden Chunk gilt:

- **Code-Kommentare:** Jede Änderung im Code ist mit `C<n>:` markiert (z. B. `// C1: …` bzw. `{/* C1: … */}` in JSX).
  Suche nach allen Änderungen eines Chunks: `grep -rn "C1:" src`
- **Zusammenfassung:** Pro Chunk eine Datei `docs/chunks/C<n>.md` (Ziel, Änderungen, Dateien, Tests).
- **Nachbesserungen** zu einem Chunk bekommen einen Buchstaben (z. B. `C2a`) und eine eigene Doku-Datei.
- **Git:** Pro Chunk ein Commit mit der Nachricht `C<n>: <Kurzbeschreibung>`.
- **Branch:** Entwicklungsphase 1 („Flowstate A“) läuft auf dem Branch `phase-1`; `main` bleibt stabil.

## Flowstate A (Phase 1)

| Chunk | Inhalt | Status | Datum | Doku |
|-------|--------|--------|-------|------|
| C1 | Eigene Sportarten hinzufügen (+ Vorauswahl von 25 Sportarten) | ✅ umgesetzt | 15.11.2026 | [C1.md](C1.md) |
| C2 | Symbole und Farben an die Sportart anpassen (inkl. Auswahl für eigene Sportarten) | ✅ umgesetzt | 15.11.2026 | [C2.md](C2.md) |
| C2a | Nachbesserung: Sporticon auch am Desktop oben rechts statt unter dem Logo | ✅ umgesetzt | 15.11.2026 | [C2a.md](C2a.md) |
| C2b | Nachbesserung: farbige Umrandung um die gesamte Sportart-Anzeige statt nur um das Icon | ✅ umgesetzt | 15.11.2026 | [C2b.md](C2b.md) |
| C2c | Nachbesserung: Umrandung des ganzen Elements auch im Sportart-Auswahlbereich (Einstellungen) | ✅ umgesetzt | 15.11.2026 | [C2c.md](C2c.md) |
| C3 | Aufschlagtraining nur noch für Tischtennis (als Reiter im Übungsbereich) | ✅ umgesetzt | 15.11.2026 | [C3.md](C3.md) |
| C4 | Sekundengenaue Übungsdauer (Uhrform, max. 3 Std.) | ✅ umgesetzt | 15.11.2026 | [C4.md](C4.md) |
| C5 | Übungen und Pläne je Sportart getrennt speichern/anzeigen | ✅ umgesetzt | 15.11.2026 | [C5.md](C5.md) |

**Flowstate A ist abgeschlossen.** Alle fünf Chunks (plus die Nachbesserungen C2a–C2c) sind auf `phase-1` umgesetzt.

## Flowstate B (Phase 2)

Läuft auf demselben Branch `phase-1` weiter und wird in diesem Ordner dokumentiert (Abstimmung im Team).

| Chunk | Inhalt | Status | Datum | Doku |
|-------|--------|--------|-------|------|
| C6 | Kalendertool mit Monatsansicht im Menü | ✅ umgesetzt | 16.11.2026 | [C6.md](C6.md) |
| C6a | Nachbesserung: Status „Heute / Ausstehend / Vergangen“ statt „Überfällig“, Kalender nach „Übungen“, Tage ohne Rahmen | ✅ umgesetzt | 16.11.2026 | [C6a.md](C6a.md) |
| C7 | Wiederkehrende Trainings: Uhrzeit und Wiederholungen (wöchentlich/monatlich) für Pläne, im Kalender sichtbar | ✅ umgesetzt | 16.11.2026 | [C7.md](C7.md) |
| C8 | Zielsetzungstool: bis zu drei Kernziele auf der Hauptseite, Einstellung in den Einstellungen | ⏳ offen | – | – |
| C9 | Trainer-Funktionen (Zielgruppe, Schwierigkeitsgrad) in den Einstellungen ein-/ausschaltbar | ⏳ offen | – | – |
| C10 | Einführung in die App beim ersten Öffnen (mit Claude Design) | ⏳ offen | – | – |

### Für später vorgemerkt

- Einzelne Termine einer Serie auslassen (z. B. Ferien) – aus C7 verschoben (Abstimmung im Team).
