"""
Service: Gegenstandstypen

Einziger Eingang für alles, was mit Gegenstandstypen passiert.
Der Controller ruft nur diese Funktionen auf und kennt die Models nicht.

Funktionen:
- alle_lesen()                 – alle Typen (für Liste und Detail)
- anlegen(daten)               – Typ mit mindestens einem Exemplar anlegen
- bearbeiten(id, aenderungen)  – Typ bearbeiten (ohne Exemplare)
- loeschen(id)                 – Typ mit allen Exemplaren löschen

Unterschied zu exemplare.py:
- Ein Typ wird immer zusammen mit seinen Exemplaren angelegt (eine Transaktion).
- Beim Löschen zählt nicht die Zahl der Exemplare, sondern die der Ausleihanfragen.
"""
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError

from inventory.domaene import regeln
from inventory.domaene.regeln import RegelVerstoss  # noqa: F401 – Controller fängt sie über den Service
from inventory.infrastruktur.models import (
    Gegenstandsexemplar,
    Gegenstandstyp,
    Kategorie,
    Standort,
)

# Felder des Typs, die beim Bearbeiten geändert werden dürfen
FELDER_BEARBEITEN = ("name", "beschreibung", "kategorie", "standort", "maximale_ausleihzeit")


# --- Lesen -------------------------------------------------------------------

def alle_lesen():
    """Alle Typen mit Kategorie und Standort, sortiert nach Name."""
    return (
        Gegenstandstyp.objects
        .select_related("kategorie", "standort")
        .prefetch_related("exemplare")
        .order_by("name")
    )


# --- Hilfsfunktion -----------------------------------------------------------

def _auswahl_laden(daten):
    """Lädt Kategorie und Standort zu den geschickten IDs.

    Gibt (kategorie, standort) zurück. Gibt es eine ID nicht,
    wird ein RegelVerstoss mit dem passenden Feldnamen geworfen.
    Felder, die nicht in `daten` stehen, bleiben None.
    """
    fehler = {}
    kategorie = standort = None
    if "kategorie" in daten:
        kategorie = Kategorie.objects.filter(pk=daten["kategorie"]).first()
        if kategorie is None:
            fehler["kategorie"] = ["Diese Kategorie existiert nicht."]
    if "standort" in daten:
        standort = Standort.objects.filter(pk=daten["standort"]).first()
        if standort is None:
            fehler["standort"] = ["Dieser Standort existiert nicht."]
    if fehler:
        raise RegelVerstoss(feldfehler=fehler)
    return kategorie, standort


# --- Anlegen -----------------------------------------------------------------

@transaction.atomic
def anlegen(daten):
    """Legt einen Typ zusammen mit seinen Exemplaren an.

    Ablauf: Domäne fragen → Kategorie/Standort laden → Typ speichern → Exemplare speichern.
    Alles in EINER Transaktion: Scheitert ein Exemplar, wird auch der Typ nicht gespeichert.
    """
    # 1. Domäne entscheidet (Pflichtfelder, Name ≤ 100, mindestens ein Exemplar,
    #    defekt/verloren ⇒ nicht verfügbar – für jedes Exemplar)
    regeln.pruefe_typ_anlegen(daten)

    # 2. Kategorie und Standort laden
    kategorie, standort = _auswahl_laden(daten)

    # 3. Typ speichern. Die Organisation kommt vom Standort,
    #    solange es noch keine Anmeldung gibt.
    typ = Gegenstandstyp.objects.create(
        organisation=standort.organisation,
        kategorie=kategorie,
        standort=standort,
        name=daten["name"],
        beschreibung=daten.get("beschreibung"),
        maximale_ausleihzeit=daten["maximale_ausleihzeit"],
    )

    # 4. Exemplare speichern – doppelte Inventarnummer → Fehler mit Position in der Liste
    for nr, exemplar in enumerate(daten["exemplare"]):
        try:
            with transaction.atomic():
                Gegenstandsexemplar.objects.create(
                    gegenstand=typ,
                    inventarnummer=exemplar["inventarnummer"],
                    zustand=exemplar["zustand"],
                    verfuegbarkeitsstatus=exemplar["verfuegbarkeitsstatus"],
                )
        except IntegrityError:
            # Fehler verlässt die äußere Transaktion → auch der Typ wird zurückgenommen
            raise RegelVerstoss(feldfehler={"exemplare": {nr: {
                "inventarnummer": ["Diese Inventarnummer ist bereits vergeben."]}}})
    return typ


# --- Bearbeiten --------------------------------------------------------------

@transaction.atomic
def bearbeiten(id, aenderungen):
    """Ändert einzelne Felder eines Typs. Exemplare werden einzeln bearbeitet.

    Gibt None zurück, wenn es den Typ nicht gibt.
    """
    # 1. Typ laden
    typ = Gegenstandstyp.objects.filter(pk=id).first()
    if typ is None:
        return None

    # 2. Domäne entscheidet (Pflichtfelder nicht leeren, Name ≤ 100)
    regeln.pruefe_typ_bearbeiten(aenderungen)

    # 3. Kategorie/Standort laden, falls geändert
    kategorie, standort = _auswahl_laden(aenderungen)

    # 4. Speichern
    for feld in FELDER_BEARBEITEN:
        if feld not in aenderungen:
            continue
        if feld == "kategorie":
            typ.kategorie = kategorie
        elif feld == "standort":
            typ.standort = standort
        else:
            setattr(typ, feld, aenderungen[feld])
    typ.save()
    return typ


# --- Löschen -----------------------------------------------------------------

@transaction.atomic
def loeschen(id):
    """Löscht einen Typ mit allen seinen Exemplaren.

    Gibt False zurück, wenn es den Typ nicht gibt, sonst True.
    Wirft RegelVerstoss (mit Code), wenn es Ausleihanfragen zu diesem Typ gibt.
    """
    # 1. Typ laden und sperren (gleichzeitiges Anfragen/Löschen)
    typ = Gegenstandstyp.objects.select_for_update().filter(pk=id).first()
    if typ is None:
        return False

    # 2. Domäne entscheidet: Typ mit Ausleihanfragen darf nicht gelöscht werden.
    #    typ.ausleihanfragen ist die Rückwärtsbeziehung aus lending – kein Import nötig.
    regeln.pruefe_typ_loeschung(typ.ausleihanfragen.count())

    # 3. Löschen – Exemplare gehen per CASCADE mit.
    #    PROTECT in lending ist die technische Absicherung, falls doch eine Anfrage dazukam.
    try:
        typ.delete()
    except ProtectedError:
        raise RegelVerstoss(
            code=regeln.ANFRAGEN_VORHANDEN,
            meldung="Zu diesem Gegenstandstyp gibt es Ausleihanfragen. "
                    "Er kann nicht gelöscht werden.",
        )
    return True