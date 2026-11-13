from rest_framework import serializers
from inventory.infrastruktur.models import Gegenstandsexemplar, Gegenstandstyp, Verfuegbarkeitsstatus, Zustand


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




class GegenstandsexemplarDetailSerializer(GegenstandsexemplarUebersichtSerializer):
    """
    Serializer für Detailansicht eines Gegenstandsexemplars
    TODO: rückgabedatum wird None zurückgeben bis Ausleihvorgang/Leihhistorie
    in lending/models.py implementiert ist
    """
    rückgabedatum = serializers.SerializerMethodField(read_only=True)

    class Meta(GegenstandsexemplarUebersichtSerializer.Meta):
        fields = GegenstandsexemplarUebersichtSerializer.Meta.fields + ['rückgabedatum']
        read_only_fields = fields

    def get_rückgabedatum(self, obj):
        """
        TODO: Wenn Ausleihvorgang implementiert ist, hier das enddatum
        des aktiven Ausleihvorgangs zurückgeben
        """
        return None


class GegenstandsexemplarAnlegenSerializer(serializers.Serializer):
    """
    Prüft beim Anlegen NUR das Format: Feld vorhanden, richtiger Datentyp,
    Wert aus der vorgegebenen Liste. Fachliche Regeln prüft die Domäne.
    """
    FEHLT = "Dieses Feld ist ein Pflichtfeld."

    gegenstand = serializers.IntegerField(error_messages={
        "required": FEHLT, "invalid": "Bitte eine gültige Typ-ID angeben."})
    inventarnummer = serializers.CharField(max_length=255, error_messages={
        "required": FEHLT, "blank": "Bitte eine Inventarnummer angeben.",
        "max_length": "Die Inventarnummer darf höchstens 255 Zeichen haben."})
    zustand = serializers.ChoiceField(choices=Zustand.choices, error_messages={
        "required": FEHLT, "invalid_choice": "Bitte einen Zustand aus der Liste wählen."})
    verfuegbarkeitsstatus = serializers.ChoiceField(
        choices=Verfuegbarkeitsstatus.choices, error_messages={
            "required": FEHLT,
            "invalid_choice": "Bitte einen Verfügbarkeitsstatus aus der Liste wählen."})


class GegenstandsexemplarBearbeitenSerializer(GegenstandsexemplarAnlegenSerializer):
    """
    Prüft beim Bearbeiten NUR das Format. Wie beim Anlegen, aber:
    - der Gegenstandstyp kann nicht geändert werden (Feld entfernt)
    - mit partial=True aufgerufen: nur die geschickten Felder werden geprüft
    """
    gegenstand = None


# --- Gegenstandstyp ----------------------------------------------------------

class GegenstandstypSerializer(serializers.ModelSerializer):
    """Ausgabe eines Typs (Liste, Detail, Antwort nach Anlegen/Bearbeiten).

    exemplare: Liste der IDs der zugehörigen Exemplare.
    """
    exemplare = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Gegenstandstyp
        fields = ["id", "name", "beschreibung", "kategorie", "standort",
                  "maximale_ausleihzeit", "exemplare"]
        read_only_fields = fields


class ExemplarImTypSerializer(GegenstandsexemplarAnlegenSerializer):
    """Ein Exemplar innerhalb von POST /typen/. Der Typ entsteht erst – daher ohne `gegenstand`."""
    gegenstand = None


class GegenstandstypAnlegenSerializer(serializers.Serializer):
    """
    Prüft beim Anlegen eines Typs NUR das Format.
    Fachlich (Name ≤ 100 Zeichen, mindestens ein Exemplar, defekt ⇒ nicht verfügbar)
    entscheidet die Domäne. Beschreibung ist hier optional – ob sie Pflicht ist,
    legt die Domäne fest.
    """
    FEHLT = "Dieses Feld ist ein Pflichtfeld."

    name = serializers.CharField(error_messages={
        "required": FEHLT, "blank": "Bitte einen Namen angeben."})
    beschreibung = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    kategorie = serializers.IntegerField(error_messages={
        "required": FEHLT, "invalid": "Bitte eine gültige Kategorie-ID angeben."})
    standort = serializers.IntegerField(error_messages={
        "required": FEHLT, "invalid": "Bitte eine gültige Standort-ID angeben."})
    maximale_ausleihzeit = serializers.IntegerField(min_value=1, error_messages={
        "required": FEHLT, "invalid": "Bitte eine ganze Zahl (Tage) angeben.",
        "min_value": "Die maximale Ausleihzeit muss mindestens 1 Tag sein."})
    exemplare = ExemplarImTypSerializer(many=True, error_messages={
        "required": FEHLT, "not_a_list": "Bitte eine Liste von Exemplaren schicken."})


class GegenstandstypBearbeitenSerializer(GegenstandstypAnlegenSerializer):
    """
    Wie beim Anlegen, aber ohne Exemplare (die werden einzeln bearbeitet).
    Mit partial=True aufgerufen: nur die geschickten Felder werden geprüft.
    """
    exemplare = None