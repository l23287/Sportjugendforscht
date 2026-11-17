# TrainerPro

TrainerPro ist eine Web-App für Tischtennis-Trainer:innen im Vereins- und Freizeitsport, um
Trainingspläne und Übungen zu verwalten – von der Übungsdatenbank über die Planzusammenstellung
bis zur Trainingsdurchführung mit Timer.

## Bereiche

- **Einführung & Zugang** – Zugangspasswort, danach eine Einführung in sechs Schritten mit Sportart-Auswahl; erneut
  aufrufbar in den Einstellungen (C10).
- **Trainingspläne** – Pläne als Kacheln, Suche, Pläne nach Heute / Ausstehend / Vergangen gegliedert, Anlegen/Bearbeiten
  mit Übungsauswahl aus dem Pool inkl. Reihenfolge per ↑/↓, Detailansicht mit Start-Timer pro Übung.
- **Übungen** – eigene Tischtennis-Übungsdatenbank (Name, Beschreibung, Ziel, Dauer, Schwierigkeitsgrad).
  Die Dauer ist sekundengenau einstellbar und wird in Uhrform angezeigt, z. B. „1:30 Min.“ (C4).
  Bei Tischtennis zusätzlich der Reiter **Aufschlagtraining** (Live-Tracking gut/schlecht mit Verlaufsdiagramm, C3).
- **Notizen** – während der Ausführung notieren (automatisch gespeichert), als Verlauf je Übung im Plandetail (C13).
- **Stoppuhr** – im Übungsbereich, auf Hundertstel genau, läuft bei Seitenwechsel weiter; bis zu 10 benannte Werte je
  Sportart mit Bestwert (C12).
- **Gym** – Sätze, Gewichte und Satzpausen je Übung; Ausführung Satz für Satz mit Gewicht ± 0,5 kg (C11a) und automatischer
  Satzpause (C11).
- **Kalender** – Monatsansicht der Pläne der aktiven Sportart; neuen Plan für einen Tag anlegen oder vorhandenen Plan
  auf einen Tag legen (C6). Pläne sind „Heute“, „Ausstehend“ oder „Vergangen“ (C6a). Pläne können eine Uhrzeit haben
  und sich wöchentlich (mit Wochentagen) oder monatlich wiederholen (C7); einzelne Termine lassen sich austragen (C7a).
- **Kernziele** – bis zu drei Ziele je Sportart (mit optionalem Zieldatum, abhakbar), festgelegt in den Einstellungen
  und angezeigt auf der Startseite (C8).
- **Trainer-Funktionen** – Zielgruppe und Schwierigkeitsgrad lassen sich in den Einstellungen ein- und ausschalten;
  gespeicherte Werte bleiben erhalten (C9); ein Hauptschalter schaltet alle gleichzeitig (C9a).
- **Statistiken** – Kennzahlen, Schwierigkeitsgrad-Verteilung, Donut-Chart der meistgenutzten Übungen; dazu
  Woche/Monat, Planerfüllung, persönliche Bestwerte (Stoppuhr, Gym-Gewichte), Kernziele und „Übungen lange nicht
  trainiert“ (C14).
- **Flammenstreak** – zählt Tage in Folge (C14a) mit mindestens einer beendeten oder neu erstellten Übung (über alle
  Sportarten), mit Aktivitäts-Kalender der letzten 12 Wochen und kleiner Flamme auf der Startseite (C14).
- **Sportarten** – Vorauswahl von 25 Sportarten (Basis: DOSB-Bestandserhebung 2025) plus eigene Sportarten,
  die in den Einstellungen hinzugefügt und gelöscht werden können (C1). Jede Sportart hat ein eigenes
  Symbol und eine Farbe für die Umrandung des Sporticons; bei eigenen Sportarten frei wählbar (C2).

Die Weiterentwicklung ist in Chunks dokumentiert, siehe [`docs/chunks/`](docs/chunks/README.md).

Pläne und Übungen werden je Sportart getrennt gespeichert und angezeigt (C5).
Die Daten werden lokal im Browser (`localStorage`) gespeichert.

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server
npm run build    # Typecheck + Produktionsbuild
npm run lint     # oxlint
```

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router v7, Icons von `lucide-react`.
