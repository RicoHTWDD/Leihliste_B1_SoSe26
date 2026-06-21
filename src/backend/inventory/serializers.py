from rest_framework import serializers
from .models import Gegenstandsexemplar


class VerfügbareGegenstandsexemplarSerializer(serializers.ModelSerializer):
    """
    Serializer für verfügbare Gegenstandsexemplare
    WICHTIG: Standort und Kategorie werden vom Gegenstandstyp abgeleitet!
    Datenmodell:
    Gegenstandsexemplar → Gegenstandstyp → Standort
                                      → Kategorie    
    Enthält: Name, Zustand, Inventarnummer, Gegenstandstyp, Standort, Kategorie
    """
    
    # === Vom Gegenstandstyp abgeleitete Felder ===
    
    # Name des Gegenstandstyps
    name = serializers.CharField(
        source='gegenstand.name',  # ← Von Gegenstandstyp
        read_only=True
    )
    
    # Standort des Gegenstandstyps
    standort = serializers.CharField(
        source='gegenstand.standort.name',  # ← Von Gegenstandstyp.Standort
        read_only=True,
        default='Nicht zugewiesen'
    )
    
    # Kategorie des Gegenstandstyps
    kategorie = serializers.CharField(
        source='gegenstand.kategorie.name',  # ← Von Gegenstandstyp.Kategorie
        read_only=True,
        default='Nicht kategorisiert'
    )
    
    # Gegenstandstyp-ID
    gegenstandstyp = serializers.IntegerField(
        source='gegenstand.id',  # ← Gegenstandstyp-ID
        read_only=True
    )
    
    # === Eigene Felder des Gegenstandsexemplars ===
    
    # Zustand (Display-Wert)
    zustand_display = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Gegenstandsexemplar
        fields = [
            'id',
            'inventarnummer',      # Eigene Felder
            'name',                # Von Gegenstandstyp
            'zustand',             # Eigene Felder
            'zustand_display',     # Eigene Felder (Method)
            'gegenstandstyp',      # Von Gegenstandstyp
            'standort',            # Von Gegenstandstyp.Standort
            'kategorie',           # Von Gegenstandstyp.Kategorie
        ]
        read_only_fields = fields
    
    def get_zustand_display(self, obj):
        """Gibt den lesbaren Zustands-Namen zurück"""
        return obj.get_zustand_display()


class GegenstandsexemplarUebersichtSerializer(serializers.ModelSerializer):
    """
    Serializer für Gegenstandsexemplare-Übersicht (ALLE Exemplare)
    
    WICHTIG: Standort und Kategorie werden vom Gegenstandstyp abgeleitet!
    
    Datenmodell:
    Gegenstandsexemplar → Gegenstandstyp → Standort
                                      → Kategorie
    
    Enthält: Name, Verfügbarkeitsstatus, Zustand, Inventarnummer, 
             Gegenstandstyp, Standort, Kategorie
    """
    
    # === Vom Gegenstandstyp abgeleitete Felder ===
    
    # Name des Gegenstandstyps
    name = serializers.CharField(
        source='gegenstand.name',
        read_only=True
    )
    
    # Standort des Gegenstandstyps
    standort = serializers.CharField(
        source='gegenstand.standort.name',
        read_only=True,
        default='Nicht zugewiesen'
    )
    
    # Kategorie des Gegenstandstyps
    kategorie = serializers.CharField(
        source='gegenstand.kategorie.name',
        read_only=True,
        default='Nicht kategorisiert'
    )
    
    # Gegenstandstyp-ID
    gegenstandstyp = serializers.IntegerField(
        source='gegenstand.id',
        read_only=True
    )
    
    # === Eigene Felder des Gegenstandsexemplars ===
    
    # Verfügbarkeitsstatus (Display-Wert)
    verfuegbarkeitsstatus_display = serializers.SerializerMethodField(read_only=True)
    
    # Zustand (Display-Wert)
    zustand_display = serializers.SerializerMethodField(read_only=True)
    
 #   # Hilfsfeld für Verfügbarkeit (Boolean)
#   ist_verfuegbar = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Gegenstandsexemplar
        fields = [
            # Basis-Informationen
            'id',
            'inventarnummer',
            
            # Vom Gegenstandstyp abgeleitet
            'name',
            'gegenstandstyp',
            'standort',
            'kategorie',
            
            # Status-Informationen
            'verfuegbarkeitsstatus',
            'verfuegbarkeitsstatus_display',
            'zustand',
            'zustand_display',
            
            # Metadaten
            'erstellt_am',
            'aktualisiert_am'
        ]
        read_only_fields = fields
    
    # === Helper Methods ===
    
    def get_verfuegbarkeitsstatus_display(self, obj):
        """Gibt den lesbaren Verfügbarkeitsstatus zurück"""
        return obj.get_verfuegbarkeitsstatus_display()
    
    def get_zustand_display(self, obj):
        """Gibt den lesbaren Zustands-Namen zurück"""
        return obj.get_zustand_display()