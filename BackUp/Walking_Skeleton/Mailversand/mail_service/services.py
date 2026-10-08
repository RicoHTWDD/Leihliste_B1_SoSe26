import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mail_service.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from typing import List, Optional

class EmailService:

    @staticmethod
    def send_test_email(recipient: str, email_type: int = 1) -> bool:
        """
        Sendet eine Test-E-Mail basierend auf dem angegebenen Typ.

        Args:
            recipient (str): E-Mail-Adresse des Empfängers.
            email_type (int): Bestimmt den Typ der E-Mail:
                1: Neue Ausleihanfrage
                2: Antwort auf Ausleihanfrage
                3: Erinnerung an fällige Ausleihe

        Returns:
            bool: True, wenn der Versand erfolgreich war, sonst False.
        """
        email_templates = {
            1: {
                'subject': 'Neue Ausleihanfrage in LeihListe',
                'message': 'Es gibt eine neue Ausleihanfrage für einen Ihrer Gegenstände.',
                'html_message': '<h1>Neue Ausleihanfrage</h1><p>Es gibt eine neue Ausleihanfrage für einen Ihrer Gegenstände.</p>'
            },
            2: {
                'subject': 'Antwort auf Ihre Ausleihanfrage',
                'message': 'Ihre Ausleihanfrage wurde beantwortet.',
                'html_message': '<h1>Antwort auf Ihre Ausleihanfrage</h1><p>Ihre Ausleihanfrage wurde beantwortet.</p>'
            },
            3: {
                'subject': 'Erinnerung: Ausleihe bald fällig',
                'message': 'Eine Ihrer Ausleihen wird bald fällig. Bitte denken Sie an die Rückgabe.',
                'html_message': '<h1>Erinnerung: Ausleihe bald fällig</h1><p>Eine Ihrer Ausleihen wird bald fällig. Bitte denken Sie an die Rückgabe.</p>'
            }
        }

        try:
            template = email_templates.get(email_type)
            if not template:
                raise ValueError(f"Ungültiger E-Mail-Typ: {email_type}")

            send_mail(
                subject=template['subject'],
                message=template['message'],
                html_message=template['html_message'],
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Fehler beim E-Mail-Versand (Typ {email_type}): {e}")
            return False