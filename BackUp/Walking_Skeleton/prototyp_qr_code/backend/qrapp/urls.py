# urls.py
# Dieses Modul verbindet URLs mit den zugehörigen View-Funktionen.
# Wenn das Frontend eine Anfrage an /api/qr/ schickt,
# wird sie an die Funktion generate_qr_code in views.py weitergeleitet.

from django.urls import path
from . import views

urlpatterns = [
    # /api/qr/ → ruft generate_qr_code() in views.py auf
    path('qr/', views.generate_qr_code, name='generate_qr_code'),
]