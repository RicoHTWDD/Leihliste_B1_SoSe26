"""
Tests für Issue #33 – Gegenstand erfassen, bearbeiten und löschen

Aufbau:
  1. Domäne         – jede fachliche Regel einmal (erlaubt + verboten), ohne Datenbank
  2. Schnittstelle  – jeder Endpunkt mit seinen wichtigen Statuscodes
  3. Service        – nur was über die Schnittstelle nicht sichtbar ist
  4. Admin          – zweiter Schreibweg hält dieselben Regeln ein

Ausführen:   docker compose exec backend python manage.py test inventory
"""
import datetime
import io
import shutil
import tempfile
from unittest import mock   # ersetzt im Test kurz eine Funktion

from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

from django.contrib.auth.models import User
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from inventory.domaene import regeln
from inventory.domaene.regeln import RegelVerstoss
from inventory.infrastruktur.models import (
    Gegenstandsexemplar, Gegenstandstyp, Kategorie, Standort)
from inventory.service import typen
from lending.models import Ausleihanfrage
from organisations.models import Organisation
from users.models import Nutzer


# =============================================================================
# 1. Domäne – ohne Datenbank (SimpleTestCase)
# =============================================================================

def exemplar(**abweichungen):
    """Gültige Exemplar-Daten; einzelne Werte lassen sich überschreiben."""
    daten = {"gegenstand": 1, "standort": 1, "inventarnummer": "INV-1",
             "zustand": "gut", "verfuegbarkeitsstatus": "verfuegbar"}
    daten.update(abweichungen)
    return daten


def typ(**abweichungen):
    """Gültige Typ-Daten mit einem Exemplar."""
    daten = {"name": "Laptop", "beschreibung": "Leihlaptop", "kategorie": 1,
             "maximale_ausleihzeit": 14,
             "exemplare": [{"standort": 1, "inventarnummer": "INV-1", "zustand": "gut",
                            "verfuegbarkeitsstatus": "verfuegbar"}]}
    daten.update(abweichungen)
    return daten


class RegelnTest(SimpleTestCase):

    # Pflichtfelder
    def test_pflichtfelder_alle_fehler_auf_einmal(self):
        with self.assertRaises(RegelVerstoss) as fall:
            regeln.pruefe_exemplar_anlegen({})
        self.assertEqual(set(fall.exception.feldfehler),
                         {"gegenstand", "standort", "inventarnummer", "zustand", "verfuegbarkeitsstatus"})

    # defekt/verloren ⇒ nicht verfügbar
    def test_defekt_und_verfuegbar_verboten(self):
        with self.assertRaises(RegelVerstoss) as fall:
            regeln.pruefe_exemplar_anlegen(exemplar(zustand="defekt"))
        self.assertIn("verfuegbarkeitsstatus", fall.exception.feldfehler)

    def test_defekt_und_nicht_verfuegbar_erlaubt(self):
        regeln.pruefe_exemplar_anlegen(exemplar(zustand="defekt",
                                                verfuegbarkeitsstatus="nicht_verfuegbar"))

    def test_bearbeiten_prueft_stand_nach_der_aenderung(self):
        with self.assertRaises(RegelVerstoss):
            regeln.pruefe_exemplar_bearbeiten(exemplar(), {"zustand": "verloren"})
        regeln.pruefe_exemplar_bearbeiten(
            exemplar(), {"zustand": "verloren", "verfuegbarkeitsstatus": "nicht_verfuegbar"})

    # Name ≤ 100 Zeichen
    def test_name_100_erlaubt_101_verboten(self):
        regeln.pruefe_typ_anlegen(typ(name="x" * 100))
        with self.assertRaises(RegelVerstoss) as fall:
            regeln.pruefe_typ_anlegen(typ(name="x" * 101))
        self.assertIn("name", fall.exception.feldfehler)

    # Typ braucht mindestens ein Exemplar
    def test_typ_ohne_exemplar_verboten(self):
        with self.assertRaises(RegelVerstoss) as fall:
            regeln.pruefe_typ_anlegen(typ(exemplare=[]))
        self.assertIn("exemplare", fall.exception.feldfehler)

    # Letztes Exemplar nicht einzeln löschen
    def test_letztes_exemplar_nicht_loeschen(self):
        regeln.pruefe_exemplar_loeschung(2)
        with self.assertRaises(RegelVerstoss) as fall:
            regeln.pruefe_exemplar_loeschung(1)
        self.assertEqual(fall.exception.code, regeln.LETZTES_EXEMPLAR)

    # Bild: JPG/PNG, höchstens 200 kB
    def test_bild_regeln(self):
        self.assertEqual(regeln.pruefe_bild(None), {})                       # kein Bild erlaubt
        self.assertEqual(regeln.pruefe_bild(("foto.JPG", 200 * 1024)), {})   # genau 200 kB erlaubt
        self.assertIn("bild", regeln.pruefe_bild(("foto.png", 200 * 1024 + 1)))
        self.assertIn("bild", regeln.pruefe_bild(("foto.gif", 1000)))

    # Typ mit Ausleihanfragen nicht löschen
    def test_typ_mit_anfragen_nicht_loeschen(self):
        regeln.pruefe_typ_loeschung(0)
        with self.assertRaises(RegelVerstoss) as fall:
            regeln.pruefe_typ_loeschung(3)
        self.assertEqual(fall.exception.code, regeln.ANFRAGEN_VORHANDEN)


# =============================================================================
# Gemeinsame Testdaten für alle Tests mit Datenbank
# =============================================================================

class MitTestdaten(TestCase):
    """Vor jedem Test: 1 Organisation, 1 Kategorie, 1 Standort,
    Typ "Laptop" mit 2 verfügbaren Exemplaren (INV-1, INV-2)."""

    def setUp(self):
        self.client = APIClient()
        self.org = Organisation.objects.create(name="HTW", organisationstyp="hochschule")
        self.kategorie = Kategorie.objects.create(name="Technik")
        self.standort = Standort.objects.create(organisation=self.org, name="Raum Z 101")
        self.typ = Gegenstandstyp.objects.create(
            organisation=self.org, kategorie=self.kategorie,
            name="Laptop", beschreibung="Leihlaptop", maximale_ausleihzeit=14)
        self.e1 = Gegenstandsexemplar.objects.create(
            gegenstand=self.typ, standort=self.standort, inventarnummer="INV-1", zustand="gut",
            verfuegbarkeitsstatus="verfuegbar")
        self.e2 = Gegenstandsexemplar.objects.create(
            gegenstand=self.typ, standort=self.standort, inventarnummer="INV-2", zustand="gut",
            verfuegbarkeitsstatus="verfuegbar")

    def anfrage_anlegen(self):
        """Eine Ausleihanfrage zum Typ – danach ist der Typ nicht mehr löschbar."""
        nutzer = Nutzer.objects.create(organisation=self.org, vollstaendiger_name="Test",
                                       email="t@t.de", passwort_hash="x")
        heute = datetime.date.today()
        Ausleihanfrage.objects.create(nutzer=nutzer, gegenstand=self.typ, organisation=self.org,
                                      startdatum=heute, enddatum=heute)

    def typ_daten(self, **abweichungen):
        daten = {"name": "Beamer", "beschreibung": "HD-Beamer", "kategorie": self.kategorie.id,
                 "maximale_ausleihzeit": 7,
                 "exemplare": [{"standort": self.standort.id, "inventarnummer": "B-1",
                                "zustand": "gut", "verfuegbarkeitsstatus": "verfuegbar"}]}
        daten.update(abweichungen)
        return daten


# =============================================================================
# 2. Schnittstelle – HTTP-Anfragen wie vom Frontend
# =============================================================================

class AnzeigenApiTest(MitTestdaten):

    def test_uebersicht_und_verfuegbare(self):
        self.client.patch(f"/api/inventory/exemplare/{self.e1.id}/",
                          {"verfuegbarkeitsstatus": "nicht_verfuegbar"}, format="json")
        alle = self.client.get("/api/inventory/alle-exemplare/").json()["results"]
        verfuegbar = self.client.get("/api/inventory/verfuegbare-exemplare/").json()["results"]
        self.assertEqual(len(alle), 2)
        self.assertEqual([e["inventarnummer"] for e in verfuegbar], ["INV-2"])

    def test_detail_200_und_404(self):
        self.assertEqual(self.client.get(f"/api/inventory/exemplare/{self.e1.id}/").status_code, 200)
        self.assertEqual(self.client.get("/api/inventory/exemplare/9999/").status_code, 404)


class ExemplarApiTest(MitTestdaten):
    URL = "/api/inventory/exemplare/"

    def test_anlegen_201(self):
        r = self.client.post(self.URL, exemplar(gegenstand=self.typ.id, standort=self.standort.id, inventarnummer="INV-3"),
                             format="json")
        self.assertEqual(r.status_code, 201)

    def test_anlegen_formatfehler_400(self):
        r = self.client.post(self.URL, exemplar(gegenstand=self.typ.id, standort=self.standort.id, zustand="kaputt"),
                             format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("zustand", r.json())

    def test_anlegen_regelverstoss_400_mit_feldname(self):
        r = self.client.post(self.URL, exemplar(gegenstand=self.typ.id, standort=self.standort.id, inventarnummer="INV-3",
                                                zustand="defekt"), format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("verfuegbarkeitsstatus", r.json())

    def test_anlegen_doppelte_inventarnummer_400(self):
        r = self.client.post(self.URL, exemplar(gegenstand=self.typ.id, standort=self.standort.id, inventarnummer="INV-1"),
                             format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("inventarnummer", r.json())

    def test_bearbeiten_200_400_404(self):
        url = f"{self.URL}{self.e1.id}/"
        self.assertEqual(self.client.patch(url, {"zustand": "verloren"}, format="json").status_code, 400)
        r = self.client.patch(url, {"zustand": "verloren", "verfuegbarkeitsstatus": "nicht_verfuegbar"},
                              format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.client.patch(f"{self.URL}9999/", {}, format="json").status_code, 404)

    def test_loeschen_204_dann_409_letztes(self):
        self.assertEqual(self.client.delete(f"{self.URL}{self.e1.id}/").status_code, 204)
        r = self.client.delete(f"{self.URL}{self.e2.id}/")
        self.assertEqual(r.status_code, 409)
        self.assertEqual(r.json()["code"], "LETZTES_EXEMPLAR")
        self.assertEqual(self.client.delete(f"{self.URL}9999/").status_code, 404)


class TypApiTest(MitTestdaten):
    URL = "/api/inventory/typen/"

    def test_lesen_liste_und_detail(self):
        self.assertEqual(self.client.get(self.URL).status_code, 200)
        r = self.client.get(f"{self.URL}{self.typ.id}/")
        self.assertEqual(r.json()["exemplare"], [self.e1.id, self.e2.id])

    def test_anlegen_201(self):
        r = self.client.post(self.URL, self.typ_daten(), format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(len(r.json()["exemplare"]), 1)

    def test_anlegen_ohne_exemplar_400(self):
        r = self.client.post(self.URL, self.typ_daten(exemplare=[]), format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("exemplare", r.json())

    def test_anlegen_unbekannte_kategorie_400(self):
        r = self.client.post(self.URL, self.typ_daten(kategorie=9999), format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("kategorie", r.json())

    def test_bearbeiten_200_400_404(self):
        url = f"{self.URL}{self.typ.id}/"
        self.assertEqual(self.client.patch(url, {"name": "x" * 101}, format="json").status_code, 400)
        r = self.client.patch(url, {"name": "Laptop Pro"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["name"], "Laptop Pro")
        self.assertEqual(self.client.patch(f"{self.URL}9999/", {"name": "x"},
                                           format="json").status_code, 404)

    def test_loeschen_409_mit_anfrage_dann_204(self):
        self.anfrage_anlegen()
        r = self.client.delete(f"{self.URL}{self.typ.id}/")
        self.assertEqual(r.status_code, 409)
        self.assertEqual(r.json()["code"], "ANFRAGEN_VORHANDEN")

        Ausleihanfrage.objects.all().delete()
        self.assertEqual(self.client.delete(f"{self.URL}{self.typ.id}/").status_code, 204)
        self.assertEqual(Gegenstandsexemplar.objects.count(), 0)    # Exemplare mitgelöscht
        self.assertEqual(self.client.delete(f"{self.URL}9999/").status_code, 404)


class StandortAmExemplarApiTest(MitTestdaten):
    """Standort gehört zum Exemplar (PO in #47) und wird aus der Liste gewählt."""
    URL = "/api/inventory/exemplare/"

    def test_ausgabe_zeigt_standort_des_exemplars(self):
        r = self.client.get(f"{self.URL}{self.e1.id}/")
        self.assertEqual(r.json()["standort"], "Raum Z 101")

    def test_anlegen_ohne_standort_400(self):
        daten = exemplar(gegenstand=self.typ.id, inventarnummer="INV-3")
        del daten["standort"]
        r = self.client.post(self.URL, daten, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("standort", r.json())

    def test_anlegen_unbekannter_standort_400(self):
        r = self.client.post(self.URL, exemplar(gegenstand=self.typ.id, standort=9999,
                                                inventarnummer="INV-3"), format="json")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.json()["standort"], ["Dieser Standort existiert nicht."])

    def test_standort_eines_exemplars_aendern(self):
        lager = Standort.objects.create(organisation=self.org, name="Lager")
        r = self.client.patch(f"{self.URL}{self.e1.id}/", {"standort": lager.id}, format="json")
        self.assertEqual(r.json()["standort"], "Lager")
        self.e2.refresh_from_db()
        self.assertEqual(self.e2.standort, self.standort)           # anderes Exemplar unverändert

    def test_typ_anlegen_exemplar_mit_unbekanntem_standort_400(self):
        daten = self.typ_daten()
        daten["exemplare"][0]["standort"] = 9999
        r = self.client.post("/api/inventory/typen/", daten, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("standort", r.json()["exemplare"]["0"])


def bilddatei(name="foto.png", format="PNG", gross=False):
    """Erzeugt ein echtes Bild im Speicher – wie ein Upload aus dem Browser.
    gross=True: 400×400 Pixel Rauschen, als PNG ca. 330 kB (also über 200 kB)."""
    puffer = io.BytesIO()
    if gross:
        bild = Image.effect_noise((400, 400), 100).convert("RGB")
    else:
        bild = Image.new("RGB", (10, 10), "red")
    bild.save(puffer, format=format)
    return SimpleUploadedFile(name, puffer.getvalue(), content_type=f"image/{format.lower()}")


MEDIA_TEST = tempfile.mkdtemp()   # Bilder der Tests landen hier, nicht in media/


@override_settings(MEDIA_ROOT=MEDIA_TEST)
class BildApiTest(MitTestdaten):
    """Ein Bild pro Exemplar, nur JPG/PNG, höchstens 200 kB. Upload als multipart/form-data."""
    URL = "/api/inventory/exemplare/"

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(MEDIA_TEST, ignore_errors=True)
        super().tearDownClass()

    def anlegen(self, bild):
        daten = exemplar(gegenstand=self.typ.id, standort=self.standort.id, inventarnummer="INV-B")
        daten["bild"] = bild
        return self.client.post(self.URL, daten, format="multipart")

    def test_anlegen_mit_png_201_und_bildadresse(self):
        r = self.anlegen(bilddatei())
        self.assertEqual(r.status_code, 201)
        self.assertIn("/media/exemplare/", r.json()["bild"])

    def test_anlegen_ohne_bild_bleibt_moeglich(self):
        r = self.client.post(self.URL, exemplar(gegenstand=self.typ.id, standort=self.standort.id,
                                                inventarnummer="INV-B"), format="json")
        self.assertEqual(r.status_code, 201)
        self.assertIsNone(r.json()["bild"])

    def test_gif_wird_abgelehnt(self):
        r = self.anlegen(bilddatei("foto.gif", "GIF"))
        self.assertEqual(r.status_code, 400)
        self.assertIn("JPG oder PNG", r.json()["bild"][0])

    def test_zu_grosses_bild_wird_abgelehnt(self):
        r = self.anlegen(bilddatei("gross.png", gross=True))
        self.assertEqual(r.status_code, 400)
        self.assertIn("200 kB", r.json()["bild"][0])

    def test_keine_bilddatei_wird_abgelehnt(self):
        r = self.anlegen(SimpleUploadedFile("text.png", b"kein Bild", content_type="image/png"))
        self.assertEqual(r.status_code, 400)
        self.assertIn("bild", r.json())

    def test_bild_ersetzen_und_entfernen(self):
        url = f"{self.URL}{self.e1.id}/"
        r = self.client.patch(url, {"bild": bilddatei("neu.jpg", "JPEG")}, format="multipart")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()["bild"].endswith(".jpg"))
        r = self.client.patch(url, {"bild": None}, format="json")
        self.assertIsNone(r.json()["bild"])


# =============================================================================
# 3. Service – was über die Schnittstelle nicht sichtbar ist
# =============================================================================

class ServiceTest(MitTestdaten):

    def test_typ_anlegen_nimmt_alles_zurueck_wenn_exemplar_scheitert(self):
        """Doppelte Inventarnummer im Exemplar → auch der Typ wird nicht gespeichert."""
        with self.assertRaises(RegelVerstoss):
            typen.anlegen(self.typ_daten(exemplare=[
                {"standort": self.standort.id, "inventarnummer": "INV-1", "zustand": "gut",
                 "verfuegbarkeitsstatus": "verfuegbar"}]))
        self.assertFalse(Gegenstandstyp.objects.filter(name="Beamer").exists())

    def test_typ_organisation_kommt_vom_standort(self):
        self.assertEqual(typen.anlegen(self.typ_daten()).organisation, self.org)

    def test_protect_als_letzte_absicherung(self):
        """Übersieht die Domäne die Anfrage (hier per mock abgeschaltet),
        verhindert PROTECT das Löschen trotzdem."""
        self.anfrage_anlegen()
        with mock.patch("inventory.service.typen.regeln.pruefe_typ_loeschung"):
            with self.assertRaises(RegelVerstoss):
                typen.loeschen(self.typ.id)
        self.assertTrue(Gegenstandstyp.objects.filter(id=self.typ.id).exists())


# =============================================================================
# 4. Admin – zweiter Schreibweg, gleiche Regeln
# =============================================================================

class AdminTest(MitTestdaten):

    def setUp(self):
        super().setUp()
        User.objects.create_superuser("admin", "a@a.de", "pw")
        self.client.login(username="admin", password="pw")

    def test_anlegen_defekt_verfuegbar_abgelehnt(self):
        self.client.post("/admin/inventory/gegenstandsexemplar/add/",
                         exemplar(gegenstand=self.typ.id, standort=self.standort.id, inventarnummer="INV-3", zustand="defekt"))
        self.assertFalse(Gegenstandsexemplar.objects.filter(inventarnummer="INV-3").exists())

    def test_letztes_exemplar_nicht_loeschbar(self):
        self.client.post(f"/admin/inventory/gegenstandsexemplar/{self.e1.id}/delete/", {"post": "yes"})
        self.client.post(f"/admin/inventory/gegenstandsexemplar/{self.e2.id}/delete/", {"post": "yes"})
        self.assertFalse(Gegenstandsexemplar.objects.filter(id=self.e1.id).exists())   # gelöscht
        self.assertTrue(Gegenstandsexemplar.objects.filter(id=self.e2.id).exists())    # bleibt