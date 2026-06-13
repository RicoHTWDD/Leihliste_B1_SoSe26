# models.py
# Definiert die Datenbankstruktur für Gegenstände.
# Das Feld is_seed kennzeichnet ob ein Gegenstand ein Testdatum ist
# oder ein echter Eintrag von einem Nutzer.

from django.db import models


class Gegenstand(models.Model):

    # Name des Gegenstands z.B. "Laptop-001"
    name = models.CharField(max_length=255)

    # Kategorie z.B. "Elektronik", "Präsentation"
    kategorie = models.CharField(max_length=255)

    # Standort z.B. "Raum 101"
    standort = models.CharField(max_length=255)

    # Status des Gegenstands
    # Mögliche Werte: "verfügbar", "ausgeliehen"
    status = models.CharField(max_length=50, default='verfügbar')

    # Beschreibung des Gegenstands
    beschreibung = models.TextField(blank=True, default='')

    # Kennzeichen ob es ein Testdatum ist
    # True  → Testdatum  → darf gelöscht und ersetzt werden
    # False → Echtes Datum → wird nie angefasst
    is_seed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.status})"
