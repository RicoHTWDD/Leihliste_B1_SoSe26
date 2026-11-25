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
    Standort,
    Verfuegbarkeitsstatus,
    Zustand,
)

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


def standorte_lesen():
    """Alle Standorte, alphabetisch nach Namen sortiert."""
    return Standort.objects.order_by("name")

# Hilfsfunktionen ---------------------------------------------------------

def _bild_angaben(datei):
    """Aus einer hochgeladenen Datei nur das holen, was die Domäne braucht:
    (dateiname, groesse in Byte). Kein Bild → None."""
    if not datei:
        return None
    return (datei.name, datei.size)


def _bild_nach_commit_loeschen(storage, dateiname):
    """Löscht eine Bilddatei erst, wenn die Datenbankänderung abgeschlossen ist."""
    if dateiname:
        transaction.on_commit(
            lambda: storage.delete(dateiname),
            robust=True,
        )


def standort_laden(standort_id):
    """Lädt den ausgewählten Standort. Gibt es ihn nicht → RegelVerstoss am Feld "standort".

    Wird auch von typen.py genutzt (Exemplare beim Anlegen eines Typs).
    """
    standort = Standort.objects.filter(pk=standort_id).first()
    if standort is None:
        raise RegelVerstoss(feldfehler={"standort": ["Dieser Standort existiert nicht."]})
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
    standort = standort_laden(daten["standort"])

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
    regeln.pruefe_exemplar_bearbeiten(
        _bisheriger_stand(exemplar),
        aenderungen,
        bild=_bild_angaben(aenderungen.get("bild"))
    )

    # Altes Bild merken, damit es erst nach erfolgreichem Speichern gelöscht wird
    altes_bild = None
    if "bild" in aenderungen and exemplar.bild:
        altes_bild = (exemplar.bild.storage, exemplar.bild.name)

    neues_bild = None

    # 3. Änderungen übernehmen
    for feld, wert in aenderungen.items():
        if feld == "standort":
            exemplar.standort = standort_laden(wert)
        elif feld == "bild":
            if wert is None:
                exemplar.bild = None
            else:
                exemplar.bild.save(wert.name, wert, save=False)
                neues_bild = (exemplar.bild.storage, exemplar.bild.name)
        elif feld in FELDER_BEARBEITEN:
            setattr(exemplar, feld, wert)

    # 4. Speichern
    try:
        with transaction.atomic():
            exemplar.save()
    except IntegrityError:
        if neues_bild:
            neues_bild[0].delete(neues_bild[1])
        raise RegelVerstoss(feldfehler={
            "inventarnummer": ["Diese Inventarnummer ist bereits vergeben."]})
    except Exception:
        if neues_bild:
            neues_bild[0].delete(neues_bild[1])
        raise

    # 5. Altes Bild erst nach erfolgreichem Datenbank-Commit löschen
    if altes_bild:
        _bild_nach_commit_loeschen(*altes_bild)

    return exemplar


# --- Nur prüfen (für das Admin-Formular) --------------------------------------
# Das Admin-Formular will Fehler am Feld anzeigen, BEVOR gespeichert wird.
# Dafür fragt es hier – der Service reicht die Frage an die Domäne weiter.

def anlegen_pruefen(daten):
    """Wirft RegelVerstoss, wenn diese Daten nicht angelegt werden dürfen."""
    regeln.pruefe_exemplar_anlegen(daten, bild=_bild_angaben(daten.get("bild")))


def bearbeiten_pruefen(id, aenderungen):
    """Wirft RegelVerstoss, wenn diese Änderung nicht erlaubt ist."""
    exemplar = Gegenstandsexemplar.objects.get(pk=id)
    regeln.pruefe_exemplar_bearbeiten(_bisheriger_stand(exemplar), aenderungen,
                                      bild=_bild_angaben(aenderungen.get("bild")))


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

    # 2. Typ sperren
    Gegenstandstyp.objects.select_for_update().get(pk=exemplar.gegenstand_id)

    # 3. Domäne entscheidet: letztes Exemplar darf nicht einzeln gelöscht werden
    anzahl = Gegenstandsexemplar.objects.filter(
        gegenstand_id=exemplar.gegenstand_id
    ).count()
    regeln.pruefe_exemplar_loeschung(anzahl)

    # 4. Bilddatei merken
    bild = None
    if exemplar.bild:
        bild = (exemplar.bild.storage, exemplar.bild.name)

    # 5. Exemplar löschen
    exemplar.delete()

    # 6. Bilddatei erst nach erfolgreichem Datenbank-Commit löschen
    if bild:
        _bild_nach_commit_loeschen(*bild)

    return True