from django.db import models


class Zustand(models.TextChoices):
    GUT = 'gut', 'Gut'
    BESCHAEDIGT = 'beschaedigt', 'Beschädigt'
    DEFEKT = 'defekt', 'Defekt'
    VERLOREN = 'verloren', 'Verloren'


class Verfuegbarkeitsstatus(models.TextChoices):
    VERFUEGBAR = 'verfuegbar', 'Verfügbar'
    RESERVIERT = 'reserviert', 'Reserviert'
    AUSGELIEHEN = 'ausgeliehen', 'Ausgeliehen'
    NICHT_VERFUEGBAR = 'nicht_verfuegbar', 'Nicht verfügbar'


class Kategorie(models.Model):
    name = models.CharField(max_length=255)
    # Beschreibung ist optional
    beschreibung = models.CharField(max_length=500, null=True, blank=True)
    is_seed = models.BooleanField(default=False)

    class Meta:
        db_table = 'kategorie'

    def __str__(self):
        return self.name


class Standort(models.Model):
    # Jeder Standort gehört zu einer Organisation
    organisation = models.ForeignKey(
        'organisations.Organisation',
        on_delete=models.CASCADE,
        related_name='standorte'
    )
    name = models.CharField(max_length=255)
    # Beschreibung ist optional
    beschreibung = models.CharField(max_length=500, null=True, blank=True)
    is_seed = models.BooleanField(default=False)

    class Meta:
        db_table = 'standort'

    def __str__(self):
        return self.name


class Gegenstandstyp(models.Model):
    # Jeder Gegenstandstyp gehört zu einer Organisation
    organisation = models.ForeignKey(
        'organisations.Organisation',
        on_delete=models.CASCADE,
        related_name='gegenstandstypen'
    )
    # Kategorie z.B. "Elektronik"
    kategorie = models.ForeignKey(
        Kategorie,
        on_delete=models.SET_NULL,
        null=True,
        related_name='gegenstandstypen'
    )
    # Standort wo der Gegenstandstyp gelagert wird
    standort = models.ForeignKey(
        Standort,
        on_delete=models.SET_NULL,
        null=True,
        related_name='gegenstandstypen'
    )
    name = models.CharField(max_length=255)
    # Beschreibung ist optional
    beschreibung = models.TextField(null=True, blank=True)
    # Maximale Ausleihzeit in Tagen
    maximale_ausleihzeit = models.IntegerField()
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)
    is_seed = models.BooleanField(default=False)

    class Meta:
        db_table = 'gegenstandstyp'

    def __str__(self):
        return self.name


class Gegenstandsexemplar(models.Model):
    # Jedes Exemplar gehört zu einem Gegenstandstyp
    gegenstand = models.ForeignKey(
        Gegenstandstyp,
        on_delete=models.CASCADE,
        related_name='exemplare'
    )
    # Inventarnummer ist eindeutig und wird nie wiederverwendet
    inventarnummer = models.CharField(max_length=255, unique=True)
    zustand = models.CharField(
        max_length=20,
        choices=Zustand.choices,
        default=Zustand.GUT
    )
    verfuegbarkeitsstatus = models.CharField(
        max_length=20,
        choices=Verfuegbarkeitsstatus.choices,
        default=Verfuegbarkeitsstatus.VERFUEGBAR
    )
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)
    is_seed = models.BooleanField(default=False)

    class Meta:
        db_table = 'gegenstandsexemplar'

    def __str__(self):
        return f"{self.inventarnummer} ({self.verfuegbarkeitsstatus})"