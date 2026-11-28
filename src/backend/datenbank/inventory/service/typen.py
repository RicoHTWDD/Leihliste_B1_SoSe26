"""
Service: Gegenstandstypen

Einziger Eingang für Abläufe rund um Gegenstandstypen.
Der Controller ruft diese Funktionen auf und kennt die Models nicht.

Kategorie- und Standortzugriffe laufen über ihre Repositories.
Der Service steuert den Ablauf und prüft Organisationszugehörigkeiten.
"""
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError

from inventory.domaene import regeln
from inventory.domaene.regeln import RegelVerstoss  # noqa: F401 – Controller fängt sie über den Service
from inventory.infrastruktur import category_repository, location_repository
from inventory.infrastruktur.models import Gegenstandsexemplar, Gegenstandstyp


FELDER_BEARBEITEN = (
    "name",
    "beschreibung",
    "kategorie",
    "maximale_ausleihzeit",
)

# Lesen

def alle_lesen():
    """Liefert alle Gegenstandstypen mit Kategorie und Exemplaren."""
    return (
        Gegenstandstyp.objects
        .select_related("kategorie")
        .prefetch_related("exemplare")
        .order_by("name")
    )

# Hilfsfunktionen

def _kategorie_laden(daten, organisation_id):
    """Lädt eine Kategorie innerhalb der Organisation."""
    if "kategorie" not in daten:
        return None

    kategorie = category_repository.hole_fuer_organisation(
        daten["kategorie"],
        organisation_id,
    )
    if kategorie is None:
        raise RegelVerstoss(
            feldfehler={
                "kategorie": [
                    "Diese Kategorie existiert nicht oder gehört nicht zu dieser Organisation."
                ]
            }
        )
    return kategorie


def _standort_laden(standort_id, organisation_id):
    """Lädt einen Standort innerhalb der Organisation."""
    standort = location_repository.hole_fuer_organisation(
        standort_id,
        organisation_id,
    )
    if standort is None:
        raise RegelVerstoss(
            feldfehler={
                "standort": [
                    "Dieser Standort existiert nicht oder gehört nicht zu dieser Organisation."
                ]
            }
        )
    return standort


def _kategorie_organisation_pruefen(kategorie, organisation_id):
    fehler = regeln.pruefe_kategorie_organisation(
        kategorie.organisation_id,
        organisation_id,
    )
    if fehler:
        raise RegelVerstoss(feldfehler=fehler)


# Anlegen

@transaction.atomic
def anlegen(daten, *, organisation_id):
    """
    Legt einen Gegenstandstyp samt Exemplaren innerhalb einer Organisation an.

    Die Organisation muss aus dem autorisierten Nutzerkontext kommen.
    """
    regeln.pruefe_typ_anlegen(daten)

    kategorie = _kategorie_laden(daten, organisation_id)
    _kategorie_organisation_pruefen(kategorie, organisation_id)

    standorte = []
    for nr, exemplar in enumerate(daten["exemplare"]):
        try:
            standorte.append(
                _standort_laden(exemplar["standort"], organisation_id)
            )
        except RegelVerstoss as verstoss:
            raise RegelVerstoss(
                feldfehler={"exemplare": {nr: verstoss.feldfehler}}
            )

    typ = Gegenstandstyp.objects.create(
        organisation_id=organisation_id,
        kategorie=kategorie,
        name=daten["name"],
        beschreibung=daten.get("beschreibung"),
        maximale_ausleihzeit=daten["maximale_ausleihzeit"],
    )

    for nr, exemplar in enumerate(daten["exemplare"]):
        try:
            with transaction.atomic():
                Gegenstandsexemplar.objects.create(
                    gegenstand=typ,
                    standort=standorte[nr],
                    inventarnummer=exemplar["inventarnummer"],
                    zustand=exemplar["zustand"],
                    verfuegbarkeitsstatus=exemplar["verfuegbarkeitsstatus"],
                )
        except IntegrityError:
            raise RegelVerstoss(
                feldfehler={
                    "exemplare": {
                        nr: {
                            "inventarnummer": [
                                "Diese Inventarnummer ist bereits vergeben."
                            ]
                        }
                    }
                }
            )

    return typ

# Bearbeiten

@transaction.atomic
def bearbeiten(id, aenderungen):
    """Bearbeitet einen Gegenstandstyp, ohne seine Exemplare zu ändern."""
    typ = Gegenstandstyp.objects.filter(pk=id).first()
    if typ is None:
        return None

    regeln.pruefe_typ_bearbeiten(aenderungen)

    kategorie = _kategorie_laden(aenderungen, typ.organisation_id)
    if kategorie is None:
        kategorie = typ.kategorie

    _kategorie_organisation_pruefen(kategorie, typ.organisation_id)

    for feld in FELDER_BEARBEITEN:
        if feld not in aenderungen:
            continue
        if feld == "kategorie":
            typ.kategorie = kategorie
        else:
            setattr(typ, feld, aenderungen[feld])

    typ.save()
    return typ


def bearbeiten_pruefen(
    aenderungen,
    *,
    organisation_id,
    aktuelle_kategorie_id,
):
    """Prüft eine Typänderung, bevor ein Admin-Formular speichert."""
    regeln.pruefe_typ_bearbeiten(aenderungen)

    kategorie_daten = {
        "kategorie": aenderungen.get(
            "kategorie",
            aktuelle_kategorie_id,
        )
    }
    kategorie = _kategorie_laden(kategorie_daten, organisation_id)
    _kategorie_organisation_pruefen(kategorie, organisation_id)

# Löschen

@transaction.atomic
def loeschen(id):
    """Löscht einen Typ mit seinen Exemplaren, sofern keine Anfragen bestehen."""
    typ = Gegenstandstyp.objects.select_for_update().filter(pk=id).first()
    if typ is None:
        return False

    regeln.pruefe_typ_loeschung(typ.ausleihanfragen.count())

    try:
        typ.delete()
    except ProtectedError:
        raise RegelVerstoss(
            code=regeln.ANFRAGEN_VORHANDEN,
            meldung=(
                "Zu diesem Gegenstandstyp gibt es Ausleihanfragen. "
                "Er kann nicht gelöscht werden."
            ),
        )

    return True