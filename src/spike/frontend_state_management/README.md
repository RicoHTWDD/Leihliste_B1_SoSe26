# Spike: Frontend State Management

## Ziel des Spikes

Dieser Spike untersucht, ob die integrierte **React Context API** ausreicht, um zentrale Frontend-Zustände in der Anwendung **LeihListe** global zu verwalten.

Im Fokus stehen zwei fachliche Zustände:

* aktive Filter in der Gegenstandsübersicht, zum Beispiel Filter nach Verfügbarkeit
* Status von gestellten Ausleihanfragen, zum Beispiel offen, genehmigt oder abgelehnt

Die Fragestellung ist wichtig, weil Nutzerinnen und Nutzer zwischen verschiedenen Ansichten wechseln können. Wenn eine Person von der Übersicht in eine Detailansicht geht und danach zurückkehrt, sollen die Filter nicht sofort verloren gehen.

## Leitfrage

Reicht die integrierte React Context API aus, um die aktiven Filter sowie den Status der gestellten Ausleihanfragen global über verschiedene Ansichten hinweg im Frontend zu verwalten?

## Ergebnis

Für den aktuellen Projektumfang reicht die **React Context API** grundsätzlich aus.

Sie eignet sich, um während der laufenden Nutzung der Anwendung einfache globale Zustände zwischen mehreren Komponenten zu teilen. Deshalb ist aktuell keine zusätzliche State-Management-Bibliothek wie Redux oder Zustand notwendig.

Wichtig ist aber die Einschränkung:

Der Zustand in React Context liegt nur im Arbeitsspeicher der Anwendung. Wenn die Seite neu geladen wird oder die PWA geschlossen wird, geht dieser Zustand verloren.

Deshalb wird empfohlen:

* Filterzustände zusätzlich über `localStorage` oder URL-Parameter zu sichern
* fachlich wichtige Statusdaten, zum Beispiel Anfrage-Status, dauerhaft im Backend und in der Datenbank zu speichern

## Technische Umsetzung

Der Spike wurde als kleiner React/Vite-Prototyp umgesetzt.

Der Prototyp zeigt beispielhaft:

* zentrale Verwaltung von Filterzuständen über React Context
* zentrale Verwaltung von Anfrage-Status über React Context
* Nutzung des Contexts in mehreren Komponenten
* Änderung des globalen Zustands durch Benutzerinteraktion
* Anzeige der geänderten Werte in der Oberfläche

## Projektbezug

In LeihListe gibt es mehrere Ansichten, zum Beispiel:

* Übersicht der Gegenstände
* Detailansicht eines Gegenstands
* Ansicht für Ausleihanfragen
* mögliche spätere Nutzer- oder Verwaltungsansichten

Ohne gemeinsamen Zustand müssten Filter und Statusinformationen zwischen Komponenten umständlich über Props weitergegeben werden. React Context vermeidet dieses sogenannte Prop Drilling und macht den Zustand zentral verfügbar.

## Abgrenzung

Dieser Spike ist keine vollständige Implementierung für das Produktivsystem.

Nicht umgesetzt wurden:

* dauerhafte Speicherung im Backend
* echte API-Anbindung
* Authentifizierung
* vollständiges UI-Design
* vollständige PWA-Funktionalität

Der Spike dient nur dazu, die technische Entscheidung zum Frontend State Management zu prüfen.

## Starten des Prototyps

Voraussetzung:

* Node.js ist installiert
* npm ist installiert

Abhängigkeiten installieren:

```bash
npm install
```

Entwicklungsserver starten:

```bash
npm run dev
```

Danach kann der Prototyp im Browser geöffnet werden. Die genaue lokale Adresse wird im Terminal angezeigt, meistens zum Beispiel:

```bash
http://localhost:5173/
```

## Wichtige Dateien

Die wichtigsten Dateien des Spikes sind:

* `src/`
  enthält den React-Prototyp

* `README.md`
  erklärt Ziel, Ergebnis und Ausführung des Spikes

* zugehörige `.adoc`-Dokumentation
  beschreibt die Fragestellung, Durchführung, Beobachtungen und Entscheidung ausführlicher

## Entscheidung

Für LeihListe wird aktuell empfohlen:

* React Context API für einfache globale UI-Zustände verwenden
* keine zusätzliche Bibliothek wie Redux oder Zustand einführen
* Filter bei Bedarf zusätzlich in `localStorage` oder URL-Parametern speichern
* Anfrage-Status dauerhaft im Backend speichern

## Begründung

React Context ist für unseren aktuellen Umfang ausreichend, weil:

* die Zustände überschaubar sind
* keine komplexen globalen Datenflüsse vorhanden sind
* keine sehr große Anzahl voneinander abhängiger States verwaltet werden muss
* das Team dadurch keine zusätzliche Bibliothek lernen und pflegen muss

Eine größere State-Management-Bibliothek wäre erst sinnvoll, wenn die Anwendung später deutlich komplexer wird.

## Fazit

Der Spike zeigt, dass React Context API für das geplante Frontend State Management von LeihListe ausreicht.

Die wichtigste Erkenntnis ist:

React Context eignet sich gut für einfache globale Zustände während der laufenden Nutzung. Für dauerhaft wichtige Daten reicht Context allein aber nicht aus. Diese Daten müssen zusätzlich gespeichert werden, entweder lokal im Browser oder dauerhaft im Backend.
