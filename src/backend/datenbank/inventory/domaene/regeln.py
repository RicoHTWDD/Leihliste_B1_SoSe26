"""
Domäne: fachliche Regeln des Inventars

Geplante Regeln (Quelle in Klammern, siehe docs/design-analysis/design-decision.adoc):
- Pflichtfelder gefüllt                                   (Akzeptanzkriterien #33)
- Name höchstens 100 Zeichen                              (Akzeptanzkriterien #33)
- R1: defekt/verloren ⇒ nicht "verfügbar"                 (Annahme, vom PO bestätigen)
- R5: letztes Exemplar eines Typs nicht einzeln löschen   (Annahme, vom PO bestätigen)
- R6: Gegenstandstyp mit Ausleihanfragen nicht löschen    (Annahme, vom PO bestätigen)
Bei einem Verstoß: Fehler mit Feldname, den der Service an den Controller weitergibt.
"""


"""
Domäne: fachliche Regeln des Inventars

Diese Datei entscheidet nur, ob etwas fachlich erlaubt ist.
Sie kennt weder Datenbank noch HTTP: Sie bekommt Werte (Texte, Zahlen)
und meldet entweder nichts (= Regel erfüllt) oder wirft einen `RegelVerstoss`.

Regeln (Quelle: docs/design-analysis/design-decision.adoc):
- Pflichtfelder müssen ausgefüllt sein                         (Akzeptanzkriterien #33)
- Der Name eines Gegenstandstyps hat höchstens 100 Zeichen     (Akzeptanzkriterien #33)
- Ein Gegenstandstyp wird mit mindestens einem Exemplar angelegt (Datenmodell)
- Ein defektes oder verlorenes Exemplar darf nicht verfügbar sein        (Annahme)
- Das letzte Exemplar eines Typs wird nicht einzeln gelöscht              (Annahme)
- Ein Gegenstandstyp mit Ausleihanfragen darf nicht gelöscht werden       (Annahme)
"""

# Werte wie in infrastruktur/models.py (Zustand, Verfuegbarkeitsstatus).
# Bewusst als einfache Texte, damit die Domäne nichts aus der Infrastruktur importiert.
ZUSTAENDE_NICHT_VERFUEGBAR = ("defekt", "verloren")
VERFUEGBAR = "verfuegbar"

NAME_MAX_LAENGE = 100

PFLICHTFELDER_EXEMPLAR = {
    "gegenstand": "Bitte einen Gegenstandstyp auswählen.",
    "inventarnummer": "Bitte eine Inventarnummer angeben.",
    "zustand": "Bitte einen Zustand auswählen.",
    "verfuegbarkeitsstatus": "Bitte einen Verfügbarkeitsstatus auswählen.",
}

PFLICHTFELDER_TYP = {
    "name": "Bitte einen Namen angeben.",
    "beschreibung": "Bitte eine Beschreibung angeben.",
    "kategorie": "Bitte eine Kategorie auswählen.",
    "standort": "Bitte einen Standort auswählen.",
    "maximale_ausleihzeit": "Bitte eine maximale Ausleihzeit angeben.",
}

# Codes für abgelehnte Löschungen (der Controller antwortet dann mit 409)
LETZTES_EXEMPLAR = "LETZTES_EXEMPLAR"
ANFRAGEN_VORHANDEN = "ANFRAGEN_VORHANDEN"


class RegelVerstoss(Exception):
    """Eine fachliche Regel ist nicht erfüllt.

    Zwei Arten:
    - feldfehler: {"feldname": ["Meldung"]}  → Eingabe falsch  (Controller: 400)
    - code + meldung                        → Aktion verboten (Controller: 409)
    """

    def __init__(self, feldfehler=None, code=None, meldung=None):
        self.feldfehler = feldfehler or {}
        self.code = code
        self.meldung = meldung
        super().__init__(meldung or feldfehler)


# --- Einzelne Regeln (geben Feldfehler zurück, werfen nicht) ----------------

def _ist_leer(wert):
    return wert is None or (isinstance(wert, str) and not wert.strip())


def pruefe_pflichtfelder(daten, pflichtfelder):
    """Alle Pflichtfelder müssen ausgefüllt sein."""
    return {
        feld: [meldung]
        for feld, meldung in pflichtfelder.items()
        if _ist_leer(daten.get(feld))
    }


def pruefe_name(name):
    """Der Name eines Gegenstandstyps hat höchstens 100 Zeichen."""
    if name is not None and len(name) > NAME_MAX_LAENGE:
        return {"name": [f"Der Name darf höchstens {NAME_MAX_LAENGE} Zeichen haben."]}
    return {}


def pruefe_zustand_verfuegbarkeit(zustand, verfuegbarkeitsstatus):
    """Ein defektes oder verlorenes Exemplar darf nicht verfügbar sein."""
    if zustand in ZUSTAENDE_NICHT_VERFUEGBAR and verfuegbarkeitsstatus == VERFUEGBAR:
        return {"verfuegbarkeitsstatus": [
            "Ein defektes oder verlorenes Exemplar kann nicht verfügbar sein."
        ]}
    return {}


def _werfen_wenn_fehler(fehler):
    if fehler:
        raise RegelVerstoss(feldfehler=fehler)


# --- Regeln je Anwendungsfall (werfen RegelVerstoss) -------------------------

def pruefe_exemplar_anlegen(daten):
    """Regeln beim Anlegen eines Exemplars. Sammelt alle Fehler auf einmal."""
    fehler = pruefe_pflichtfelder(daten, PFLICHTFELDER_EXEMPLAR)
    fehler.update(pruefe_zustand_verfuegbarkeit(
        daten.get("zustand"), daten.get("verfuegbarkeitsstatus")))
    _werfen_wenn_fehler(fehler)


def pruefe_exemplar_bearbeiten(bisher, aenderungen):
    """Regeln beim Bearbeiten eines Exemplars.

    `bisher` und `aenderungen` sind Dictionaries. Geprüft wird der Stand
    NACH der Änderung, also alte und neue Werte zusammen.
    """
    neu = {**bisher, **aenderungen}
    # Nur geänderte Felder auf "leer" prüfen – die übrigen waren ja schon gültig.
    fehler = pruefe_pflichtfelder(
        aenderungen,
        {k: v for k, v in PFLICHTFELDER_EXEMPLAR.items() if k in aenderungen})
    fehler.update(pruefe_zustand_verfuegbarkeit(
        neu.get("zustand"), neu.get("verfuegbarkeitsstatus")))
    _werfen_wenn_fehler(fehler)


def pruefe_typ_anlegen(daten):
    """Regeln beim Anlegen eines Gegenstandstyps mit seinen Exemplaren."""
    fehler = pruefe_pflichtfelder(daten, PFLICHTFELDER_TYP)
    fehler.update(pruefe_name(daten.get("name")))

    exemplare = daten.get("exemplare") or []
    if not exemplare:
        fehler["exemplare"] = ["Ein Gegenstandstyp braucht mindestens ein Exemplar."]
    for nr, exemplar in enumerate(exemplare):
        exemplar_fehler = pruefe_pflichtfelder(
            exemplar, {k: v for k, v in PFLICHTFELDER_EXEMPLAR.items() if k != "gegenstand"})
        exemplar_fehler.update(pruefe_zustand_verfuegbarkeit(
            exemplar.get("zustand"), exemplar.get("verfuegbarkeitsstatus")))
        if exemplar_fehler:
            fehler.setdefault("exemplare", {})[nr] = exemplar_fehler
    _werfen_wenn_fehler(fehler)


def pruefe_typ_bearbeiten(aenderungen):
    """Regeln beim Bearbeiten eines Gegenstandstyps (ohne Exemplare)."""
    fehler = pruefe_pflichtfelder(
        aenderungen, {k: v for k, v in PFLICHTFELDER_TYP.items() if k in aenderungen})
    fehler.update(pruefe_name(aenderungen.get("name")))
    _werfen_wenn_fehler(fehler)


def pruefe_exemplar_loeschung(anzahl_exemplare_im_typ):
    """Das letzte Exemplar eines Typs wird nicht einzeln gelöscht."""
    if anzahl_exemplare_im_typ <= 1:
        raise RegelVerstoss(
            code=LETZTES_EXEMPLAR,
            meldung="Das ist das letzte Exemplar dieses Typs. "
                    "Bitte stattdessen den ganzen Gegenstandstyp löschen.",
        )


def pruefe_typ_loeschung(anzahl_ausleihanfragen):
    """Ein Gegenstandstyp mit Ausleihanfragen darf nicht gelöscht werden."""
    if anzahl_ausleihanfragen > 0:
        raise RegelVerstoss(
            code=ANFRAGEN_VORHANDEN,
            meldung=f"Zu diesem Gegenstandstyp gibt es {anzahl_ausleihanfragen} "
                    "Ausleihanfrage(n). Er kann nicht gelöscht werden.",
        )