"""
Schicht: Controller

Nimmt HTTP-Anfragen an und gibt HTTP-Antworten zurück. Keine Geschäftslogik.
- views.py:       ViewSets – Anfrage annehmen, Service aufrufen, Statuscode zurückgeben
- serializers.py: JSON ⇄ Python, prüft nur das Format (Datentyp, Pflichtfeld vorhanden)
- admin.py:       Django-Admin – ruft ebenfalls den Service auf
Greift NIE direkt auf Models oder Datenbank zu, sondern immer über den Service.
"""
