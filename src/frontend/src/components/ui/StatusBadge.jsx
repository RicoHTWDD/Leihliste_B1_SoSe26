import Chip from "@mui/material/Chip";

const STATUS_CONFIG = {
  // Anzeige-Status eines Gegenstand-Exemplars (Story #18 / #38, Issues #121 / #131).
  // Ziel-Kontrakt: das Backend liefert ein abgeleitetes Feld `anzeige_status`
  // (siehe Team-Abstimmung zu Story #18). Bis dahin leitet das Frontend den
  // Status ueber utils/anzeigeStatus.js ab, soweit die Daten es hergeben:
  //   - verfuegbar / nicht_verfuegbar: gespeichertes Modellfeld
  //   - defekt: aus "zustand" (defekt/verloren), falls der Serializer es liefert
  //   - ausgeliehen / reserviert: erst mit `anzeige_status` vom Backend
  verfuegbar:       { label: "Verfügbar",       color: "success" },
  ausgeliehen:      { label: "Ausgeliehen",     color: "warning" },
  reserviert:       { label: "Reserviert",      color: "info" },
  // AK aus #18: "Defekt" wird visuell klar von verfuegbaren Gegenstaenden unterschieden
  defekt:           { label: "Defekt",          color: "error" },
  // neutral-grau: "warning" ist jetzt durch "Ausgeliehen" belegt
  nicht_verfuegbar: { label: "Nicht verfügbar", color: "default" },

  // Status einer Anfrage (#36 / #125 / #126)
  eingereicht:    { label: "Eingereicht",   color: "info" },
  genehmigt:      { label: "Genehmigt",     color: "success" },
  abgelehnt:      { label: "Abgelehnt",     color: "error" },
  zurueckgezogen: { label: "Zurückgezogen", color: "default" },
  abgelaufen:     { label: "Abgelaufen",    color: "default" },
};

export default function StatusBadge({ status }) {
  // Fallback bei unbekanntem Status
  const config = STATUS_CONFIG[status] ?? { label: status, color: "default" };
  return <Chip label={config.label} color={config.color} size="small" />;
}