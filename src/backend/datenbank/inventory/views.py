from django.db.models import Q
from rest_framework import viewsets
from .models import (
    Gegenstandsexemplar,
    Verfuegbarkeitsstatus,
    Zustand,
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
        ).exclude(
            zustand__in=[Zustand.DEFEKT, Zustand.VERLOREN]
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
            ).exclude(
                zustand__in=[Zustand.DEFEKT, Zustand.VERLOREN]
            )

        elif verfuegbar == 'false':
            queryset = queryset.filter(
                Q(verfuegbarkeitsstatus=Verfuegbarkeitsstatus.NICHT_VERFUEGBAR)
                | Q(zustand__in=[Zustand.DEFEKT, Zustand.VERLOREN])
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