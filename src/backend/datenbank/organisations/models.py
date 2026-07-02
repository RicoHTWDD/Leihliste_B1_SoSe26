from django.db import models


class OrganisationsTyp(models.TextChoices):
    SCHULE = 'schule', 'Schule'
    HOCHSCHULE = 'hochschule', 'Hochschule'
    UNTERNEHMEN = 'unternehmen', 'Unternehmen'
    VEREIN = 'verein', 'Verein'
    BIBLIOTHEK = 'bibliothek', 'Bibliothek'
    SONSTIGE = 'sonstige', 'Sonstige'


class Organisation(models.Model):
    name = models.CharField(max_length=255)
    organisationstyp = models.CharField(
        max_length=50,
        choices=OrganisationsTyp.choices
    )
    erstellt_am = models.DateTimeField(auto_now_add=True)
    is_seed = models.BooleanField(default=False)

    class Meta:
        db_table = 'organisation'

    def __str__(self):
        return self.name