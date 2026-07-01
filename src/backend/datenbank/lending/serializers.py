from rest_framework import serializers
from .models import Ausleihanfrage, Anfragestatus


class AusleihanfrageSerializer(serializers.ModelSerializer):
    """Serializer für Ausleihanfragen mit Status"""
    
    anfragestatus_display = serializers.SerializerMethodField(read_only=True)
    nutzer_name = serializers.CharField(source='nutzer.vollstaendiger_name', read_only=True)
    nutzer_email = serializers.EmailField(source='nutzer.email', read_only=True)
    gegenstand_name = serializers.CharField(source='gegenstand.name', read_only=True)
    organisation_name = serializers.CharField(source='organisation.name', read_only=True)
    
    class Meta:
        model = Ausleihanfrage
        fields = [
            'id',
            'nutzer',
            'nutzer_name',
            'nutzer_email',
            'gegenstand',
            'gegenstand_name',
            'organisation',
            'organisation_name',
            'startdatum',
            'enddatum',
            'anfragestatus',
            'anfragestatus_display',
            'ablehnungsgrund',
            'bedingungen_akzeptiert',
            'erstellt_am',
            'aktualisiert_am'
        ]
        read_only_fields = [
            'erstellt_am',
            'aktualisiert_am',
            'nutzer',
            'organisation',
            'anfragestatus',
        ]
    
    def get_anfragestatus_display(self, obj):
        """Gibt den lesbaren Status-Namen zurück"""
        return obj.get_anfragestatus_display()


class AnfrageStatusOverviewSerializer(serializers.Serializer):
    """Serializer für Status-Übersicht"""
    status = serializers.CharField()
    label = serializers.CharField()
    count = serializers.IntegerField()