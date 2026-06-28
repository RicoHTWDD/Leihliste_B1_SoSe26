from rest_framework import viewsets
from .models import Gegenstandsexemplar, Verfuegbarkeitsstatus
from .serializers import GegenstandsexemplarUebersichtSerializer, VerfügbareGegenstandsexemplarSerializer

class VerfügbareGegenstandsexemplarViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet für verfügbare Gegenstandsexemplare
    
    WICHTIG: Standort und Kategorie werden über den Gegenstandstyp aufgelöst!
    
    API Endpoints:
    - GET /api/inventory/exemplare/verfuegbar/ - Alle verfügbaren Exemplare
    """
    
    serializer_class = VerfügbareGegenstandsexemplarSerializer
   
    def get_queryset(self):
        """
        Nur verfügbare Gegenstandsexemplare zurückgeben
        
        WICHTIG: select_related optimiert die Abfrage durch JOINs:
        - gegenstand (Gegenstandstyp)
        - gegenstand__standort (Standort vom Gegenstandstyp)
        - gegenstand__kategorie (Kategorie vom Gegenstandstyp)
        
        Dadurch werden N+1 Query-Probleme vermieden!
        """
        return Gegenstandsexemplar.objects.filter(
            verfuegbarkeitsstatus=Verfuegbarkeitsstatus.VERFUEGBAR
        ).select_related(
            'gegenstand',              # ← JOIN mit Gegenstandstyp
            'gegenstand__standort',    # ← JOIN mit Standort (über Gegenstandstyp)
            'gegenstand__kategorie'    # ← JOIN mit Kategorie (über Gegenstandstyp)
        ).order_by(
            'gegenstand__name',
            'inventarnummer'
        )

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

class GegenstandsexemplarDetailViewSet(viewsets.ReadOnlyModelViewSet):
    """Detailansicht eines einzelnen Exemplars - inkl. verfuegbarkeitsstatus."""
    queryset = Gegenstandsexemplar.objects.select_related(
        "gegenstand", "gegenstand__standort", "gegenstand__kategorie"
    ).all()
    serializer_class = GegenstandsexemplarUebersichtSerializer