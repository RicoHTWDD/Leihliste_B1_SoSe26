# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Kategorien und Standorte mit Testdaten prüfen (#47)

Im Verzeichnis `src/frontend` zwei Terminals öffnen. Im ersten die lokale Demo-API starten:

```bash
node demo/referenzdaten-api.mjs
```

Im zweiten Terminal Vite mit dieser API verbinden:

```bash
API_PROXY_TARGET=http://127.0.0.1:8047 VITE_INVENTAR_RECHTE_URL=/api/demo/rechte/ npm run dev
```

Unter **Kategorien verwalten** einen neuen Eintrag anlegen. Seine Detailansicht bietet **Löschen** an. Die Kategorie **Veranstaltungstechnik** ist dem Typ **Beamer** zugeordnet. Bei ihr ist **Archivieren** möglich. Beim Standort **Medienraum** besteht eine Zuordnung zum Exemplar **DEMO-001**. Beim Archivieren bleiben diese Zuordnungen erhalten. Archivierte Einträge verschwinden aus den Listen für neue Zuordnungen.

Die Daten liegen im Speicher des Demo-Prozesses. Mit `--ausleiher` startet die Demo ohne Verwaltungsrechte. Mit `--import VERZEICHNIS` kann sie die beiden Listen aus der bisherigen Demo übernehmen. Sie erwartet dort `kategorien.json` und `standorte.json`, jeweils mit der JSON-Antwort der alten Listen-API.

**API-Vorschlag für die Backend-Abstimmung.** Die Detailantwort nennt die zulässige Aktion im Feld `entfernungsaktion`. Bei `loeschen` sendet die Oberfläche nach Bestätigung `DELETE` an die Detail-URL. Bei `archivieren` sendet sie `POST` an `<Detail-URL>archivieren/`. Bei fehlender Aktion wird keine Schaltfläche zum Entfernen angeboten. Die API prüft Rolle und bestehende Zuordnungen beim Ausführen erneut.
