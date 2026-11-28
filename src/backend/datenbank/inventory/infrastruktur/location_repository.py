from inventory.infrastruktur.models import Standort


def alle_fuer_organisation(organisation_id, *, include_archivierte=True):
    """Liefert Standorte der angegebenen Organisation."""
    standorte = Standort.objects.filter(
        organisation_id=organisation_id,
    )

    if not include_archivierte:
        standorte = standorte.filter(is_archiviert=False)

    return standorte.order_by("name")


def hole_fuer_organisation(standort_id, organisation_id):
    """Liefert einen Standort nur, wenn er zu dieser Organisation gehört."""
    return Standort.objects.filter(
        pk=standort_id,
        organisation_id=organisation_id,
    ).first()


def anlegen(*, organisation_id, name, beschreibung):
    """Legt einen Standort für eine Organisation an."""
    return Standort.objects.create(
        organisation_id=organisation_id,
        name=name,
        beschreibung=beschreibung,
    )


def aktualisieren(standort, aenderungen):
    """Aktualisiert erlaubte Felder, ohne Organisation oder Identität zu ändern."""
    geaenderte_felder = []

    for feld in ("name", "beschreibung"):
        if feld in aenderungen:
            setattr(standort, feld, aenderungen[feld])
            geaenderte_felder.append(feld)

    if geaenderte_felder:
        standort.save(update_fields=geaenderte_felder)

    return standort