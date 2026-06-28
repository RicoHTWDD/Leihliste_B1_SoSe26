from django.shortcuts import render
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Ausleihanfrage, Anfragestatus
from .serializers import AusleihanfrageSerializer, AnfrageStatusOverviewSerializer


class AusleihanfrageViewSet(viewsets.ModelViewSet):
    """
    ViewSet für Ausleihanfragen mit Status-Filterung
    
    API Endpoints:
    - GET /api/lending/anfragen/ - Alle Anfragen
    - GET /api/lending/anfragen/?anfragestatus=eingereicht - Filtern
    - GET /api/lending/anfragen/offen/ - Nur offene Anfragen
    - GET /api/lending/anfragen/genehmigt/ - Nur genehmigte Anfragen
    - GET /api/lending/anfragen/status_overview/ - Status-Statistik
    - GET /api/lending/anfragen/meine_anfragen/  - Alle Ausleihanfragen der eingeloggten Nutzer
    - PATCH /api/lending/anfragen/{id}/update_status/ - Status ändern
    """
    
    queryset = Ausleihanfrage.objects.select_related(
        'nutzer', 'gegenstand', 'organisation'
    ).all()
    serializer_class = AusleihanfrageSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    filterset_fields = ['anfragestatus', 'organisation', 'nutzer', 'gegenstand']
    search_fields = ['nutzer__vollstaendiger_name', 'nutzer__email', 'gegenstand__name']
    ordering_fields = ['erstellt_am', 'startdatum', 'enddatum']

    # Sicherstellung dass der Nutzer seine eigene Ausleihanfrage sieht, nicht die eines anderen
    def get_queryset(self):
        """Filtert Anfragen auf die eingeloggte Nutzerin (Mapping User -> Nutzer per E-Mail)"""
        from users.models import Nutzer
        basis = Ausleihanfrage.objects.select_related(
            'nutzer', 'gegenstand', 'organisation'
        )
        nutzer = Nutzer.objects.filter(email=self.request.user.email).first()
        if nutzer is None:
            return basis.none()
        return basis.filter(nutzer=nutzer)

    @action(detail=False, methods=['get'])

    #Die konkrete URL die das Frontend aufruft
    #Gibt alle Ausleihanfragen der eingeloggten Nutzerin zurück als JSON — mit Status und Zeitraum
    def meine_anfragen(self, request):
        """
        Alle Ausleihanfragen der eingeloggten Nutzerin
        GET /api/lending/anfragen/meine_anfragen/
        """
        anfragen = self.get_queryset()
        serializer = self.get_serializer(anfragen, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def offen(self, request):
        """
        Nur offene Anfragen (eingereicht oder in Bearbeitung)
        """
        anfragen = self.get_queryset().filter(
            anfragestatus__in=[
                Anfragestatus.EINGEREICHT,
                # Anfragestatus.IN_BEARBEITUNG  # Falls benötigt
            ]
        )
        serializer = self.get_serializer(anfragen, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def genehmigt(self, request):
        """Nur genehmigte Anfragen"""
        anfragen = self.get_queryset().filter(
            anfragestatus=Anfragestatus.GENEHMIGT
        )
        serializer = self.get_serializer(anfragen, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def abgelehnt(self, request):
        """Nur abgelehnte Anfragen"""
        anfragen = self.get_queryset().filter(
            anfragestatus__in=[
                Anfragestatus.ABGELEHNT,
                Anfragestatus.TEILWEISE_ABGELEHNT
            ]
        )
        serializer = self.get_serializer(anfragen, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def status_overview(self, request):
        """
        Statistik über alle Anfragestatus-Werte
        
        Response Beispiel:
        [
            {"status": "eingereicht", "label": "Eingereicht", "count": 5},
            {"status": "genehmigt", "label": "Genehmigt", "count": 12},
            {"status": "abgelehnt", "label": "Abgelehnt", "count": 3},
            ...
        ]
        """
        overview = []
        for status_choice in Anfragestatus.choices:
            status_code = status_choice[0]
            count = Ausleihanfrage.objects.filter(
                anfragestatus=status_code
            ).count()
            overview.append({
                'status': status_code,
                'label': status_choice[1],
                'count': count
            })
        return Response(overview)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Status einer Ausleihanfrage aktualisieren
        
        Body: {"anfragestatus": "genehmigt"}
        
        Optional: ablehnungsgrund bei Ablehnung
        Body: {"anfragestatus": "abgelehnt", "ablehnungsgrund": "Grund..."}
        """
        anfrage = self.get_object()
        new_status = request.data.get('anfragestatus')
        
        if new_status not in Anfragestatus.values:
            return Response(
                {
                    'error': f'Ungültiger Status. Erlaubt: {Anfragestatus.values}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validierung: Ablehnungsgrund bei Ablehnung erforderlich
        if new_status in [Anfragestatus.ABGELEHNT, Anfragestatus.TEILWEISE_ABGELEHNT]:
            ablehnungsgrund = request.data.get('ablehnungsgrund')
            if not ablehnungsgrund:
                return Response(
                    {'error': 'Ablehnungsgrund ist bei Ablehnung erforderlich'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            anfrage.ablehnungsgrund = ablehnungsgrund
        
        anfrage.anfragestatus = new_status
        anfrage.save()
        
        return Response(self.get_serializer(anfrage).data)
    
    @action(detail=True, methods=['post'])
    def genehmigen(self, request, pk=None):
        """Anfrage genehmigen (Shortcut)"""
        anfrage = self.get_object()
        anfrage.anfragestatus = Anfragestatus.GENEHMIGT
        anfrage.save()
        return Response(self.get_serializer(anfrage).data)
    
    @action(detail=True, methods=['post'])
    def ablehnen(self, request, pk=None):
        """Anfrage ablehnen (Shortcut)"""
        anfrage = self.get_object()
        ablehnungsgrund = request.data.get('ablehnungsgrund', '')
        
        if not ablehnungsgrund:
            return Response(
                {'error': 'Ablehnungsgrund ist erforderlich'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        anfrage.anfragestatus = Anfragestatus.ABGELEHNT
        anfrage.ablehnungsgrund = ablehnungsgrund
        anfrage.save()
        
        return Response(self.get_serializer(anfrage).data)