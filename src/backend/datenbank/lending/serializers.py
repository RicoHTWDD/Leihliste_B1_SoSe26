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
        # Bei PATCH werden nicht mitgesendete Werte aus der bestehenden Ausleihanfrage übernommen.
        startdatum = attrs.get(
            'startdatum',
            self.instance.startdatum if self.instance else None
        )
        enddatum = attrs.get(
            'enddatum',
            self.instance.enddatum if self.instance else None
        )
        if 'gegenstand' in attrs:
            gegenstand_vorhanden = attrs['gegenstand'] is not None
        else:
            gegenstand_vorhanden = (
                self.instance is not None
                and self.instance.gegenstand_id is not None
            )

        fehler = {}

        # Pflichtfelder bei neuen Anfragen prüfen.
        if self.instance is None:
            if startdatum is None:
                fehler['startdatum'] = 'Das Startdatum ist erforderlich.'

            if enddatum is None:
                fehler['enddatum'] = 'Das Rückgabedatum ist erforderlich.'

            if not gegenstand_vorhanden:
                fehler['gegenstand'] = 'Ein Gegenstand muss ausgewählt werden.'

        # Prüfen, ob das Startdatum tatsächlich neu gesetzt oder geändert wurde.
        startdatum_geaendert = (
            self.instance is None
            or (
                'startdatum' in attrs
                and startdatum != self.instance.startdatum
            )
        )

        if (
            startdatum is not None
            and startdatum_geaendert
            and startdatum <= date.today()
        ):
            fehler['startdatum'] = (
                'Das Startdatum muss in der Zukunft liegen.'
            )

        # Prüfen, ob sich der Ausleihzeitraum tatsächlich geändert hat.
        enddatum_geaendert = (
            self.instance is None
            or (
                'enddatum' in attrs
                and enddatum != self.instance.enddatum
            )
        )

        zeitraum_geaendert = (
            startdatum_geaendert or enddatum_geaendert
        )

        if (
            startdatum is not None
            and enddatum is not None
            and zeitraum_geaendert
            and enddatum <= startdatum
        ):
            fehler['enddatum'] = (
                'Das Rückgabedatum muss nach dem Startdatum liegen.'
            )

        if fehler:
            raise serializers.ValidationError(fehler)

        return attrs

    def get_anfragestatus_display(self, obj):
        """Gibt den lesbaren Status-Namen zurück"""
        return obj.get_anfragestatus_display()


class AnfrageStatusOverviewSerializer(serializers.Serializer):
    """Serializer für Status-Übersicht"""
    status = serializers.CharField()
    label = serializers.CharField()
    count = serializers.IntegerField()