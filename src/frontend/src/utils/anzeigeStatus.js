// Das Backend speichert am Exemplar nur verfuegbar/nicht_verfuegbar plus das
// Feld "zustand". "Ausgeliehen"/"Reserviert" ergeben sich zeitraumbezogen aus
// den laufenden Ausleihen bzw. bestaetigten Reservierungen und sollen kuenftig
// als berechnetes Feld `anzeige_status` (plus `rueckgabedatum` /
// `reservierungsdatum`) geliefert werden.
//
// Diese Datei ist die EINZIGE Stelle, die diese Luecke ueberbrueckt:
//   - liefert das Backend `anzeige_status`, wird er direkt verwendet;
//   - sonst wird clientseitig abgeleitet, soweit die Daten es hergeben.
// Sobald das Backend den Ziel-Kontrakt liefert, ist an den Komponenten
// (#121/#131) KEINE Aenderung mehr noetig.

const DEFEKTE_ZUSTAENDE = ["defekt", "verloren"];

// exemplar: rohes API-Objekt eines Gegenstandsexemplars
export function ermittleAnzeigeStatus(exemplar) {
  if (!exemplar) return null;

  // 1) Ziel-Kontrakt: Backend liefert den abgeleiteten Status bereits
  if (exemplar.anzeige_status) return exemplar.anzeige_status;

  // 2) Fallback: defekt/verloren hat Vorrang vor allem anderen
  //    (greift nur, wenn der Serializer das Feld "zustand" mitliefert)
  if (DEFEKTE_ZUSTAENDE.includes(exemplar.zustand)) return "defekt";

  // 3) Fallback: gespeicherter (binaerer) Verfuegbarkeitsstatus.
  //    "ausgeliehen"/"reserviert" kann NUR das Backend ableiten, weil dafuer
  //    Lending-Daten noetig sind — bewusst kein Nachbau im Frontend.
  return exemplar.verfuegbarkeitsstatus ?? null;
}

export function formatiereDatum(isoDatum) {
  if (!isoDatum) return null;
  const datum = new Date(isoDatum);
  if (Number.isNaN(datum.getTime())) return null;
  return datum.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Statusabhaengige Zusatzinfo laut Story #18:
//   ausgeliehen -> voraussichtliches Rueckgabedatum
//   reserviert  -> Reservierungsdatum
//   verfuegbar  -> Standort
// Feldnamen `rueckgabedatum`/`reservierungsdatum` folgen dem Vorschlag aus der
// Team-Abstimmung — ggf. nach der Antwort des Backends hier einmalig anpassen.
// `standortAnzeigen: false` nutzen, wo der Standort ohnehin sichtbar ist
// (z. B. eigene Spalte in der Uebersicht).
export function ermittleZusatzinfo(exemplar, { standortAnzeigen = true } = {}) {
  const status = ermittleAnzeigeStatus(exemplar);

  if (status === "ausgeliehen") {
    const datum = formatiereDatum(exemplar.rueckgabedatum);
    return datum ? `Rückgabe: ${datum}` : null;
  }
  if (status === "reserviert") {
    const datum = formatiereDatum(exemplar.reservierungsdatum);
    return datum ? `Reservierung: ${datum}` : null;
  }
  if (status === "verfuegbar" && standortAnzeigen) {
    const standort = exemplar.standort;
    if (!standort) return null;
    return typeof standort === "string" ? standort : standort.name ?? null;
  }
  return null;
}