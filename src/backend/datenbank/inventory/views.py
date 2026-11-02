from rest_framework import viewsets
from .models import (
    Gegenstandsexemplar,
    Verfuegbarkeitsstatus,
)
from .serializers import (
    GegenstandsexemplarUebersichtSerializer,
    VerfügbareGegenstandsexemplarSerializer,
    GegenstandsexemplarDetailSerializer,
)


class VerfügbareGegenstandsexemplarViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet für den separaten Endpunkt verfügbarer Exemplare.

    GET /api/inventory/verfuegbare-exemplare/
    """

    serializer_class = VerfügbareGegenstandsexemplarSerializer

    def get_queryset(self):
        return Gegenstandsexemplar.objects.filter(
            verfuegbarkeitsstatus=Verfuegbarkeitsstatus.VERFUEGBAR
        ).select_related(
            'gegenstand',
            'gegenstand__standort',
            'gegenstand__kategorie',
        ).order_by(
            'gegenstand__name',
            'inventarnummer',
        )


class GegenstandsexemplarViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet für alle Gegenstandsexemplare.

    Ohne Filter:
        GET /api/inventory/alle-exemplare/

    Nur verfügbare Exemplare:
        GET /api/inventory/alle-exemplare/?verfuegbar=true

    Nur nicht verfügbare Exemplare:
        GET /api/inventory/alle-exemplare/?verfuegbar=false
    """

    serializer_class = GegenstandsexemplarUebersichtSerializer

    def get_queryset(self):
        queryset = Gegenstandsexemplar.objects.select_related(
            'gegenstand',
            'gegenstand__standort',
            'gegenstand__kategorie',
        ).order_by(
            'gegenstand__name',
            'inventarnummer',
        )

        verfuegbar = self.request.query_params.get('verfuegbar')

        if verfuegbar == 'true':
            queryset = queryset.filter(
                verfuegbarkeitsstatus=Verfuegbarkeitsstatus.VERFUEGBAR
            )
        elif verfuegbar == 'false':
            queryset = queryset.exclude(
                verfuegbarkeitsstatus=Verfuegbarkeitsstatus.VERFUEGBAR
            )

        return queryset


class GegenstandsexemplarDetailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet für die Detailansicht eines Gegenstandsexemplars.

    GET /api/inventory/exemplare/{id}/
    """

    serializer_class = GegenstandsexemplarDetailSerializer

    queryset = Gegenstandsexemplar.objects.select_related(
        'gegenstand',
        'gegenstand__standort',
        'gegenstand__kategorie',
    ).all()