from django.db import migrations


def kategorien_organisationen_zuordnen(apps, schema_editor):
    db = schema_editor.connection.alias
    Kategorie = apps.get_model("inventory", "Kategorie")
    Gegenstandstyp = apps.get_model("inventory", "Gegenstandstyp")

    for kategorie in Kategorie.objects.using(db).all():
        organisation_ids = list(
            Gegenstandstyp.objects.using(db)
            .filter(kategorie_id=kategorie.pk)
            .values_list("organisation_id", flat=True)
            .distinct()
        )

        if len(organisation_ids) != 1:
            raise RuntimeError(
                f"Kategorie {kategorie.pk} ({kategorie.name!r}) wird von "
                f"{len(organisation_ids)} Organisationen verwendet. "
                "Vor der Migration muss die Zuordnung manuell geklärt werden."
            )

        Kategorie.objects.using(db).filter(pk=kategorie.pk).update(
            organisation_id=organisation_ids[0]
        )


class Migration(migrations.Migration):
    dependencies = [
        ("inventory", "0005_expand_category_organisation"),
    ]

    operations = [
        migrations.RunPython(
            kategorien_organisationen_zuordnen,
            reverse_code=migrations.RunPython.noop,
        ),
    ]