# views.py
# Dieses Modul enthält die gesamte Logik für die QR-Code Generierung.
# Es empfängt den Gegenstandsnamen vom Frontend,
# generiert daraus einen QR-Code und schickt ihn als Base64-kodierten
# JSON-String zurück.

import qrcode          # QR-Code Generierung
import io              # Arbeit mit Speicher-Streams (kein Dateisystem nötig)
import base64          # Umwandlung von Bild → Text (Base64)
import json            # JSON lesen und schreiben
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def generate_qr_code(request):
    """
    Hauptfunktion: Empfängt POST-Anfrage vom Frontend,
    generiert QR-Code und schickt ihn als Base64 zurück.
    """

    # Schritt 1: Nur POST Requests erlauben
    if request.method != 'POST':
        return JsonResponse(
            {'fehler': 'Nur POST Requests erlaubt'},
            status=405
        )

    # Schritt 2: Gegenstandsname aus Request Body lesen
    try:
        body = json.loads(request.body)
        gegenstand_name = body.get('name')

        if not gegenstand_name:
            return JsonResponse(
                {'fehler': 'Kein Name angegeben'},
                status=400
            )
    except json.JSONDecodeError:
        return JsonResponse(
            {'fehler': 'Ungültiges JSON Format'},
            status=400
        )

    # Schritt 3: QR-Code generieren
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=4,
    )
    qr.add_data(gegenstand_name)
    qr.make(fit=True)

    qr_bild = qr.make_image(
        fill_color="black",
        back_color="white"
    )

    # Schritt 4: PNG Bild in Base64 umwandeln
    buffer = io.BytesIO()
    qr_bild.save(buffer, 'PNG')
    buffer.seek(0)
    qr_base64 = base64.b64encode(buffer.read()).decode('utf-8')

    # Schritt 5: Base64 als JSON zurückschicken
    return JsonResponse({
        'qr_code': qr_base64,
        'name': gegenstand_name
    })