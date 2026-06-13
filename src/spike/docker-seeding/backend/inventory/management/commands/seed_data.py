# seed_data.py
# Django Management Command für das automatische Befüllen der Datenbank
# mit Testdaten beim Start.
#
# Ablauf:
# 1. Alte Seed-Daten löschen (is_seed=True)
# 2. Echte Daten nie anfassen (is_seed=False bleiben immer erhalten)
# 3. Neue Seed-Daten einfügen (is_seed=True)
#
# Aufruf: python manage.py seed_data

from django.core.management.base import BaseCommand
from inventory.models import Gegenstand


class Command(BaseCommand):
    help = 'Befüllt die Datenbank mit initialen Testdaten'

    def handle(self, *args, **kwargs):

        # Schritt 1: Alte Seed-Daten löschen
        # Nur Gegenstände mit is_seed=True werden gelöscht
        # Echte Daten (is_seed=False) werden nie angefasst
        alte_seed_daten = Gegenstand.objects.filter(is_seed=True)
        anzahl_geloescht = alte_seed_daten.count()
        alte_seed_daten.delete()

        self.stdout.write(
            self.style.WARNING(
                f'{anzahl_geloescht} alte Seed-Daten gelöscht'
            )
        )

        # Schritt 2: Neue Seed-Daten definieren
        # Diese Testdaten sind für Entwicklung und Sprint Review
        testdaten = [
            {
                'name': 'Laptop-001',
                'kategorie': 'Elektronik',
                'standort': 'Raum 101',
                'status': 'verfügbar',
                'beschreibung': 'Dell Laptop 15 Zoll',
                'is_seed': True,
            },
            {
                'name': 'Laptop-002',
                'kategorie': 'Elektronik',
                'standort': 'Raum 101',
                'status': 'ausgeliehen',
                'beschreibung': 'MacBook Pro 14 Zoll',
                'is_seed': True,
            },
            {
                'name': 'Kamera-001',
                'kategorie': 'Elektronik',
                'standort': 'Raum 102',
                'status': 'verfügbar',
                'beschreibung': 'Canon DSLR Kamera',
                'is_seed': True,
            },
            {
                'name': 'Beamer-001',
                'kategorie': 'Präsentation',
                'standort': 'Raum 103',
                'status': 'ausgeliehen',
                'beschreibung': 'Epson Beamer HD',
                'is_seed': True,
            },
            {
                'name': 'Stativ-001',
                'kategorie': 'Zubehör',
                'standort': 'Raum 102',
                'status': 'verfügbar',
                'beschreibung': 'Kamera Stativ',
                'is_seed': True,
            },
        ]

        # Schritt 3: Neue Seed-Daten einfügen
        for daten in testdaten:
            Gegenstand.objects.create(**daten)
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ {daten['name']} ({daten['status']}) eingefügt"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n{len(testdaten)} Seed-Daten erfolgreich eingefügt!'
            )
        )

        # Echte Daten anzeigen die erhalten geblieben sind
        echte_daten = Gegenstand.objects.filter(is_seed=False)
        if echte_daten.exists():
            self.stdout.write(
                self.style.WARNING(
                    f'{echte_daten.count()} echte Daten wurden nicht angefasst ✅'
                )
            )
