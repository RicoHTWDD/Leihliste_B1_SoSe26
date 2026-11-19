# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Eingegangene Ausleihanfragen lokal testen (#24)

Im Verzeichnis `src/frontend` die Abhängigkeiten installieren und die Demo starten:

```bash
npm ci
VITE_ANFRAGEN_DEMO=true npm run dev -- --port 5175
```

Die Demo enthält 21 fiktive Anfragen. Als Verleiher kann man die Liste über
„Eingegangene Anfragen“ in der Navigation oder über die Kachel „Offene Anfragen“
auf der Startseite öffnen. Entscheidungen bleiben beim Neuladen im selben Tab erhalten.

Für die Ansicht als Ausleiher den laufenden Server mit Strg+C beenden und neu starten:

```bash
VITE_ANFRAGEN_DEMO=true VITE_ANFRAGEN_DEMOROLLE=ausleiher npm run dev -- --port 5175
```

In dieser Rolle sind der Menüeintrag und die Dashboard-Kachel ausgeblendet.