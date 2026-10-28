from django.test import TestCase
from rest_framework.test import APIClient

from .models import (
    Kategorie,
    Standort,
    Gegenstandsexemplar,
    Gegenstandstyp,
    Verfuegbarkeitsstatus,
)

class VerfuegbarkeitsfilterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        self.kategorie = Kategorie.objects.create(
            name='Technik'
        )
        
        self.standort = Standort.objects.create(
            name='A001',
            organisation_id=1,
        )
        
        self.gegenstandstyp = Gegenstandstyp.objects.create(
            name='Beamer',
            organisations_id=1,
            kategorie = self.kategorie,
            standort = self.standort,
            maximale_ausleihzeit=14,
        )
        
        Gegenstandsexemplar.objects.create(
            gegenstand=self.gegenstandstyp,
            inventarnummer='INV-VERFUEGBAR',
            verfuegbarkeitsstatus=Verfuegbarkeitsstatus.VERFUEGBAR,
        )

        Gegenstandsexemplar.objects.create(
            gegenstand=self.gegenstandstyp,
            inventarnummer='INV-NICHT-VERFUEGBAR',
            verfuegbarkeitsstatus=Verfuegbarkeitsstatus.NICHT_VERFUEGBAR,
        )

    def test_verfuegbarkeitsfilter(self):
        response = self.client.get(
            '/api/inventory/alle-exemplare/?verfuegbar=true'
        )

        self.assertEqual(response.status_code, 200)

        inventarnummern = [
            exemplar['inventarnummer']
            for exemplar in response.data['results']
        ]

        self.assertIn('INV-VERFUEGBAR', inventarnummern)
        self.assertNotIn('INV-NICHT-VERFUEGBAR', inventarnummern)
