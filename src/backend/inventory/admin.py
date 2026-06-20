from django.contrib import admin
from .models import Kategorie, Standort, Gegenstandstyp, Gegenstandsexemplar

admin.site.register(Kategorie)
admin.site.register(Standort)
admin.site.register(Gegenstandstyp)
admin.site.register(Gegenstandsexemplar)