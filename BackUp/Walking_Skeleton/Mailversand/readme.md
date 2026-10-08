### genutzte Versionen
# - Python 3.12.3
# - Django 6.0.5

### Aufruf
# funzt nur mit Zugangsdaten in der Datei ".env", welche nicht auf github liegen sollte, daher packe ich die in den dev-Chat, diese muss in den Ordner Mailverssand gelegt werden
# -> im Terminal bis in den Unterordner "/src/Walking_Skeleton/Mailversand" wechseln und im Terminal folgendes eingeben
# -> aktiviere die virtuelle Umgebung
# source venv/bin/activate
# -> der Prompt ändert sich zu (venv).
# -> ggf. Django installieren
# pip install django
# -> Python-Umgebung migrieren und starten:
# python manage.py migrate 
# python manage.py shell
# from mail_service.services import EmailService
# -> Testmail versenden:
# EmailService.send_test_email('EMPFÄNGERADRESSE', 1 2 oder 3)

### Nachweis für technische Aussagen
# - Technische Aussage: Versand von E-Mail-Benachrichtigungen über externen SMTP-Dienst funktioniert (ADR-007).
# - Evidenz: Test-E-Mail in Postfach erhalten
# - Status: validiert
# - Nächster Schritt: ?

