from inventory.infrastruktur.models import Kategorie


def alle_fuer_organisation(organisation_id, *, include_archivierte=True):
    """Liefert Kategorien der angegebenen Organisation."""
    kategorien = Kategorie.objects.filter(
        organisation_id=organisation_id,
    )

    if not include_archivierte:
        kategorien = kategorien.filter(is_archiviert=False)

    return kategorien.order_by("name")


def hole_fuer_organisation(kategorie_id, organisation_id):
    """Liefert eine Kategorie nur, wenn sie zu dieser Organisation gehört."""
    return Kategorie.objects.filter(
        pk=kategorie_id,
        organisation_id=organisation_id,
    ).first()


def anlegen(*, organisation_id, name, beschreibung):
    """Legt eine Kategorie für eine Organisation an."""
    return Kategorie.objects.create(
        organisation_id=organisation_id,
        name=name,
        beschreibung=beschreibung,
    )


def aktualisieren(kategorie, aenderungen):
    """Aktualisiert erlaubte Felder, ohne Organisation oder Identität zu ändern."""
    geaenderte_felder = []

    for feld in ("name", "beschreibung"):
        if feld in aenderungen:
            setattr(kategorie, feld, aenderungen[feld])
            geaenderte_felder.append(feld)

    if geaenderte_felder:
        kategorie.save(update_fields=geaenderte_felder)

    return kategorie