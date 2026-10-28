from rest_framework import viewsets
from .models import Gegenstandsexemplar, Verfuegbarkeitsstatus
from .serializers import GegenstandsexemplarUebersichtSerializer, VerfügbareGegenstandsexemplarSerializer, GegenstandsexemplarDetailSerializer

class VerfügbareGegenstandsexemplarViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet für verfügbare Gegenstandsexemplare
    
    WICHTIG: Standort und Kategorie werden über den Gegenstandstyp aufgelöst!
    
    API Endpoints:
    - GET /api/inventory/exemplare/verfuegbar/ - Alle verfügbaren Exemplare
    """
    
    serializer_class = VerfügbareGegenstandsexemplarSerializer
   
    def get_queryset(self):
        queryset = Gegenstandsexemplar.objects.select_related(
            'gegenstand',
            'gegenstand__standort',
            'gegenstand__kategorie',
        ).order_by(
            'gegenstand__name',
            'inventarnummer',
        )
        
        verfuegbar = self.request.query_params.get(verfuegbar)
        
        if verfuegbar == 'true':
            queryset = queryset.filter(
                Verfuegbarkeitsstatus=Verfuegbarkeitsstatus.VERFUEGBAR
            )
        
        return queryset


class GegenstandsexemplarViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet für Gegenstandsexemplare-Übersicht (ALLE Exemplare)
    
    WICHTIG: Standort und Kategorie werden über den Gegenstandstyp aufgelöst!
    
    API Endpoints:
    - GET /api/inventory/exemplare/ - Alle Exemplare (unabhängig vom Status)
    """
    
    queryset = Gegenstandsexemplar.objects.select_related(
        'gegenstand',              # ← JOIN mit Gegenstandstyp
        'gegenstand__standort',    # ← JOIN mit Standort (über Gegenstandstyp)
        'gegenstand__kategorie'    # ← JOIN mit Kategorie (über Gegenstandstyp)
    ).order_by(
        'gegenstand__name',
        'inventarnummer'
    ).all()
    
    serializer_class = GegenstandsexemplarUebersichtSerializer

    # Detail-Endpunkt für ein einzelnes Gegenstandsexemplar

class GegenstandsexemplarDetailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet für Detailansicht eines Gegenstandsexemplars
    
    API Endpoints:
    - GET /api/inventory/exemplare/{id}/ - Detail eines Exemplars
    """
    serializer_class = GegenstandsexemplarDetailSerializer
    queryset = Gegenstandsexemplar.objects.select_related(
        'gegenstand',
        'gegenstand__standort',
        'gegenstand__kategorie'
    ).all()