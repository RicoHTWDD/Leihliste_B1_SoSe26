from django.db import models


class Zustand(models.TextChoices):
    NEU = 'neu', 'Neu'
    GUT = 'gut', 'Gut'
    BESCHAEDIGT = 'beschaedigt', 'Beschädigt'
    DEFEKT = 'defekt', 'Defekt'
    VERLOREN = 'verloren', 'Verloren'


class Verfuegbarkeitsstatus(models.TextChoices):
    VERFUEGBAR = 'verfuegbar', 'Verfügbar'
    NICHT_VERFUEGBAR = 'nicht_verfuegbar', 'Nicht verfügbar'


class Kategorie(models.Model):
    organisation = models.ForeignKey(
        'organisations.Organisation',
        on_delete=models.CASCADE,
        related_name='kategorien',
    )
    name = models.CharField(max_length=100)
    beschreibung = models.CharField(max_length=500)
    is_seed = models.BooleanField(default=False)
    seed_key = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        help_text="Eindeutiger Schlüssel für vom Projekt verwaltete Seed-Daten.",
    )
    is_archiviert = models.BooleanField(default=False)

    class Meta:
        db_table = 'kategorie'
        constraints = [
            models.UniqueConstraint(
                fields=['organisation', 'name'],
                name='uniq_kategorie_org_name',
            ),
            models.CheckConstraint(
                condition=~models.Q(name=''),
                name='kategorie_name_not_empty',
            ),
            models.CheckConstraint(
                condition=~models.Q(beschreibung=''),
                name='kategorie_beschreibung_not_empty',
            ),
        ]

    def __str__(self):
        return self.name


class Standort(models.Model):
    organisation = models.ForeignKey(
        'organisations.Organisation',
        on_delete=models.CASCADE,
        related_name='standorte',
    )
    name = models.CharField(max_length=100)
    beschreibung = models.CharField(max_length=500)
    is_seed = models.BooleanField(default=False)
    seed_key = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        help_text="Eindeutiger Schlüssel für vom Projekt verwaltete Seed-Daten.",
    )
    is_archiviert = models.BooleanField(default=False)

    class Meta:
        db_table = 'standort'
        constraints = [
            models.UniqueConstraint(
                fields=['organisation', 'name'],
                name='uniq_standort_org_name',
            ),
            models.CheckConstraint(
                condition=~models.Q(name=''),
                name='standort_name_not_empty',
            ),
            models.CheckConstraint(
                condition=~models.Q(beschreibung=''),
                name='standort_beschreibung_not_empty',
            ),
        ]

    def __str__(self):
        return self.name


class Gegenstandstyp(models.Model):
    organisation = models.ForeignKey(
        'organisations.Organisation',
        on_delete=models.CASCADE,
        related_name='gegenstandstypen',
    )
    kategorie = models.ForeignKey(
        Kategorie,
        on_delete=models.PROTECT,
        related_name='gegenstandstypen',
    )
    name = models.CharField(max_length=100)
    beschreibung = models.TextField(null=True, blank=True)
    maximale_ausleihzeit = models.IntegerField()
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)
    is_seed = models.BooleanField(default=False)
    seed_key = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        help_text="Eindeutiger Schlüssel für vom Projekt verwaltete Seed-Daten.",
    )

    class Meta:
        db_table = 'gegenstandstyp'

    def __str__(self):
        return self.name


class Gegenstandsexemplar(models.Model):
    gegenstand = models.ForeignKey(
        Gegenstandstyp,
        on_delete=models.CASCADE,
        related_name='exemplare',
    )
    standort = models.ForeignKey(
        Standort,
        on_delete=models.PROTECT,
        related_name='exemplare',
    )
    bild = models.ImageField(upload_to='exemplare/', null=True, blank=True)
    inventarnummer = models.CharField(max_length=255, unique=True)
    zustand = models.CharField(
        max_length=20,
        choices=Zustand.choices,
        default=Zustand.GUT,
    )
    verfuegbarkeitsstatus = models.CharField(
        max_length=20,
        choices=Verfuegbarkeitsstatus.choices,
        default=Verfuegbarkeitsstatus.VERFUEGBAR,
    )
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)
    is_seed = models.BooleanField(default=False)
    seed_key = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        help_text="Eindeutiger Schlüssel für vom Projekt verwaltete Seed-Daten.",
    )

    class Meta:
        db_table = 'gegenstandsexemplar'

    def __str__(self):
        return f"{self.inventarnummer} ({self.verfuegbarkeitsstatus})"