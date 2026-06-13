# Spike: Docker Compose Seed-Data

## Was ist das?

Proof-of-Concept für automatisches Befüllen der MariaDB mit Testdaten
beim Start via `docker compose up`.

## Leitfrage

Wie befüllen wir MariaDB automatisch mit Testdaten beim `docker compose up`
— ohne vorhandene Daten zu überschreiben?

## Lösung

Django Management Command `seed_data` mit `is_seed` Kennzeichen:

- `is_seed=True`  → Testdatum  → wird bei jedem Start gelöscht und neu eingefügt
- `is_seed=False` → Echtes Datum → wird nie angefasst

## Dateistruktur

```
spike_docker_seeding/
├── docker-compose.yml              ← Orchestrierung aller Container
└── backend/
    └── inventory/
        ├── models.py               ← Gegenstand Modell mit is_seed Feld
        └── management/
            ├── __init__.py
            └── commands/
                ├── __init__.py
                └── seed_data.py    ← Hauptdatei: Seed-Logic
```

## Starten

```bash
docker compose up
```

## Ablauf beim Start

1. MariaDB startet → leere Datenbank wird erstellt
2. Django Migrations laufen → Tabellen werden erstellt
3. Seed Command läuft → alte Testdaten löschen, neue einfügen
4. App läuft auf localhost:8000
