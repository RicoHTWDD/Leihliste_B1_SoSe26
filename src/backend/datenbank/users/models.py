from django.db import models


class BenutzerRolle(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    VERLEIHER = 'verleiher', 'Verleiher'
    AUSLEIHER = 'ausleiher', 'Ausleiher'


class Kontostatus(models.TextChoices):
    VERIFIZIERUNG_AUSSTEHEND = 'verifizierung_ausstehend', 'Verifizierung ausstehend'
    AKTIV = 'aktiv', 'Aktiv'
    GESPERRT = 'gesperrt', 'Gesperrt'
    GELOESCHT = 'geloescht', 'Gelöscht'


class Nutzer(models.Model):
    # Jeder Nutzer gehört zu einer Organisation
    organisation = models.ForeignKey(
        'organisations.Organisation',
        on_delete=models.CASCADE,
        related_name='nutzer'
    )
    vollstaendiger_name = models.CharField(max_length=255)
    # Eindeutige E-Mail — kein Nutzer darf dieselbe E-Mail haben
    email = models.EmailField(unique=True)
    # Passwort wird gehasht gespeichert — nie Klartext!
    passwort_hash = models.CharField(max_length=255)
    # Telefonnummer ist optional
    telefonnummer = models.CharField(max_length=50, null=True, blank=True)
    benutzerrolle = models.CharField(
        max_length=20,
        choices=BenutzerRolle.choices,
        default=BenutzerRolle.AUSLEIHER
    )
    kontostatus = models.CharField(
        max_length=30,
        choices=Kontostatus.choices,
        default=Kontostatus.VERIFIZIERUNG_AUSSTEHEND
    )
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)
    is_seed = models.BooleanField(default=False)

    class Meta:
        db_table = 'nutzer'

    def __str__(self):
        return f"{self.vollstaendiger_name} ({self.email})"