from datetime import date
from rest_framework import serializers
from .models import Ausleihanfrage


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
                'aktualisiert_am',
            ]
        read_only_fields = [
                'id',
                'nutzer',
                'organisation',
                'anfragestatus',
                'erstellt_am',
                'aktualisiert_am',
            ]
    
    def validate(self, attrs):
        startdatum = attrs.get('startdatum')
        enddatum = attrs.get('enddatum')

        if startdatum is None:
            raise serializers.ValidationError({
                'startdatum': 'Das Startdatum ist erforderlich.'
            })

        if enddatum is None:
            raise serializers.ValidationError({
                'enddatum': 'Das Rückgabedatum ist erforderlich.'
            })

        if startdatum <= date.today():
            raise serializers.ValidationError({
                'startdatum': 'Das Startdatum muss in der Zukunft liegen.'
            })

        if enddatum <= startdatum:
            raise serializers.ValidationError({
                'enddatum': (
                    'Das Rückgabedatum muss nach dem Startdatum liegen.'
                )
            })

        if not attrs.get('gegenstand'):
            raise serializers.ValidationError({
                'gegenstand': 'Ein Gegenstand muss ausgewählt werden.'
            })

        return attrs
    
    def get_anfragestatus_display(self, obj):
        """Gibt den lesbaren Status-Namen zurück"""
        return obj.get_anfragestatus_display()


class AnfrageStatusOverviewSerializer(serializers.Serializer):
    """Serializer für Status-Übersicht"""
    status = serializers.CharField()
    label = serializers.CharField()
    count = serializers.IntegerField()