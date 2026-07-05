from django.db import models



class Reservierungsstatus(models.TextChoices):
    OFFEN = 'offen', 'Offen'
    BESTAETIGT = 'bestaetigt', 'Bestätigt'
    STORNIERT = 'storniert', 'Storniert'
    ABGELEHNT = 'abgelehnt', 'Abgelehnt'
    ABGESCHLOSSEN = 'abgeschlossen', 'Abgeschlossen'



class Anfragestatus(models.TextChoices):
    EINGEREICHT = 'eingereicht', 'Eingereicht'
    GENEHMIGT = 'genehmigt', 'Genehmigt'
    ABGELEHNT = 'abgelehnt', 'Abgelehnt'
    ZURUECKGEZOGEN = 'zurueckgezogen', 'Zurückgezogen'
    ABGELAUFEN = 'abgelaufen', 'Abgelaufen'
 # Ausleihanfrage bezieht sich auf einen oder mehrere Gegenstandsexemplare genau eines Gegenständstypsen, sodass Vorschlag ist, auch bei n>1 nur alles abzulehnen oder alles zu genehmigen
    TEILWEISE_ABGELEHNT = 'teilweise_abgelehnt', 'Teilweise abgelehnt'


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

    class Meta:
        db_table = 'ausleihanfrage'

    def __str__(self):
        return f"Anfrage {self.id} von {self.nutzer} ({self.anfragestatus})"
    


class Reservierung(models.Model):
    ausleihanfrage_id = models.ForeignKey(
        'lending.Ausleihanfrage', 
        on_delete=models.CASCADE,
        db_column='ausleihanfrage_id'
    )
    gegenstandsexemplar_id = models.ForeignKey(
        'inventory.Gegenstandsexemplar',
        on_delete=models.CASCADE,
        db_column='gegenstandsexemplar_id',
        related_name='reservierungen'
    )
    nutzer_id = models.ForeignKey(
        'users.Nutzer',
        on_delete=models.CASCADE,
        db_column='nutzer_id'
    )
    startdatum = models.DateField()
    enddatum = models.DateField()
    reservierungsstatus = models.CharField(
        max_length=20,
        choices=Reservierungsstatus.choices,
        default=Reservierungsstatus.OFFEN
    )
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)
    is_seed = models.BooleanField(default=False)

    class Meta:
        db_table = 'reservierung'

    def __str__(self):
        return f"Reservierung {self.id} für {self.gegenstandsexemplar_id.inventarnummer}"

