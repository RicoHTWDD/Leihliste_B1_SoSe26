"""
Controller: Django-Admin (Verwaltungsoberfläche unter /admin/)

Der Admin ist neben der REST-Schnittstelle ein zweiter Weg, Daten zu ändern.
Damit die fachlichen Regeln auch hier gelten, darf der Admin nicht selbst
speichern oder löschen, sondern muss – genau wie views.py – den Service aufrufen.
"""
from django import forms                             # Formulare (hier: das Eingabeformular im Admin)
from django.contrib import admin, messages          # admin: Grundklassen; messages: farbige Hinweise oben auf der Seite
from django.http import HttpResponseRedirect        # Antwort "geh zu einer anderen Seite"
from django.urls import reverse                     # baut aus einem Seitennamen die passende URL

from inventory.infrastruktur.models import Kategorie, Standort, Gegenstandstyp, Gegenstandsexemplar
from inventory.service import exemplare, typen      # Service: einziger Weg zum Speichern/Löschen


class GegenstandsexemplarAdminForm(forms.ModelForm):
    """Eingabeformular für Exemplare im Admin.

    Django prüft hier schon das Format (Pflichtfeld, Auswahl aus Liste,
    eindeutige Inventarnummer). clean() fragt zusätzlich den Service,
    ob die Eingabe fachlich erlaubt ist. So steht ein Fehler rot direkt
    am Feld – genau wie bei der REST-Schnittstelle der Feldname im 400.
    """

    class Meta:
        model = Gegenstandsexemplar
        fields = ["gegenstand", "inventarnummer", "zustand", "verfuegbarkeitsstatus"]

    def clean(self):
        daten = super().clean()                     # Djangos Formatprüfung zuerst
        if self.errors:                             # Formatfehler? Dann nicht weiter prüfen
            return daten

        try:
            if self.instance.pk is None:            # pk leer → neues Exemplar wird angelegt
                exemplare.anlegen_pruefen({
                    "gegenstand": daten["gegenstand"].pk,   # Formular liefert das Typ-Objekt, Service braucht die ID
                    "inventarnummer": daten["inventarnummer"],
                    "zustand": daten["zustand"],
                    "verfuegbarkeitsstatus": daten["verfuegbarkeitsstatus"],
                })
            else:                                   # pk vorhanden → bestehendes Exemplar wird bearbeitet
                exemplare.bearbeiten_pruefen(self.instance.pk, _geaenderte_felder(self))
        except exemplare.RegelVerstoss as verstoss:
            # Jede Meldung der Domäne an das passende Feld hängen
            for feld, meldungen in verstoss.feldfehler.items():
                for meldung in meldungen:
                    self.add_error(feld, meldung)
        return daten


def _geaenderte_felder(formular):
    """Nur die Felder, die im Formular wirklich geändert wurden, mit neuem Wert.

    changed_data ist eine Liste der Feldnamen, die sich gegenüber dem
    gespeicherten Stand geändert haben.
    """
    return {
        feld: formular.cleaned_data[feld]
        for feld in formular.changed_data
        if feld in exemplare.FELDER_BEARBEITEN
    }


# @admin.register(Model) meldet eine Admin-Klasse für dieses Model an.
# Dadurch erscheint es im Admin mit Liste, Detailseite, Anlegen und Löschen.

@admin.register(Kategorie)
class KategorieAdmin(admin.ModelAdmin):
    list_display = ['name']                         # Spalten in der Liste


@admin.register(Standort)
class StandortAdmin(admin.ModelAdmin):
    list_display = ['name', 'organisation']


@admin.register(Gegenstandsexemplar)
class GegenstandsexemplarAdmin(admin.ModelAdmin):
    form = GegenstandsexemplarAdminForm             # unser Formular mit der fachlichen Prüfung
    list_display = ['inventarnummer', 'gegenstand', 'verfuegbarkeitsstatus', 'zustand']
    list_filter = ['verfuegbarkeitsstatus', 'zustand']   # Filter rechts neben der Liste
    search_fields = ['inventarnummer']                   # Suchfeld über der Liste

    # ------------------------------------------------------------------------
    # Anlegen und Bearbeiten laufen über den Service.
    #
    # Ablauf beim Klick auf "Sichern":
    #   1. Formular.clean()  → Service prüft → Domäne entscheidet
    #      verboten: Formular erscheint wieder, Fehler rot am Feld, nichts gespeichert
    #   2. save_model()      → Service anlegen() bzw. bearbeiten() speichert
    # ------------------------------------------------------------------------

    def get_readonly_fields(self, request, obj=None):
        """Beim Bearbeiten (obj vorhanden) ist der Gegenstandstyp nur lesbar.

        Ein Exemplar wird nicht zu einem anderen Typ verschoben –
        genauso wie bei PATCH über die REST-Schnittstelle.
        """
        if obj is not None:
            return ["gegenstand"]
        return []

    def save_model(self, request, obj, form, change):
        """Wird von Django zum Speichern aufgerufen. Standard wäre obj.save().

        change = False → neues Exemplar, change = True → bestehendes bearbeiten.
        """
        if not change:
            neu = exemplare.anlegen({
                "gegenstand": obj.gegenstand_id,
                "inventarnummer": obj.inventarnummer,
                "zustand": obj.zustand,
                "verfuegbarkeitsstatus": obj.verfuegbarkeitsstatus,
            })
            # Django braucht danach die ID, um "erfolgreich hinzugefügt"
            # anzuzeigen und zur richtigen Seite zu springen.
            obj.pk = neu.pk
        else:
            exemplare.bearbeiten(obj.pk, _geaenderte_felder(form))

    # ------------------------------------------------------------------------
    # Löschen läuft über den Service, damit die Regeln auch hier gelten.
    #
    # Ablauf beim Klick auf "Löschen" → "Ja, ich bin sicher":
    #   delete_view()  →  delete_model()  →  Service exemplare.loeschen()
    #                                            → Domäne prüft "letztes Exemplar?"
    #   erlaubt:   Exemplar weg, Django zeigt "erfolgreich gelöscht"
    #   verboten:  RegelVerstoss fliegt zurück bis delete_view(),
    #              dort wird er abgefangen und als rote Meldung angezeigt
    # ------------------------------------------------------------------------

    def delete_model(self, request, obj):
        """Wird von Django aufgerufen, um ein einzelnes Objekt zu löschen.

        Standard wäre obj.delete() – also direkt löschen ohne Prüfung.
        Wir überschreiben die Methode und rufen stattdessen den Service auf.
        obj.pk ist die ID des Exemplars.
        """
        exemplare.loeschen(obj.pk)

    def delete_view(self, request, object_id, extra_context=None):
        """Die ganze Löschseite (Rückfrage anzeigen + nach "Ja" löschen).

        super().delete_view(...) führt den normalen Ablauf von Django aus
        und ruft dabei unser delete_model() auf.
        Lehnt die Domäne ab, kommt ein RegelVerstoss hier an:
          1. Meldung der Domäne rot oben auf der Seite anzeigen
          2. zurück zur Detailseite des Exemplars springen
        Weil Django das Löschen in einer Transaktion ausführt,
        wird dabei nichts gelöscht.
        """
        try:
            return super().delete_view(request, object_id, extra_context)
        except exemplare.RegelVerstoss as verstoss:
            # 1. rote Fehlermeldung mit dem Text aus der Domäne
            self.message_user(request, verstoss.meldung, level=messages.ERROR)
            # 2. "admin:<app>_<model>_change" ist der Name der Detailseite im Admin
            return HttpResponseRedirect(reverse(
                "admin:inventory_gegenstandsexemplar_change", args=[object_id]))

    def get_actions(self, request):
        """Liefert die Aktionen über der Liste (Auswahlfeld "Aktion: …").

        Django bietet dort "Ausgewählte löschen" an. Das löscht mehrere
        Exemplare auf einmal und meldet am Ende immer "erfolgreich gelöscht",
        auch wenn die Domäne einzelne abgelehnt hätte. Deshalb entfernen
        wir diese Aktion. Gelöscht wird nur einzeln über die Detailseite.
        """
        aktionen = super().get_actions(request)     # alle Standard-Aktionen holen
        aktionen.pop("delete_selected", None)       # "Ausgewählte löschen" entfernen (None: kein Fehler, falls nicht da)
        return aktionen


class GegenstandstypAdminForm(forms.ModelForm):
    """Eingabeformular für Gegenstandstypen im Admin (nur Bearbeiten).

    Wie beim Exemplar: Django prüft das Format, clean() fragt zusätzlich
    den Service, ob die Änderung fachlich erlaubt ist (z. B. Name ≤ 100 Zeichen).
    Die Organisation ist nicht im Formular – sie kommt vom Standort.
    """

    class Meta:
        model = Gegenstandstyp
        fields = list(typen.FELDER_BEARBEITEN)

    def clean(self):
        daten = super().clean()
        if self.errors:
            return daten
        try:
            typen.bearbeiten_pruefen(_geaenderte_typfelder(self))
        except typen.RegelVerstoss as verstoss:
            for feld, meldungen in verstoss.feldfehler.items():
                for meldung in meldungen:
                    self.add_error(feld, meldung)
        return daten


def _geaenderte_typfelder(formular):
    """Geänderte Felder mit neuem Wert. Kategorie/Standort als ID, so wie der Service sie erwartet."""
    aenderungen = {}
    for feld in formular.changed_data:
        wert = formular.cleaned_data[feld]
        if feld in ("kategorie", "standort"):
            wert = wert.pk if wert is not None else None   # Formular liefert Objekt, Service braucht die ID
        aenderungen[feld] = wert
    return aenderungen


@admin.register(Gegenstandstyp)
class GegenstandstypAdmin(admin.ModelAdmin):
    form = GegenstandstypAdminForm
    list_display = ['name', 'kategorie', 'standort']

    # ------------------------------------------------------------------------
    # Anlegen im Admin ist abgeschaltet: Ein Typ braucht mindestens ein Exemplar,
    # und das einfache Admin-Formular kann Typ + Exemplare nicht zusammen anlegen.
    # Angelegt wird über POST /api/inventory/typen/ (später das Frontend-Formular).
    # ------------------------------------------------------------------------

    def has_add_permission(self, request):
        """False → der Button "Gegenstandstyp hinzufügen" verschwindet."""
        return False

    def save_model(self, request, obj, form, change):
        """Speichern beim Bearbeiten läuft über den Service."""
        typen.bearbeiten(obj.pk, _geaenderte_typfelder(form))

    # --- Löschen über den Service (gleiches Muster wie beim Exemplar) ---------

    def delete_model(self, request, obj):
        """Löscht über den Service – der prüft, ob es Ausleihanfragen gibt."""
        typen.loeschen(obj.pk)

    def delete_view(self, request, object_id, extra_context=None):
        """Fängt eine fachliche Ablehnung ab und zeigt sie als rote Meldung an."""
        try:
            return super().delete_view(request, object_id, extra_context)
        except typen.RegelVerstoss as verstoss:
            self.message_user(request, verstoss.meldung, level=messages.ERROR)
            return HttpResponseRedirect(reverse(
                "admin:inventory_gegenstandstyp_change", args=[object_id]))

    def get_actions(self, request):
        """Mehrfach-Löschen abschalten: Jede Löschung soll einzeln geprüft werden."""
        aktionen = super().get_actions(request)
        aktionen.pop("delete_selected", None)
        return aktionen