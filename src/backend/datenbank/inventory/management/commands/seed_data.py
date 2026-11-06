"""
Management Command: python manage.py seed_data

Befüllt die Datenbank mit Testdaten (Seed-Daten).
Ablauf laut Seed-Konzept (Ansatz 3):
  1. Alte Testdaten löschen:  filter(is_seed=True).delete()
  2. Echte Daten (is_seed=False) werden nie angefasst
  3. Neue Testdaten einfügen, alle mit is_seed=True markiert

Wird bei jedem `docker compose up` automatisch ausgeführt (siehe docker-compose.yml).
Hinweis: Die Übersicht im Frontend lädt nur die erste Seite (PAGE_SIZE = 20),
deshalb bleiben es bewusst unter 20 Exemplare.
"""
from datetime import date, timedelta

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction

from inventory.models import (
    Gegenstandsexemplar,
    Gegenstandstyp,
    Kategorie,
    Standort,
    Verfuegbarkeitsstatus,
    Zustand,
)
from lending.models import Anfragestatus, Ausleihanfrage
from organisations.models import Organisation, OrganisationsTyp
from users.models import BenutzerRolle, Kontostatus, Nutzer

# (Name, Kategorie, Standort, max. Ausleihzeit in Tagen, Beschreibung,
#  Liste der Exemplare als (Zustand, Verfügbarkeitsstatus))
GEGENSTAENDE = [
    ("Mikroskop Leica DM500", "Laborgeräte", "Labor S 312", 7,
     "Lichtmikroskop für Praktika in der Biologie.",
     [(Zustand.GUT, Verfuegbarkeitsstatus.VERFUEGBAR),
      (Zustand.GUT, Verfuegbarkeitsstatus.VERFUEGBAR),
      (Zustand.DEFEKT, Verfuegbarkeitsstatus.NICHT_VERFUEGBAR)]),
    ("Laptop Lenovo ThinkPad T14", "Elektronik", "Bibliothek Z-Gebäude", 14,
     "Leihlaptop mit Windows 11 und Office.",
     [(Zustand.NEU, Verfuegbarkeitsstatus.VERFUEGBAR),
      (Zustand.GUT, Verfuegbarkeitsstatus.VERFUEGBAR),
      (Zustand.BESCHAEDIGT, Verfuegbarkeitsstatus.VERFUEGBAR)]),
    ("Beamer Epson EB-W51", "Medientechnik", "Medienzentrum", 3,
     "Mobiler Projektor inkl. HDMI-Kabel.",
     [(Zustand.GUT, Verfuegbarkeitsstatus.VERFUEGBAR),
      (Zustand.GUT, Verfuegbarkeitsstatus.NICHT_VERFUEGBAR)]),
    ("Kamera Canon EOS 250D", "Medientechnik", "Medienzentrum", 7,
     "Spiegelreflexkamera mit 18-55-mm-Objektiv.",
     [(Zustand.GUT, Verfuegbarkeitsstatus.VERFUEGBAR),
      (Zustand.VERLOREN, Verfuegbarkeitsstatus.NICHT_VERFUEGBAR)]),
    ("Arduino Starter Kit", "Elektronik", "Labor S 312", 21,
     "Mikrocontroller-Set mit Sensoren und Steckbrett.",
     [(Zustand.NEU, Verfuegbarkeitsstatus.VERFUEGBAR),
      (Zustand.NEU, Verfuegbarkeitsstatus.VERFUEGBAR)]),
    ("Akkuschrauber Bosch GSR 12V", "Werkzeug", "Werkstatt", 5,
     "Inkl. Bit-Set und zwei Akkus.",
     [(Zustand.GUT, Verfuegbarkeitsstatus.VERFUEGBAR),
      (Zustand.BESCHAEDIGT, Verfuegbarkeitsstatus.VERFUEGBAR)]),
    ("Grafiktablett Wacom Intuos", "Elektronik", "Bibliothek Z-Gebäude", 14,
     "Zeichentablett für Design- und Medienprojekte.",
     [(Zustand.GUT, Verfuegbarkeitsstatus.VERFUEGBAR)]),
    ("Volleyball-Set", "Sport & Freizeit", "Werkstatt", 3,
     "Netz, zwei Bälle und Pumpe.",
     [(Zustand.GUT, Verfuegbarkeitsstatus.VERFUEGBAR)]),
]

KATEGORIEN = {
    "Elektronik": "Laptops, Tablets, Mikrocontroller",
    "Laborgeräte": "Geräte für Laborpraktika",
    "Medientechnik": "Kameras, Beamer, Audio",
    "Werkzeug": "Handwerkzeug und Elektrowerkzeug",
    "Sport & Freizeit": "Ausrüstung für Hochschulsport",
}

STANDORTE = {
    "Bibliothek Z-Gebäude": "Ausleihtheke im Erdgeschoss",
    "Labor S 312": "Biologie-/Elektroniklabor, 3. Etage",
    "Medienzentrum": "Raum Z 105",
    "Werkstatt": "Kellergeschoss, Raum S 010",
}


class Command(BaseCommand):
    help = "Löscht alte Testdaten (is_seed=True) und legt neue Testdaten an."

    @transaction.atomic
    def handle(self, *args, **options):
        self.alte_testdaten_loeschen()

        organisation = Organisation.objects.create(
            name="HTW Dresden",
            organisationstyp=OrganisationsTyp.HOCHSCHULE,
            is_seed=True,
        )

        verleiher = Nutzer.objects.create(
            organisation=organisation,
            vollstaendiger_name="Vera Verleiher",
            email="verleiher@seed.leihliste.de",
            passwort_hash=make_password("Test123!"),
            benutzerrolle=BenutzerRolle.VERLEIHER,
            kontostatus=Kontostatus.AKTIV,
            is_seed=True,
        )
        nina = Nutzer.objects.create(
            organisation=organisation,
            vollstaendiger_name="Nina Neumann",
            email="nina@seed.leihliste.de",
            passwort_hash=make_password("Test123!"),
            benutzerrolle=BenutzerRolle.AUSLEIHER,
            kontostatus=Kontostatus.AKTIV,
            is_seed=True,
        )

        kategorien = {
            name: Kategorie.objects.create(name=name, beschreibung=beschr, is_seed=True)
            for name, beschr in KATEGORIEN.items()
        }
        standorte = {
            name: Standort.objects.create(
                organisation=organisation, name=name, beschreibung=beschr, is_seed=True
            )
            for name, beschr in STANDORTE.items()
        }

        typen = []
        nummer = 1
        for name, kategorie, standort, max_tage, beschr, exemplare in GEGENSTAENDE:
            typ = Gegenstandstyp.objects.create(
                organisation=organisation,
                kategorie=kategorien[kategorie],
                standort=standorte[standort],
                name=name,
                beschreibung=beschr,
                maximale_ausleihzeit=max_tage,
                is_seed=True,
            )
            typen.append(typ)
            for zustand, status in exemplare:
                Gegenstandsexemplar.objects.create(
                    gegenstand=typ,
                    inventarnummer=f"SEED-{nummer:04d}",
                    zustand=zustand,
                    verfuegbarkeitsstatus=status,
                    is_seed=True,
                )
                nummer += 1

        heute = date.today()
        anfragen = [
            (typen[0], 2, 5, Anfragestatus.EINGEREICHT, None),
            (typen[1], 1, 10, Anfragestatus.GENEHMIGT, None),
            (typen[2], 3, 4, Anfragestatus.ABGELEHNT, "Beamer ist in diesem Zeitraum für eine Prüfung reserviert."),
        ]
        for typ, start, ende, status, grund in anfragen:
            Ausleihanfrage.objects.create(
                nutzer=nina,
                gegenstand=typ,
                organisation=organisation,
                startdatum=heute + timedelta(days=start),
                enddatum=heute + timedelta(days=ende),
                anfragestatus=status,
                ablehnungsgrund=grund,
                bedingungen_akzeptiert=True,
                is_seed=True,
            )

        self.stdout.write(self.style.SUCCESS(
            f"Seed-Daten angelegt: 1 Organisation, 2 Nutzer ({verleiher.email}, {nina.email}), "
            f"{len(kategorien)} Kategorien, {len(standorte)} Standorte, {len(typen)} Gegenstandstypen, "
            f"{nummer - 1} Exemplare, {len(anfragen)} Ausleihanfragen."
        ))

    def alte_testdaten_loeschen(self):
        # Reihenfolge: zuerst abhängige Tabellen, dann die, auf die verwiesen wird
        for modell in (
            Ausleihanfrage,
            Gegenstandsexemplar,
            Gegenstandstyp,
            Standort,
            Kategorie,
            Nutzer,
            Organisation,
        ):
            modell.objects.filter(is_seed=True).delete()
