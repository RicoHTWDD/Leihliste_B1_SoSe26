"""
Service: Gegenstandstypen

Einziger Eingang für alles, was mit Gegenstandstypen passiert.
Der Controller ruft nur diese Funktionen auf und kennt die Models nicht.

Funktionen:
- alle_lesen()                 – alle Typen (für Liste und Detail)
- anlegen(daten)               – Typ mit mindestens einem Exemplar anlegen
- bearbeiten(id, aenderungen)  – Typ bearbeiten (ohne Exemplare)
- loeschen(id)                 – Typ mit allen Exemplaren löschen
- bearbeiten_pruefen(aenderungen) – nur prüfen (Admin-Formular)

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
)

from inventory.service.exemplare import standort_laden

# Felder des Typs, die beim Bearbeiten geändert werden dürfen
FELDER_BEARBEITEN = ("name", "beschreibung", "kategorie", "maximale_ausleihzeit")


# --- Lesen -------------------------------------------------------------------

def alle_lesen():
    """Alle Typen mit Kategorie, sortiert nach Name."""
    return (
        Gegenstandstyp.objects
        .select_related("kategorie")
        .prefetch_related("exemplare")
        .order_by("name")
    )


# --- Hilfsfunktion -----------------------------------------------------------

def _kategorie_laden(daten):
    """Lädt die ausgewählte Kategorie, falls sie in `daten` steht (sonst None).
    Gibt es die ID nicht → RegelVerstoss am Feld "kategorie"."""
    if "kategorie" not in daten:
        return None
    kategorie = Kategorie.objects.filter(pk=daten["kategorie"]).first()
    if kategorie is None:
        raise RegelVerstoss(feldfehler={"kategorie": ["Diese Kategorie existiert nicht."]})
    return kategorie

#neu in #47

def _kategorie_organisation_pruefen(kategorie, organisation_id):
    fehler = regeln.pruefe_kategorie_organisation(
        kategorie.organisation_id,
        organisation_id,
    )
    if fehler:
        raise RegelVerstoss(feldfehler=fehler)


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

    # 2. Kategorie laden und den Standort jedes Exemplars (Fehler mit Position in der Liste)
    kategorie = _kategorie_laden(daten)
    standorte = []
    for nr, exemplar in enumerate(daten["exemplare"]):
        try:
            standorte.append(standort_laden(exemplar["standort"]))
        except RegelVerstoss as verstoss:
            raise RegelVerstoss(feldfehler={"exemplare": {nr: verstoss.feldfehler}})
        
    # Die Organisation des Typs ergibt sich derzeit aus dem ersten Standort.
    organisation_id = standorte[0].organisation_id

    # Ein Typ darf keine Exemplare verschiedener Organisationen enthalten.
    if any(s.organisation_id != organisation_id for s in standorte):
        raise RegelVerstoss(
            feldfehler={
                "exemplare": [
                    "Alle Standorte müssen zur selben Organisation gehören."
                ]
            }
        )

    # Kategorie und Gegenstandstyp müssen derselben Organisation angehören.
    _kategorie_organisation_pruefen(kategorie, organisation_id)

    # 3. Typ speichern. Die Organisation kommt vom Standort des ersten Exemplars,
    #    solange es noch keine Anmeldung gibt.
    typ = Gegenstandstyp.objects.create(
        organisation=standorte[0].organisation,
        kategorie=kategorie,
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
                    standort=standorte[nr],
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

    # 2. Vorhandene Eingaberegeln prüfen
    regeln.pruefe_typ_bearbeiten(aenderungen)

    # 3. Effektive Kategorie bestimmen: neue, falls geändert, sonst bestehende
    kategorie = _kategorie_laden(aenderungen)
    if kategorie is None:
        kategorie = typ.kategorie

    # Die Organisation des Typs wird in diesem Service nicht geändert.
    _kategorie_organisation_pruefen(kategorie, typ.organisation_id)

    # 4. Speichern
    for feld in FELDER_BEARBEITEN:
        if feld not in aenderungen:
            continue
        if feld == "kategorie":
            typ.kategorie = kategorie
        else:
            setattr(typ, feld, aenderungen[feld])
    typ.save()
    return typ


# --- Nur prüfen (für das Admin-Formular) --------------------------------------

def bearbeiten_pruefen(aenderungen, *, organisation_id, aktuelle_kategorie_id):
    regeln.pruefe_typ_bearbeiten(aenderungen)

    kategorie = _kategorie_laden({
        "kategorie": aenderungen.get("kategorie", aktuelle_kategorie_id)
    })
    _kategorie_organisation_pruefen(kategorie, organisation_id)


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