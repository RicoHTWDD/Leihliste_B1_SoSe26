# config/urls.py
# Haupt-Routing des Django Projekts
# Verbindet die Haupt-URLs mit den App-URLs

from django.urls import path, include

urlpatterns = [
    # Alle Anfragen die mit "api/" beginnen
    # werden an qrapp/urls.py weitergeleitet
    path('api/', include('qrapp.urls')),
]