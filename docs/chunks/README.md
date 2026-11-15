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
| C4 | Sekundengenaue Übungsdauer | ⏳ offen | – | – |
| C5 | Übungen und Pläne je Sportart getrennt speichern/anzeigen | ⏳ offen | – | – |
