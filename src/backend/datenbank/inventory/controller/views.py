"""
Controller: nimmt HTTP-Anfragen an und gibt die Antwort zurück.

Kennt keine Models. Daten kommen ausschließlich über den Service.
Standort und Kategorie werden im Serializer über den Gegenstandstyp aufgelöst.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response

from inventory.controller.serializers import (
    GegenstandsexemplarAnlegenSerializer,
    GegenstandsexemplarBearbeitenSerializer,
    GegenstandsexemplarDetailSerializer,
    GegenstandsexemplarUebersichtSerializer,
    GegenstandstypAnlegenSerializer,
    GegenstandstypBearbeitenSerializer,
    GegenstandstypSerializer,
    VerfügbareGegenstandsexemplarSerializer,
)
from inventory.service import exemplare, typen


class VerfügbareGegenstandsexemplarViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/inventory/verfuegbare-exemplare/ – nur verfügbare Exemplare"""

    serializer_class = VerfügbareGegenstandsexemplarSerializer

    def get_queryset(self):
        return exemplare.verfuegbare_lesen()


class GegenstandsexemplarViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/inventory/alle-exemplare/ – alle Exemplare (Übersicht)"""

    serializer_class = GegenstandsexemplarUebersichtSerializer

    def get_queryset(self):
        return exemplare.alle_lesen()


class GegenstandsexemplarDetailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET    /api/inventory/exemplare/{id}/ – Detail eines Exemplars
    POST   /api/inventory/exemplare/      – Exemplar anlegen
    PATCH  /api/inventory/exemplare/{id}/ – Exemplar bearbeiten
    DELETE /api/inventory/exemplare/{id}/ – Exemplar löschen
    """

    serializer_class = GegenstandsexemplarDetailSerializer

    def get_queryset(self):
        return exemplare.alle_lesen()

    def create(self, request):
        # 1. Format prüfen (Serializer) – Fehler → 400
        eingabe = GegenstandsexemplarAnlegenSerializer(data=request.data)
        eingabe.is_valid(raise_exception=True)

        # 2. Service aufrufen – fachliche Ablehnung → 400 mit Feldname
        try:
            exemplar = exemplare.anlegen(eingabe.validated_data)
        except exemplare.RegelVerstoss as verstoss:
            return Response(verstoss.feldfehler, status=status.HTTP_400_BAD_REQUEST)

        # 3. Erfolg → 201 mit dem neuen Exemplar
        return Response(GegenstandsexemplarDetailSerializer(exemplar).data,
                        status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        # 1. Format prüfen (nur die geschickten Felder) – Fehler → 400
        eingabe = GegenstandsexemplarBearbeitenSerializer(data=request.data, partial=True)
        eingabe.is_valid(raise_exception=True)

        # 2. Service aufrufen – fachliche Ablehnung → 400 mit Feldname
        try:
            exemplar = exemplare.bearbeiten(pk, eingabe.validated_data)
        except exemplare.RegelVerstoss as verstoss:
            return Response(verstoss.feldfehler, status=status.HTTP_400_BAD_REQUEST)

        # 3. Nicht gefunden → 404, sonst 200 mit dem geänderten Exemplar
        if exemplar is None:
            return Response({"detail": "Dieses Exemplar gibt es nicht."},
                            status=status.HTTP_404_NOT_FOUND)
        return Response(GegenstandsexemplarDetailSerializer(exemplar).data)

    def destroy(self, request, pk=None):
        # 1. Service aufrufen – fachlich verboten → 409 mit Code und Meldung
        try:
            geloescht = exemplare.loeschen(pk)
        except exemplare.RegelVerstoss as verstoss:
            return Response({"code": verstoss.code, "meldung": verstoss.meldung},
                            status=status.HTTP_409_CONFLICT)

        # 2. Nicht gefunden → 404, sonst 204 (gelöscht, keine Daten zurück)
        if not geloescht:
            return Response({"detail": "Dieses Exemplar gibt es nicht."},
                            status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class GegenstandstypViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET    /api/inventory/typen/       – alle Typen
    GET    /api/inventory/typen/{id}/  – Detail eines Typs
    POST   /api/inventory/typen/       – Typ mit mindestens einem Exemplar anlegen
    PATCH  /api/inventory/typen/{id}/  – Typ bearbeiten (ohne Exemplare)
    DELETE /api/inventory/typen/{id}/  – Typ mit allen Exemplaren löschen
    """

    serializer_class = GegenstandstypSerializer

    def get_queryset(self):
        return typen.alle_lesen()

    def create(self, request):
        # 1. Format prüfen – Fehler → 400
        eingabe = GegenstandstypAnlegenSerializer(data=request.data)
        eingabe.is_valid(raise_exception=True)

        # 2. Service aufrufen – fachliche Ablehnung → 400 mit Feldname
        try:
            typ = typen.anlegen(eingabe.validated_data)
        except typen.RegelVerstoss as verstoss:
            return Response(verstoss.feldfehler, status=status.HTTP_400_BAD_REQUEST)

        # 3. Erfolg → 201 mit dem neuen Typ
        return Response(GegenstandstypSerializer(typ).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        # 1. Format prüfen (nur die geschickten Felder) – Fehler → 400
        eingabe = GegenstandstypBearbeitenSerializer(data=request.data, partial=True)
        eingabe.is_valid(raise_exception=True)

        # 2. Service aufrufen – fachliche Ablehnung → 400 mit Feldname
        try:
            typ = typen.bearbeiten(pk, eingabe.validated_data)
        except typen.RegelVerstoss as verstoss:
            return Response(verstoss.feldfehler, status=status.HTTP_400_BAD_REQUEST)

        # 3. Nicht gefunden → 404, sonst 200
        if typ is None:
            return Response({"detail": "Diesen Gegenstandstyp gibt es nicht."},
                            status=status.HTTP_404_NOT_FOUND)
        return Response(GegenstandstypSerializer(typ).data)

    def destroy(self, request, pk=None):
        # 1. Service aufrufen – fachlich verboten → 409 mit Code und Meldung
        try:
            geloescht = typen.loeschen(pk)
        except typen.RegelVerstoss as verstoss:
            return Response({"code": verstoss.code, "meldung": verstoss.meldung},
                            status=status.HTTP_409_CONFLICT)

        # 2. Nicht gefunden → 404, sonst 204
        if not geloescht:
            return Response({"detail": "Diesen Gegenstandstyp gibt es nicht."},
                            status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)