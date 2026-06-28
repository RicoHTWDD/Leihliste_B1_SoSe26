from django.contrib import admin
from .models import Kategorie, Standort, Gegenstandstyp, Gegenstandsexemplar

# admin.site.register(Kategorie)
@admin.register(Kategorie)
class KategorieAdmin(admin.ModelAdmin):
    list_display = ['name']

# admin.site.register(Standort)
@admin.register(Standort)
class StandortAdmin(admin.ModelAdmin):
    list_display = ['name', 'organisation']

# admin.site.register(Gegenstandstyp)
@admin.register(Gegenstandsexemplar)
class GegenstandsexemplarAdmin(admin.ModelAdmin):
    list_display = ['inventarnummer', 'gegenstand', 'verfuegbarkeitsstatus', 'zustand']
    list_filter = ['verfuegbarkeitsstatus', 'zustand']
    search_fields = ['inventarnummer']

# admin.site.register(Gegenstandsexemplar)
@admin.register(Gegenstandstyp)
class GegenstandstypAdmin(admin.ModelAdmin):
    list_display = ['name', 'kategorie', 'standort']


