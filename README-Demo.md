# LeihListe — Branch `demo-integration`

> ⚠️ **Nur für die Prototyp-Demo.** Dieser Branch führt mehrere Feature-Branches zusammen und enthält lokale Workarounds. Nicht in `main` mergen und keinen PR daraus öffnen — die sauberen Änderungen kommen einzeln über die jeweiligen Feature-Branches mit Code Review.

Lokales End-to-End-Setup: Backend und Datenbank laufen über Docker Compose, das Frontend über den Vite-Dev-Server.

## Voraussetzungen

- Docker & Docker Compose
- Node.js ≥ 20.19 (z. B. via `nvm use 20`)

## Backend & Datenbank (Docker)

```bash
# Container starten (beim ersten Start oder nach Änderungen mit --build)
docker compose up -d --build

# Status der Container prüfen
docker compose ps

# Migrationen anwenden
docker compose exec backend python manage.py migrate

# Superuser für /admin anlegen (interaktiv)
docker compose exec backend python manage.py createsuperuser

# Demo-Daten einspielen (idempotent, mehrfach ausführbar)
docker compose exec backend python manage.py seed_data
```

## Superuser & `Nutzer`

Im Backend sind **Login-Account** (für `/admin`) und das Domänenmodell **`Nutzer`** zwei verschiedene Modelle. `createsuperuser` legt nur den Login-Account an — **keinen `Nutzer`**. Die API (z. B. „Meine Anfragen") filtert nach dem eingeloggten Benutzer und setzt voraus, dass dieser einem `Nutzer` entspricht (Abgleich über die ID).

Auf einer **frischen Datenbank** passt das in der Regel automatisch: der erste Superuser (Login-ID 1) und der von `seed_data` angelegte `Nutzer` (ID 1) stimmen überein.

Falls „Meine Anfragen" trotz vorhandener Daten leer bleibt oder einen Fehler liefert, passen Login-Account und `Nutzer` nicht zusammen → im `/admin` einen `Nutzer` als ersten Datensatz anlegen, sodass ID 1 ↔ ID 1.

## Frontend (Vite-Dev-Server)

Das Backend sollte laufen, bevor das Frontend gestartet wird (Vite leitet `/api` an `:8000` weiter).

```bash
cd src/frontend/src
nvm use 20        # Node ≥ 20.19 für Vite
npm install
npm run dev
```

## URLs

- Frontend: http://localhost:5173
- Backend / API: http://localhost:8000
- Django-Admin: http://localhost:8000/admin

---
