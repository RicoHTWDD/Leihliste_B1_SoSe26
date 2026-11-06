"""
Weiterleitung – bitte hier KEINE Admin-Klassen schreiben.

Django lädt die Admin-Registrierung immer aus `inventory/admin.py`.
Die echten Admin-Klassen liegen in der Schicht Controller: `controller/admin.py`.
Ohne diese Weiterleitung wären die Inventar-Seiten im Django-Admin verschwunden.
"""
from .controller import admin  # noqa: F401
