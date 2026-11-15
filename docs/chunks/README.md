# Entwicklungs-Chunks – Übersicht

Jede Weiterentwicklung von TrainerPro ist in **Chunks** eingeteilt. Für jeden Chunk gilt:

- **Code-Kommentare:** Jede Änderung im Code ist mit `C<n>:` markiert (z. B. `// C1: …` bzw. `{/* C1: … */}` in JSX).
  Suche nach allen Änderungen eines Chunks: `grep -rn "C1:" src`
- **Zusammenfassung:** Pro Chunk eine Datei `docs/chunks/C<n>.md` (Ziel, Änderungen, Dateien, Tests).
- **Git:** Pro Chunk ein Commit mit der Nachricht `C<n>: <Kurzbeschreibung>`.
- **Branch:** Entwicklungsphase 1 („Flowstate A“) läuft auf dem Branch `phase-1`; `main` bleibt stabil.

## Flowstate A (Phase 1)

| Chunk | Inhalt | Status | Datum | Doku |
|-------|--------|--------|-------|------|
| C1 | Eigene Sportarten hinzufügen (+ Vorauswahl von 25 Sportarten) | ✅ umgesetzt | 15.11.2026 | [C1.md](C1.md) |
| C2 | Symbole und Farben an die Sportart anpassen (inkl. Auswahl für eigene Sportarten) | ✅ umgesetzt | 15.11.2026 | [C2.md](C2.md) |
| C3 | Aufschlagtraining nur noch für Tischtennis (in Übungsbereich verlegt) | ⏳ offen | – | – |
| C4 | Sekundengenaue Übungsdauer | ⏳ offen | – | – |
| C5 | Übungen und Pläne je Sportart getrennt speichern/anzeigen | ⏳ offen | – | – |
