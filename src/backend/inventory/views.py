from django.shortcuts import render
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Gegenstandsexemplar, Verfuegbarkeitsstatus
from .serializers import GegenstandsexemplarSerializer, StatusOverviewSerializer


class GegenstandsexemplarViewSet(viewsets.ModelViewSet):
    """
    ViewSet für Gegenstandsexemplare mit Status-Filterung
    
    API Endpoints:
    - GET /api/inventory/exemplare/ - Alle Exemplare
    - GET /api/inventory/exemplare/?verfuegbarkeitsstatus=verfuegbar - Filtern
    - GET /api/inventory/exemplare/verfuegbar/ - Nur verfügbare
    - GET /api/inventory/exemplare/status_overview/ - Status-Statistik
    """
    
    queryset = Gegenstandsexemplar.objects.select_related('gegenstand').all()
    serializer_class = GegenstandsexemplarSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    filterset_fields = ['verfuegbarkeitsstatus', 'zustand', 'gegenstand']
    search_fields = ['inventarnummer']
    ordering_fields = ['inventarnummer', 'erstellt_am']
    
    @action(detail=False, methods=['get'])
    def verfuegbar(self, request):
        """Nur verfügbare Gegenstandsexemplare"""
        exemplare = self.get_queryset().filter(
            verfuegbarkeitsstatus=Verfuegbarkeitsstatus.VERFUEGBAR
        )
        serializer = self.get_serializer(exemplare, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ausgeliehen(self, request):
        """Nur ausgeliehene Gegenstandsexemplare"""
        exemplare = self.get_queryset().filter(
            verfuegbarkeitsstatus=Verfuegbarkeitsstatus.AUSGELIEHEN
        )
        serializer = self.get_serializer(exemplare, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def status_overview(self, request):
        """
        Statistik über alle Verfügbarkeitsstatus-Werte
        
        Response Beispiel:
        [
            {"status": "verfuegbar", "label": "Verfügbar", "count": 15},
            {"status": "ausgeliehen", "label": "Ausgeliehen", "count": 8},
            ...
        ]
        """
        overview = []
        for status_choice in Verfuegbarkeitsstatus.choices:
            status_code = status_choice[0]
            count = Gegenstandsexemplar.objects.filter(
                verfuegbarkeitsstatus=status_code
            ).count()
            overview.append({
                'status': status_code,
                'label': status_choice[1],
                'count': count
            })
        return Response(overview)
