from django.db.models import Q, Count
from django.core.exceptions import ObjectDoesNotExist
from .models import Reservierung, Reservierungsstatus
from inventory.models import Gegenstandsexemplar, Verfuegbarkeitsstatus

def pruefe_exemplar_verfuegbarkeit(exemplar_id, startdatum, enddatum):
    """
    API 1: Prüft, ob ein einzelnes Exemplar im Zeitraum frei ist.
    
    Prüft:
    1. Existiert das Exemplar?
    2. Hat es den Status 'verfuegbar'?
    3. Gibt es zeitliche Überschneidungen mit bestätigten Reservierungen?
    
    Returns:
        dict: Mit 'ist_verfuegbar' (bool) und optional 'grund' (str)
    """
    # 1. Prüfung: Existiert das Exemplar und ist es verfügbar?
    try:
        exemplar = Gegenstandsexemplar.objects.get(id=exemplar_id)
    except ObjectDoesNotExist:
        return {
            'ist_verfuegbar': False,
            'grund': f'Gegenstandsexemplar mit ID {exemplar_id} existiert nicht.'
        }

    # Prüfe den physischen Status (nicht defekt, nicht verloren)
    if exemplar.verfuegbarkeitsstatus != Verfuegbarkeitsstatus.VERFUEGBAR:
        return {
            'ist_verfuegbar': False,
            'grund': f'Das Exemplar ist nicht verfügbar (Status: {exemplar.get_verfuegbarkeitsstatus_display()}).'
        }

    # 2. Prüfung: Zeitliche Überschneidung mit Reservierungen
    # Wir suchen nach Reservierungen, die den Status BESTAETIGT haben.
    # Überschneidungslogik: (Reservierung-Start <= Gewünschtes-Ende) UND (Reservierung-Ende >= Gewünschtes-Start)
    ueberschneidung = Reservierung.objects.filter(
        gegenstandsexemplar_id=exemplar_id
    ).filter(
        Q(startdatum__lte=enddatum) & Q(enddatum__gte=startdatum)
    ).exists()

    if ueberschneidung:
        return {
            'ist_verfuegbar': False,
            'grund': 'Das Exemplar ist in diesem Zeitraum bereits reserviert.'
        }

    # Wenn alle Prüfungen bestanden sind
    return {
        'ist_verfuegbar': True,
        'grund': 'Verfügbar'
    }


def hole_verfuegbare_typen_im_zeitraum(startdatum, enddatum, organisation_id=None):
    """
    API 2: Gibt alle Gegenstandstypen zurück, die mindestens ein freies Exemplar haben.
    Berücksichtigt dabei den Status 'verfuegbar' und Reservierungen.
    """
    # 1. IDs aller Exemplare finden, die im Zeitraum BELEGT sind (bestätigte Reservierung)
    belegte_exemplare_ids = Reservierung.objects.filter(
        Q(startdatum__lte=enddatum) & Q(enddatum__gte=startdatum)
    ).values_list('gegenstandsexemplar_id', flat=True)

    # 2. Alle Exemplare finden, die:
    #    a) NICHT in der Liste der belegten Exemplare sind
    #    b) Den Status 'verfuegbar' haben
    freie_exemplare = Gegenstandsexemplar.objects.exclude(
        id__in=belegte_exemplare_ids
    ).filter(
        verfuegbarkeitsstatus=Verfuegbarkeitsstatus.VERFUEGBAR
    )

    # Optional: Nach Organisation filtern
    if organisation_id:
        freie_exemplare = freie_exemplare.filter(gegenstand__organisation_id=organisation_id)

    # 3. Gruppieren nach Gegenstandstyp und zählen
    verfuegbare_typen = freie_exemplare.values(
        'gegenstand__id',
        'gegenstand__name',
        'gegenstand__beschreibung',
        'gegenstand__organisation__name'
    ).annotate(
        anzahl_verfuegbar=Count('id')
    ).order_by('gegenstand__name')

    return list(verfuegbare_typen)