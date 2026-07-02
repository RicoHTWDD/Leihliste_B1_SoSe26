from django.contrib import admin
from .models import Ausleihanfrage, Anfragestatus

# admin.site.register(Ausleihanfrage)
@admin.register(Ausleihanfrage)
class AusleihanfrageAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'nutzer',
        'gegenstand',
        'organisation',
        'anfragestatus',
        'startdatum',
        'enddatum',
        'erstellt_am'
    ]
    list_filter = ['anfragestatus', 'organisation', 'bedingungen_akzeptiert']
    search_fields = [
        'nutzer__vollstaendiger_name',
        'nutzer__email',
        'gegenstand__name'
    ]
    readonly_fields = ['erstellt_am', 'aktualisiert_am']
    
    fieldsets = (
        ('Allgemein', {
            'fields': ('nutzer', 'gegenstand', 'organisation')
        }),
        ('Zeitraum', {
            'fields': ('startdatum', 'enddatum')
        }),
        ('Status', {
            'fields': ('anfragestatus', 'ablehnungsgrund')
        }),
        ('Metadaten', {
            'fields': ('bedingungen_akzeptiert', 'erstellt_am', 'aktualisiert_am'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['genehmige_ausgewaehlte', 'lehne_ausgewaehlte_ab']
    
    def genehmige_ausgewaehlte(self, request, queryset):
        queryset.update(anfragestatus=Anfragestatus.GENEHMIGT)
        self.message_user(request, f"{queryset.count()} Anfragen genehmigt.")
    genehmige_ausgewaehlte.short_description = "Ausgewählte Anfragen genehmigen"
    
    def lehne_ausgewaehlte_ab(self, request, queryset):
        queryset.update(anfragestatus=Anfragestatus.ABGELEHNT)
        self.message_user(request, f"{queryset.count()} Anfragen abgelehnt.")
    lehne_ausgewaehlte_ab.short_description = "Ausgewählte Anfragen ablehnen"