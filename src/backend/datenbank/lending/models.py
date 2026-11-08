from datetime import date

from django.core.exceptions import ValidationError
from django.db import models


class Anfragestatus(models.TextChoices):
    EINGEREICHT = 'eingereicht', 'Eingereicht'
    GENEHMIGT = 'genehmigt', 'Genehmigt'
    ABGELEHNT = 'abgelehnt', 'Abgelehnt'
    ZURUECKGEZOGEN = 'zurueckgezogen', 'Zurückgezogen'
    ABGELAUFEN = 'abgelaufen', 'Abgelaufen'


class Ausleihanfrage(models.Model):
    # Ausleiher der die Anfrage stellt
    nutzer = models.ForeignKey(
        'users.Nutzer',
        on_delete=models.CASCADE,
        related_name='ausleihanfragen'
    )
    # Gegenstandstyp der angefragt wird
    gegenstand = models.ForeignKey(
        'inventory.Gegenstandstyp',
        on_delete=models.CASCADE,
        related_name='ausleihanfragen'
    )
    # Organisation zu der die Anfrage gehört
    organisation = models.ForeignKey(
        'organisations.Organisation',
        on_delete=models.CASCADE,
        related_name='ausleihanfragen'
    )
    startdatum = models.DateField()
    enddatum = models.DateField()
    anfragestatus = models.CharField(
        max_length=30,
        choices=Anfragestatus.choices,
        default=Anfragestatus.EINGEREICHT
    )
    # Ablehnungsgrund ist optional — nur bei Ablehnung befüllt
    ablehnungsgrund = models.CharField(max_length=500, null=True, blank=True)
    # Nutzer muss Bedingungen akzeptieren bevor Anfrage gestellt wird
    bedingungen_akzeptiert = models.BooleanField(default=False)
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)
    is_seed = models.BooleanField(default=False)
    seed_key = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        help_text="Eindeutiger Schlüssel für vom Projekt verwaltete Seed-Daten."
    )

    class Meta:
        db_table = 'ausleihanfrage'

    def clean(self):
        super().clean()

        # Ursprüngliche Datumswerte einer bereits gespeicherten Anfrage laden.
        ursprungsdaten = None

        if self.pk is not None:
            ursprungsdaten = (
                type(self).objects
                .filter(pk=self.pk)
                .values('startdatum', 'enddatum')
                .first()
            )

        # Prüfen, ob sich das Startdatum verändert hat.
        startdatum_geaendert = (
            ursprungsdaten is None
            or self.startdatum != ursprungsdaten['startdatum']
        )

        # Prüfen, ob sich das Rückgabedatum verändert hat.
        enddatum_geaendert = (
            ursprungsdaten is None
            or self.enddatum != ursprungsdaten['enddatum']
        )

        if (
            startdatum_geaendert
            and self.startdatum
            and self.startdatum <= date.today()
        ):
            raise ValidationError({
                'startdatum': 'Das Startdatum muss in der Zukunft liegen.'
            })

        if (
            (startdatum_geaendert or enddatum_geaendert)
            and self.startdatum
            and self.enddatum
            and self.enddatum <= self.startdatum
        ):
            raise ValidationError({
                'enddatum': (
                    'Das Rückgabedatum muss nach dem Startdatum liegen.'
                )
            })


    def __str__(self):
        return f"Anfrage {self.id} von {self.nutzer} ({self.anfragestatus})"