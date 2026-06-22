import Chip from "@mui/material/Chip";

// Status-Schlüssel -> Anzeigetext + MUI-Farbe.
// MUI-Farben: success | warning | error | info | default
const STATUS_CONFIG = {
  // Gegenstände (#18)
  verfuegbar:          { label: "Verfügbar",           color: "success" },
  ausgeliehen:         { label: "Ausgeliehen",          color: "warning" },
  reserviert:          { label: "Reserviert",           color: "info" },
  defekt:              { label: "Defekt",               color: "error" },
  // Anfragen (#36 / #125)
  eingereicht:         { label: "Eingereicht",          color: "info" },
  genehmigt:           { label: "Genehmigt",            color: "success" },
  abgelehnt:           { label: "Abgelehnt",            color: "error" },
  zurueckgezogen:      { label: "Zurückgezogen",        color: "default" },
};

export default function StatusBadge({ status }) {
  // Fallback bei unbekanntem Status
  const config = STATUS_CONFIG[status] ?? { label: status, color: "default" };
  return <Chip label={config.label} color={config.color} size="small" />;
}
