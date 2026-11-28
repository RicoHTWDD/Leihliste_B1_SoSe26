"""
Service: Gegenstandsexemplare

Einziger Eingang für alles, was mit Exemplaren passiert.
Der Controller ruft nur diese Funktionen auf und kennt die Models nicht.

Funktionen:
- alle_lesen(verfuegbar=None)  – Gegenstände anzeigen (alle, optional gefiltert)
- verfuegbare_lesen()          – Gegenstände anzeigen (nur verfügbare)
- anlegen(daten)               – Gegenstand anlegen
- bearbeiten(id, aenderungen)  – Gegenstand bearbeiten
- loeschen(id)                 – Gegenstand löschen
- anlegen_pruefen(daten), bearbeiten_pruefen(id, aenderungen) – nur prüfen (Admin-Formular)
"""
from django.db import IntegrityError, transaction
from django.db.models import Q

from inventory.domaene import regeln
from inventory.domaene.regeln import RegelVerstoss  # noqa: F401 – Controller fängt sie über den Service
from inventory.infrastruktur.models import (
    Gegenstandsexemplar,
    Gegenstandstyp,
    Verfuegbarkeitsstatus,
    Zustand,
)
from inventory.infrastruktur import location_repository

# Defekte oder verlorene Exemplare zählen nie als verfügbar (Filterlogik aus main, #163).
NIE_VERFUEGBAR = (Zustand.DEFEKT, Zustand.VERLOREN)


# --- Lesen -------------------------------------------------------------------
# Rückgabe ist eine Datenbankabfrage (QuerySet), die noch nicht ausgeführt ist.
# So können Seitenaufteilung und Detailsuche (über die id) im Controller
# weiter funktionieren.

def alle_lesen(verfuegbar=None):
    """Alle Exemplare, sortiert nach Name des Typs und Inventarnummer.

    select_related holt Typ, Standort und Kategorie in derselben Abfrage
    (JOIN) mit, statt für jedes Exemplar einzeln nachzufragen.

    verfuegbar (aus ?verfuegbar=… der Anfrage):
    - "true"  → nur verfügbare Exemplare
    - "false" → nur nicht verfügbare (auch defekte oder verlorene)
    - sonst   → alle
    """
    abfrage = (
        Gegenstandsexemplar.objects
        .select_related("gegenstand", "gegenstand__kategorie", "standort")
        .order_by("gegenstand__name", "inventarnummer")
    )
    if verfuegbar == "true":
        return _nur_verfuegbare(abfrage)
    if verfuegbar == "false":
        return abfrage.filter(
            Q(verfuegbarkeitsstatus=Verfuegbarkeitsstatus.NICHT_VERFUEGBAR)
            | Q(zustand__in=NIE_VERFUEGBAR)
        )
    return abfrage


def _nur_verfuegbare(abfrage):
    return abfrage.filter(
        verfuegbarkeitsstatus=Verfuegbarkeitsstatus.VERFUEGBAR
    ).exclude(zustand__in=NIE_VERFUEGBAR)


def verfuegbare_lesen():
    """Nur Exemplare, die gerade verfügbar sind (gleiche Sortierung)."""
    return _nur_verfuegbare(alle_lesen())

# Hilfsfunktionen ---------------------------------------------------------

def _bild_angaben(datei):
    """Aus einer hochgeladenen Datei nur das holen, was die Domäne braucht:
    (dateiname, groesse in Byte). Kein Bild → None."""
    if not datei:
        return None
    return (datei.name, datei.size)


def standort_laden(standort_id, organisation_id):
    """Lädt einen Standort der angegebenen Organisation."""
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


# --- Anlegen -----------------------------------------------------------------

@transaction.atomic
def anlegen(daten):
    """Legt ein Exemplar zu einem bestehenden Gegenstandstyp an.

    Ablauf: Domäne fragen → Typ laden → speichern.
    Wirft RegelVerstoss (mit Feldname), wenn etwas nicht erlaubt ist.
    """
    # 1. Domäne entscheidet (Pflichtfelder inkl. Standort, defekt/verloren ⇒ nicht verfügbar,
    #    Bild: JPG/PNG, höchstens 200 kB)
    regeln.pruefe_exemplar_anlegen(daten, bild=_bild_angaben(daten.get("bild")))

    # 2. Gegenstandstyp und Standort laden
    typ = Gegenstandstyp.objects.filter(pk=daten["gegenstand"]).first()
    if typ is None:
        raise RegelVerstoss(feldfehler={
            "gegenstand": ["Dieser Gegenstandstyp existiert nicht."]})
    standort = standort_laden(daten["standort"], typ.organisations_id,)

    # 3. Speichern – die Datenbank sichert die eindeutige Inventarnummer ab
    try:
        with transaction.atomic():
            return Gegenstandsexemplar.objects.create(
                gegenstand=typ,
                standort=standort,
                bild=daten.get("bild"),
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
FELDER_BEARBEITEN = ("inventarnummer", "zustand", "verfuegbarkeitsstatus", "standort", "bild")


def _bisheriger_stand(exemplar):
    """Aktuelle Werte eines Exemplars als Dictionary – so, wie die Domäne sie braucht."""
    bisher = {feld: getattr(exemplar, feld) for feld in FELDER_BEARBEITEN
              if feld not in ("standort", "bild")}
    bisher["standort"] = exemplar.standort_id          # Domäne braucht nur die ID
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
    regeln.pruefe_exemplar_bearbeiten(_bisheriger_stand(exemplar), aenderungen,
                                          bild=_bild_angaben(aenderungen.get("bild")))
    

    # 3. Speichern – die Datenbank sichert die eindeutige Inventarnummer ab
    for feld, wert in aenderungen.items():
        if feld == "standort":
            exemplar.standort = standort_laden(wert, exemplar.gegenstand.organisations_id,)   # ID → Standort aus der Liste
        elif feld == "bild":
            if exemplar.bild:
                exemplar.bild.delete(save=False)       # altes Bild löschen (nur 1 Bild erlaubt)
            exemplar.bild = wert                       # neues Bild oder None (= Bild entfernen)
        elif feld in FELDER_BEARBEITEN:
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
    regeln.pruefe_exemplar_anlegen(daten, bild=_bild_angaben(daten.get("bild")))
    typ = Gegenstandstyp.objects.filter(
        pk=daten["gegenstand"]
    ).first()

    if typ is None:
        raise RegelVerstoss(
            feldfehler={
                "gegenstand": ["Dieser Gegenstandstyp existiert nicht."]
            }
        )

    standort_laden(daten["standort"], typ.organisation_id)


def bearbeiten_pruefen(id, aenderungen):
    """Wirft RegelVerstoss, wenn diese Änderung nicht erlaubt ist."""
    exemplar = Gegenstandsexemplar.objects.get(pk=id)
    regeln.pruefe_exemplar_bearbeiten(_bisheriger_stand(exemplar), aenderungen,
                                      bild=_bild_angaben(aenderungen.get("bild")))
    if "standort" in aenderungen:
        standort_laden(
            aenderungen["standort"],
            exemplar.gegenstand.organisation_id,
        )


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