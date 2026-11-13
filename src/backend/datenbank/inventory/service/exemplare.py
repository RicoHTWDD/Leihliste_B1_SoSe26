"""
Service: Gegenstandsexemplare

Geplante Funktionen (siehe docs/design-analysis/current-flow.puml):
- alle_lesen()                 – Abschnitt 1: Gegenstände anzeigen
- anlegen(daten)               – Abschnitt 2: Gegenstand anlegen
- bearbeiten(id, aenderungen)  – Abschnitt 3: Gegenstand bearbeiten
- loeschen(id)                 – Abschnitt 4: Gegenstand löschen
"""
"""
Service: Gegenstandsexemplare

Einziger Eingang für alles, was mit Exemplaren passiert.
Der Controller ruft nur diese Funktionen auf und kennt die Models nicht.

Funktionen:
- alle_lesen()                 – Gegenstände anzeigen (alle Exemplare)
- verfuegbare_lesen()          – Gegenstände anzeigen (nur verfügbare)
- anlegen(daten)               – Gegenstand anlegen
- bearbeiten(id, aenderungen)  – folgt
- loeschen(id)                 – folgt
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

def alle_lesen():
    """Alle Exemplare, sortiert nach Name des Typs und Inventarnummer."""
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
    bisher = {feld: getattr(exemplar, feld) for feld in FELDER_BEARBEITEN}
    bisher["gegenstand"] = exemplar.gegenstand_id
    regeln.pruefe_exemplar_bearbeiten(bisher, aenderungen)

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