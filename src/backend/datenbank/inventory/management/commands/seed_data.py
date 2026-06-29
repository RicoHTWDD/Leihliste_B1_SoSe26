from django.core.management.base import BaseCommand

from organisations.models import Organisation, OrganisationsTyp
from inventory.models import (
    Kategorie,
    Standort,
    Gegenstandstyp,
    Gegenstandsexemplar,
    Zustand,
    Verfuegbarkeitsstatus,
)


class Command(BaseCommand):
    help = "Befüllt die Datenbank mit Testdaten (Kategorien, Typen, Exemplare)."

    def handle(self, *args, **options):
        # -------------------------------------------------------------------
        # Organisation
        # Gegenstandstyp und Standort brauchen ZWINGEND eine Organisation.
        # get_or_create: vorhandene "HTW Dresden" wird wiederverwendet,
        # andernfalls neu angelegt -> Seed funktioniert auch auf leerer DB.
        # -------------------------------------------------------------------
        organisation, _ = Organisation.objects.get_or_create(
            name="HTW Dresden",
            defaults={
                "organisationstyp": OrganisationsTyp.HOCHSCHULE,
                "is_seed": True,
            },
        )

        # -------------------------------------------------------------------
        # Kategorien (get_or_create -> idempotent, keine Duplikate bei erneutem Lauf)
        # -------------------------------------------------------------------
        werkzeug, _ = Kategorie.objects.get_or_create(
            name="Werkzeug",
            defaults={"is_seed": True},
        )
        elektronik, _ = Kategorie.objects.get_or_create(
            name="Elektronik",
            defaults={"is_seed": True},
        )

        # -------------------------------------------------------------------
        # Standort (optional am Typ, aber für realistische Daten sinnvoll)
        # -------------------------------------------------------------------
        standort, _ = Standort.objects.get_or_create(
            name="Labor 2",
            organisation=organisation,
            defaults={"is_seed": True},
        )

        # -------------------------------------------------------------------
        # Gegenstandstypen
        # maximale_ausleihzeit ist ein Pflichtfeld (Tage).
        # -------------------------------------------------------------------
        typen_def = [
            ("Mikroskop", werkzeug, 14),
            ("Bohrmaschine", werkzeug, 7),
            ("Teleskop", elektronik, 30),
            ("Beamer", elektronik, 7),
        ]
        typen = {}
        for name, kategorie, max_zeit in typen_def:
            typ, _ = Gegenstandstyp.objects.get_or_create(
                name=name,
                organisation=organisation,
                defaults={
                    "kategorie": kategorie,
                    "standort": standort,
                    "maximale_ausleihzeit": max_zeit,
                    "is_seed": True,
                },
            )
            typen[name] = typ

        # -------------------------------------------------------------------
        # Gegenstandsexemplare
        # WICHTIG: das FK-Feld heißt im Modell "gegenstand" (nicht "gegenstandstyp").
        # Inventarnummern ab INV-101, um nicht mit bereits manuell angelegten
        # Exemplaren (INV-001/INV-002) zu kollidieren.
        # -------------------------------------------------------------------
        exemplare_def = [
            ("INV-101", "Mikroskop", Zustand.GUT, Verfuegbarkeitsstatus.VERFUEGBAR),
            ("INV-102", "Mikroskop", Zustand.GUT, Verfuegbarkeitsstatus.NICHT_VERFUEGBAR),
            ("INV-201", "Bohrmaschine", Zustand.NEU, Verfuegbarkeitsstatus.VERFUEGBAR),
            ("INV-202", "Bohrmaschine", Zustand.BESCHAEDIGT, Verfuegbarkeitsstatus.NICHT_VERFUEGBAR),
            ("INV-301", "Teleskop", Zustand.GUT, Verfuegbarkeitsstatus.VERFUEGBAR),
            ("INV-401", "Beamer", Zustand.GUT, Verfuegbarkeitsstatus.VERFUEGBAR),
        ]
        neu_angelegt = 0
        for inventarnummer, typ_name, zustand, status in exemplare_def:
            _, created = Gegenstandsexemplar.objects.get_or_create(
                inventarnummer=inventarnummer,
                defaults={
                    "gegenstand": typen[typ_name],
                    "zustand": zustand,
                    "verfuegbarkeitsstatus": status,
                    "is_seed": True,
                },
            )
            if created:
                neu_angelegt += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seed abgeschlossen: {neu_angelegt} neue Exemplare angelegt."
        ))