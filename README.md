# TrainerPro

TrainerPro ist eine Web-App für Tischtennis-Trainer:innen im Vereins- und Freizeitsport, um
Trainingspläne und Übungen zu verwalten – von der Übungsdatenbank über die Planzusammenstellung
bis zur Trainingsdurchführung mit Timer.

## Bereiche

- **Onboarding & Konto** – 3-teilige Einführung vor dem ersten Login, danach Registrierung/Anmeldung
  (lokales Session-Gate ohne Backend) mit Konto-Verwaltung in den Einstellungen.
- **Trainingspläne** – Pläne als Kacheln, Suche, überfällige Pläne werden rot markiert, Anlegen/Bearbeiten
  mit Übungsauswahl aus dem Pool inkl. Reihenfolge per ↑/↓, Detailansicht mit Start-Timer pro Übung.
- **Übungen** – eigene Tischtennis-Übungsdatenbank (Name, Beschreibung, Ziel, Dauer, Schwierigkeitsgrad).
  Die Dauer ist sekundengenau einstellbar und wird in Uhrform angezeigt, z. B. „1:30 Min.“ (C4).
  Bei Tischtennis zusätzlich der Reiter **Aufschlagtraining** (Live-Tracking gut/schlecht mit Verlaufsdiagramm, C3).
- **Statistiken** – Kennzahlen, Schwierigkeitsgrad-Verteilung, Donut-Chart der meistgenutzten Übungen.
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
