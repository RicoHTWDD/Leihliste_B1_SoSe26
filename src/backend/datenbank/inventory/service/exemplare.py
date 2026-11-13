"""
Service: Gegenstandsexemplare

Einziger Eingang für alles, was mit Exemplaren passiert.
Der Controller ruft nur diese Funktionen auf und kennt die Models nicht.

Funktionen:
- alle_lesen()                 – Gegenstände anzeigen (alle Exemplare)
- verfuegbare_lesen()          – Gegenstände anzeigen (nur verfügbare)
- anlegen(daten)               – Gegenstand anlegen
- bearbeiten(id, aenderungen)  – Gegenstand bearbeiten
- loeschen(id)                 – Gegenstand löschen
- anlegen_pruefen(daten), bearbeiten_pruefen(id, aenderungen) – nur prüfen (Admin-Formular)
"""
from django.db import IntegrityError, transaction

from inventory.domaene import regeln
from inventory.domaene.regeln import RegelVerstoss  # noqa: F401 – Controller fängt sie über den Service
from inventory.infrastruktur.models import (
    Gegenstandsexemplar,
    Gegenstandstyp,
    Verfuegbarkeitsstatus,
)


# --- Lesen -------------------------------------------------------------------
# Rückgabe ist eine Datenbankabfrage (QuerySet), die noch nicht ausgeführt ist.
# So können Seitenaufteilung und Detailsuche (über die id) im Controller
# weiter funktionieren.

def alle_lesen():
    """Alle Exemplare, sortiert nach Name des Typs und Inventarnummer.

    select_related holt Typ, Standort und Kategorie in derselben Abfrage
    (JOIN) mit, statt für jedes Exemplar einzeln nachzufragen.
    """
    return (
        Gegenstandsexemplar.objects
        .select_related("gegenstand", "gegenstand__standort", "gegenstand__kategorie")
        .order_by("gegenstand__name", "inventarnummer")
    )


def verfuegbare_lesen():
    """Nur Exemplare, die gerade verfügbar sind (gleiche Sortierung)."""
    return alle_lesen().filter(verfuegbarkeitsstatus=Verfuegbarkeitsstatus.VERFUEGBAR)


# --- Anlegen -----------------------------------------------------------------

@transaction.atomic
def anlegen(daten):
    """Legt ein Exemplar zu einem bestehenden Gegenstandstyp an.

    Ablauf: Domäne fragen → Typ laden → speichern.
    Wirft RegelVerstoss (mit Feldname), wenn etwas nicht erlaubt ist.
    """
    # 1. Domäne entscheidet (Pflichtfelder, defekt/verloren ⇒ nicht verfügbar)
    regeln.pruefe_exemplar_anlegen(daten)

    # 2. Gegenstandstyp laden
    typ = Gegenstandstyp.objects.filter(pk=daten["gegenstand"]).first()
    if typ is None:
        raise RegelVerstoss(feldfehler={
            "gegenstand": ["Dieser Gegenstandstyp existiert nicht."]})

    # 3. Speichern – die Datenbank sichert die eindeutige Inventarnummer ab
    try:
        with transaction.atomic():
            return Gegenstandsexemplar.objects.create(
                gegenstand=typ,
                inventarnummer=daten["inventarnummer"],
                zustand=daten["zustand"],
                verfuegbarkeitsstatus=daten["verfuegbarkeitsstatus"],
            )
    except IntegrityError:
        raise RegelVerstoss(feldfehler={
            "inventarnummer": ["Diese Inventarnummer ist bereits vergeben."]})


# --- Bearbeiten --------------------------------------------------------------

# Felder, die beim Bearbeiten geändert werden dürfen.
# Der Gegenstandstyp bleibt fest: Ein Exemplar wird nicht zu einem anderen Typ verschoben.
FELDER_BEARBEITEN = ("inventarnummer", "zustand", "verfuegbarkeitsstatus")


def _bisheriger_stand(exemplar):
    """Aktuelle Werte eines Exemplars als Dictionary – so, wie die Domäne sie braucht."""
    bisher = {feld: getattr(exemplar, feld) for feld in FELDER_BEARBEITEN}
    bisher["gegenstand"] = exemplar.gegenstand_id
    return bisher


@transaction.atomic
def bearbeiten(id, aenderungen):
    """Ändert einzelne Felder eines Exemplars.

    Ablauf: Exemplar laden → Domäne mit altem und neuem Stand fragen → speichern.
    Gibt None zurück, wenn es das Exemplar nicht gibt.
    Wirft RegelVerstoss (mit Feldname), wenn die Änderung nicht erlaubt ist.
    """
    # 1. Exemplar laden
    exemplar = Gegenstandsexemplar.objects.filter(pk=id).first()
    if exemplar is None:
        return None

    # 2. Domäne entscheidet über den Stand NACH der Änderung
    regeln.pruefe_exemplar_bearbeiten(_bisheriger_stand(exemplar), aenderungen)

    # 3. Speichern – die Datenbank sichert die eindeutige Inventarnummer ab
    for feld, wert in aenderungen.items():
        if feld in FELDER_BEARBEITEN:
            setattr(exemplar, feld, wert)
    try:
        with transaction.atomic():
            exemplar.save()
    except IntegrityError:
        raise RegelVerstoss(feldfehler={
            "inventarnummer": ["Diese Inventarnummer ist bereits vergeben."]})
    return exemplar


# --- Nur prüfen (für das Admin-Formular) --------------------------------------
# Das Admin-Formular will Fehler am Feld anzeigen, BEVOR gespeichert wird.
# Dafür fragt es hier – der Service reicht die Frage an die Domäne weiter.

def anlegen_pruefen(daten):
    """Wirft RegelVerstoss, wenn diese Daten nicht angelegt werden dürfen."""
    regeln.pruefe_exemplar_anlegen(daten)


def bearbeiten_pruefen(id, aenderungen):
    """Wirft RegelVerstoss, wenn diese Änderung nicht erlaubt ist."""
    exemplar = Gegenstandsexemplar.objects.get(pk=id)
    regeln.pruefe_exemplar_bearbeiten(_bisheriger_stand(exemplar), aenderungen)


# --- Löschen -----------------------------------------------------------------

@transaction.atomic
def loeschen(id):
    """Löscht ein Exemplar.

    Ablauf: Exemplar laden → Typ sperren → Exemplare zählen → Domäne fragen → löschen.
    Gibt False zurück, wenn es das Exemplar nicht gibt, sonst True.
    Wirft RegelVerstoss (mit Code), wenn es das letzte Exemplar des Typs ist.
    """
    # 1. Exemplar laden
    exemplar = Gegenstandsexemplar.objects.filter(pk=id).first()
    if exemplar is None:
        return False

    # 2. Typ sperren: Löschen zwei Personen gleichzeitig Exemplare desselben Typs,
    #    wartet die zweite, bis die erste fertig ist. Sonst zählen beide "2"
    #    und der Typ hätte am Ende kein Exemplar mehr.
    Gegenstandstyp.objects.select_for_update().get(pk=exemplar.gegenstand_id)

    # 3. Domäne entscheidet: letztes Exemplar darf nicht einzeln gelöscht werden
    anzahl = Gegenstandsexemplar.objects.filter(gegenstand_id=exemplar.gegenstand_id).count()
    regeln.pruefe_exemplar_loeschung(anzahl)

    # 4. Löschen
    exemplar.delete()
    return True