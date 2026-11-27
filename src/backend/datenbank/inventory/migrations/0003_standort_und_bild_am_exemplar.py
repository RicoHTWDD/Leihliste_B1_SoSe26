"""
#33 / #47: Der Standort gehört zum einzelnen Exemplar, nicht mehr zum Gegenstandstyp.
Außerdem: Name des Gegenstandstyps höchstens 100 Zeichen (Akzeptanzkriterium #33)
und optional ein Bild am Exemplar 

Ablauf:
  1. neues Feld standort am Exemplar anlegen
  2. vorhandene Daten übernehmen: jedes Exemplar bekommt den Standort seines Typs
  3. altes Feld standort am Typ entfernen
  4. Name des Typs auf 100 Zeichen begrenzen
  5. neues Feld bild am Exemplar (optional)
"""
import django.db.models.deletion
from django.db import migrations, models


def standort_vom_typ_uebernehmen(apps, schema_editor):
    """Schritt 2: Standort des Typs auf alle seine Exemplare kopieren (keine Daten gehen verloren)."""
    Gegenstandsexemplar = apps.get_model("inventory", "Gegenstandsexemplar")
    for exemplar in Gegenstandsexemplar.objects.select_related("gegenstand"):
        exemplar.standort_id = exemplar.gegenstand.standort_id
        exemplar.save(update_fields=["standort"])


def standort_zurueck_an_typ(apps, schema_editor):
    """Rückweg (migrate zurück): Typ bekommt den Standort seines ersten Exemplars."""
    Gegenstandstyp = apps.get_model("inventory", "Gegenstandstyp")
    for typ in Gegenstandstyp.objects.all():
        erstes = typ.exemplare.exclude(standort=None).first()
        typ.standort_id = erstes.standort_id if erstes else None
        typ.save(update_fields=["standort"])


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0002_alter_gegenstandsexemplar_verfuegbarkeitsstatus_and_more"),
    ]

    operations = [
        # 1. neues Feld am Exemplar
        migrations.AddField(
            model_name="gegenstandsexemplar",
            name="standort",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="exemplare",
                to="inventory.standort",
            ),
        ),
        # 2. Daten übernehmen
        migrations.RunPython(standort_vom_typ_uebernehmen, standort_zurueck_an_typ),
        # 3. altes Feld am Typ entfernen
        migrations.RemoveField(
            model_name="gegenstandstyp",
            name="standort",
        ),
        # 4. Name höchstens 100 Zeichen
        migrations.AlterField(
            model_name="gegenstandstyp",
            name="name",
            field=models.CharField(max_length=100),
        ),
        # 5. Bild (optional)
        migrations.AddField(
            model_name="gegenstandsexemplar",
            name="bild",
            field=models.ImageField(blank=True, null=True, upload_to="exemplare/"),
        ),
    ]
