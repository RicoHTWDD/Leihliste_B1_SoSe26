"""
Domäne: fachliche Regeln des Inventars

Geplante Regeln (Quelle in Klammern, siehe docs/design-analysis/design-decision.adoc):
- Pflichtfelder gefüllt                                   (Akzeptanzkriterien #33)
- Name höchstens 100 Zeichen                              (Akzeptanzkriterien #33)
- R1: defekt/verloren ⇒ nicht "verfügbar"                 (Annahme, vom PO bestätigen)
- R5: letztes Exemplar eines Typs nicht einzeln löschen   (Annahme, vom PO bestätigen)
- R6: Gegenstandstyp mit Ausleihanfragen nicht löschen    (Annahme, vom PO bestätigen)
Bei einem Verstoß: Fehler mit Feldname, den der Service an den Controller weitergibt.
"""
