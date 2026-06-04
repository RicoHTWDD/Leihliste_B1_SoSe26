# LeihListe Walking Skeleton: Frontend ↔ Backend ↔ Persistenz

Dieses Walking Skeleton zeigt, dass das React-Frontend mit dem Django-Backend kommunizieren kann und Daten über die Persistenzschicht dauerhaft gespeichert werden.

## Enthaltene Funktionen

- Django-Backend mit REST-API
- Inventar-Gegenstände können über `/api/items/` geladen werden
- React-Frontend zeigt die Gegenstände an
- Button "Ausleihe anfragen" sendet einen POST-Request ans Backend
- Backend ändert den Status eines Gegenstands von `available` zu `requested`
- Frontend aktualisiert die Anzeige nach erfolgreicher Anfrage
- Frontend zeigt einen Fehler an, wenn das Backend nicht erreichbar ist
- Persistenz-App ist in das Django-Backend integriert
- Notizen können über `/api/persistence/notes/` gespeichert und geladen werden
- React-Frontend zeigt gespeicherte Notizen an
- Gespeicherte Notizen bleiben nach einem Backend-Neustart erhalten
- Beim Speichern von Notizen wird zusätzlich eine lokale JSON-Exportdatei unter `backend/data/notes.json` erzeugt

## Technischer Nachweis

Der Walking Skeleton weist nach:

```txt
React-Frontend → HTTP/fetch → Django REST API → Inventory-App / Persistence-App → SQLite-Datenbank → Antwort zurück ans Frontend
```

Damit ist der vertikale Durchstich zwischen Frontend, Backend und Persistenzschicht validiert.

## Projektstruktur

```txt
Backend_Frontend/
├── backend/
│   ├── inventory/
│   ├── persistence/
│   ├── leihliste_api/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Voraussetzungen

Für die lokale Ausführung müssen auf dem Rechner installiert sein:

- Python 3, damit die virtuelle Backend-Umgebung erstellt werden kann
- python3-venv, damit `.venv` erstellt werden kann
- pip, damit die Python-Abhängigkeiten installiert werden können
- Node.js inklusive npm, damit das React/Vite-Frontend installiert und gestartet werden kann
- Git, um das Repository zu klonen
- VS Code oder ein anderer Editor

Prüfen kann man das im Terminal mit:

```bash
python3 --version
node --version
npm --version
git --version
```

Falls Python, venv, pip oder Git fehlen:

```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip git
```

Falls Node.js und npm fehlen:

```bash
sudo apt install nodejs npm
```

Django, Django REST Framework und weitere Python-Pakete müssen nicht global installiert werden. Sie werden lokal in der virtuellen Umgebung `.venv` installiert.

React/Vite-Abhängigkeiten müssen ebenfalls nicht global installiert werden. Sie werden lokal im Frontend-Ordner über `npm install` installiert.

Hinweis: Falls `npm install` oder `npm run dev` wegen einer zu alten Node.js-Version fehlschlägt, muss eine aktuellere Node.js-Version installiert werden.

## Hinweis zur Nutzung

Die Terminals können am besten direkt in VS Code oder über die normale Ubuntu-Terminal-App geöffnet werden.

Laufende Prozesse können im Terminal mit folgender Tastenkombination beendet werden:

```txt
Strg + C
```

Wichtig: Linux unterscheidet zwischen Groß- und Kleinschreibung. Deshalb müssen Ordnernamen exakt so geschrieben werden, wie sie im Repository stehen.

Beispiel:

```txt
backend
```

ist unter Linux nicht dasselbe wie:

```txt
Backend
```

## Nach dem Klonen des Repositories

Nach dem Klonen muss zuerst in den Walking-Skeleton-Ordner gewechselt werden:

```bash
cd src/Walking_Skeleton/Backend_Frontend
```

Alle folgenden Befehle gehen davon aus, dass man sich in diesem Ordner befindet.

## Backend einmalig einrichten

Im ersten Terminal:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
```

Falls `python3 -m venv .venv` nicht funktioniert, fehlt wahrscheinlich `python3-venv`.

Dann installieren:

```bash
sudo apt install python3-venv
```

Danach erneut ausführen:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
```

Falls `pip` nicht direkt erkannt wird, stattdessen immer diese Variante verwenden:

```bash
python -m pip install -r requirements.txt
```

## Backend starten

Im ersten Terminal im Ordner `backend`:

```bash
source .venv/bin/activate
python manage.py runserver
```

Falls die virtuelle Umgebung noch nicht aktiv ist, erkennt man das daran, dass vorne im Terminal nicht `(.venv)` steht.

Wenn alles funktioniert, läuft das Backend unter:

```txt
http://127.0.0.1:8000
```

Hinweis: Die Startseite `http://127.0.0.1:8000/` ist nicht belegt und kann deshalb eine 404-Seite anzeigen. Das ist normal.

## Backend-Endpunkte

Inventar-API:

```txt
http://127.0.0.1:8000/api/items/
```

Persistenz-API:

```txt
http://127.0.0.1:8000/api/persistence/notes/
```

Admin-Bereich:

```txt
http://127.0.0.1:8000/admin/
```

## Admin-Account lokal erstellen

Der Admin-Account wird im Backend-Terminal erstellt.

Wichtig: Wenn der Backend-Server in diesem Terminal gerade läuft, muss er zuerst beendet werden:

```txt
Strg + C
```

Danach muss man weiterhin im Ordner `backend` sein. Die virtuelle Umgebung sollte aktiv sein. Das erkennt man daran, dass vorne im Terminal `(.venv)` steht.

Falls die virtuelle Umgebung nicht aktiv ist:

```bash
source .venv/bin/activate
```

Dann den Admin-Account erstellen:

```bash
python manage.py createsuperuser
```

Die Zugangsdaten werden lokal selbst vergeben und nicht im Repository dokumentiert.

Wichtig: Keine Passwörter, `.env`-Dateien oder lokale Datenbanken ins Repository hochladen.

Nach dem Erstellen des Admin-Accounts kann der Backend-Server wieder gestartet werden:

```bash
python manage.py runserver
```

## Testdaten für Inventar anlegen

Da die lokale Datenbank `db.sqlite3` nicht im Repository gespeichert wird, müssen nach dem ersten Setup Testdaten angelegt werden.

1. Backend starten, falls er nach dem Erstellen des Admin-Accounts noch nicht wieder läuft.
2. Admin-Bereich öffnen:

```txt
http://127.0.0.1:8000/admin/
```

3. Mit dem lokalen Admin-Account einloggen.
4. Unter `Items` zwei Test-Gegenstände anlegen, zum Beispiel:

```txt
Name: Beamer Epson
Category: Technik
Location: Raum A101
Status: available
```

```txt
Name: Kamera Sony
Category: Medien
Location: Labor 2
Status: available
```

## Frontend einmalig einrichten

In einem zweiten Terminal wieder in den Walking-Skeleton-Ordner wechseln:

```bash
cd src/Walking_Skeleton/Backend_Frontend
```

Dann in den Frontend-Ordner wechseln und Abhängigkeiten installieren:

```bash
cd frontend
npm install
```

Falls `npm install` wegen Berechtigungen fehlschlägt, nicht direkt mit `sudo npm install` arbeiten.

Erst prüfen, ob man im richtigen Ordner ist:

```bash
pwd
```

Dann prüfen, ob Node.js und npm verfügbar sind:

```bash
node --version
npm --version
```

## Frontend starten

Im zweiten Terminal im Ordner `frontend`:

```bash
npm run dev
```

Wenn alles funktioniert, läuft das Frontend unter:

```txt
http://localhost:5173
```

## Testablauf: Frontend ↔ Backend

1. Backend starten.
2. Frontend starten.
3. Im Browser öffnen:

```txt
http://localhost:5173
```

4. Inventar-Gegenstände werden geladen.
5. Auf "Ausleihe anfragen" klicken.
6. Der Status ändert sich von `available` zu `requested`.
7. Die Änderung wurde über das Backend verarbeitet.

## Testablauf: Persistenz

1. Backend starten.
2. Frontend starten.
3. Im Browser öffnen:

```txt
http://localhost:5173
```

4. Im Bereich "Persistenz-Nachweis" eine Notiz eingeben.
5. Auf "Notiz speichern" klicken.
6. Die Notiz erscheint im Frontend.
7. Zusätzlich wird lokal die Datei `backend/data/notes.json` erzeugt oder aktualisiert.
8. Backend mit `Strg + C` stoppen.
9. Backend erneut starten:

```bash
python manage.py runserver
```

10. Browser neu laden.
11. Die Notiz ist weiterhin sichtbar.

Damit ist gezeigt, dass Daten über die Persistenzschicht dauerhaft in der lokalen SQLite-Datenbank gespeichert werden.

## Lokale Datenbank

Die lokale SQLite-Datenbank wird durch diesen Befehl erzeugt:

```bash
python manage.py migrate
```

Die Datei liegt danach lokal unter:

```txt
backend/db.sqlite3
```

Diese Datei wird nicht ins Repository hochgeladen, weil sie lokale Testdaten, Admin-Accounts und andere lokale Entwicklungsdaten enthalten kann.

## Lokaler JSON-Export der Persistenzdaten

Beim Speichern einer Notiz wird zusätzlich eine lokale JSON-Datei erzeugt oder aktualisiert:

```txt
backend/data/notes.json
```

Diese Datei dient nur als lokaler Exportnachweis und wird nicht ins Repository hochgeladen.

## Wichtige Dateien, die nicht ins Repository gehören

Folgende Dateien und Ordner dürfen nicht hochgeladen werden:

```txt
.venv/
backend/.venv/
frontend/node_modules/
backend/db.sqlite3
.env
frontend/.env
__pycache__/
backend/data/
```

Diese Dateien werden über `.gitignore` ausgeschlossen.

## Zusammenfassung

Dieses kombinierte Walking Skeleton zeigt:

- React-Frontend läuft lokal im Browser
- Django-Backend stellt REST-Endpunkte bereit
- Inventardaten werden vom Backend geladen
- Ausleihanfragen verändern Daten im Backend
- Persistenz-App ist integriert
- Notizen werden gespeichert und nach einem Backend-Neustart wieder geladen
- Beim Speichern von Notizen wird zusätzlich eine lokale JSON-Exportdatei erzeugt
- Frontend, Backend und Persistenzschicht arbeiten zusammen