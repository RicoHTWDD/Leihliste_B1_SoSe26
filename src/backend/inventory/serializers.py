from rest_framework import serializers
from .models import Gegenstandsexemplar, Verfuegbarkeitsstatus


class GegenstandsexemplarSerializer(serializers.ModelSerializer):
    """Serializer für Gegenstandsexemplar mit Status"""
    
    verfuegbarkeitsstatus_display = serializers.SerializerMethodField(read_only=True)
    ist_verfuegbar = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Gegenstandsexemplar
        fields = [
            'id',
            'inventarnummer',
            'gegenstand',
            'zustand',
            'verfuegbarkeitsstatus',
            'verfuegbarkeitsstatus_display',
            'ist_verfuegbar',
            'erstellt_am',
            'aktualisiert_am'
        ]
        read_only_fields = ['erstellt_am', 'aktualisiert_am']
    
    def get_verfuegbarkeitsstatus_display(self, obj):
        """Gibt den lesbaren Status-Namen zurück"""
        return obj.get_verfuegbarkeitsstatus_display()
    
    def get_ist_verfuegbar(self, obj):
        """Hilfsmethode für Verfügbarkeitsprüfung"""
        return obj.verfuegbarkeitsstatus == Verfuegbarkeitsstatus.VERFUEGBAR


class StatusOverviewSerializer(serializers.Serializer):
    """Serializer für Status-Übersicht"""
    status = serializers.CharField()
    label = serializers.CharField()
    count = serializers.IntegerField()