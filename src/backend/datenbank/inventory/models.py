"""
Weiterleitung – bitte hier KEINE Models schreiben.

Django sucht die Models einer App immer in `inventory/models.py`.
Die echten Models liegen in der Schicht Infrastruktur: `infrastruktur/models.py`.
Ohne diese Weiterleitung würde Django die Tabellen nicht finden
(makemigrations würde sie löschen wollen, `lending` fände `inventory.Gegenstandstyp` nicht).
"""
from .infrastruktur.models import (  # noqa: F401
    Gegenstandsexemplar,
    Gegenstandstyp,
    Kategorie,
    Standort,
    Verfuegbarkeitsstatus,
    Zustand,
)
