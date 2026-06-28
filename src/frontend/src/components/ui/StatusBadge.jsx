import Chip from "@mui/material/Chip";

// Status-Schlüssel -> Anzeigetext + MUI-Farbe.
// MUI-Farben: success | warning | error | info | default
const STATUS_CONFIG = {
  // Gegenstände (#18)
  verfuegbar:       { label: "Verfügbar",       color: "success" },
  nicht_verfuegbar: { label: "Nicht verfügbar", color: "default" },
  // Anfragen (#36 / #125)
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
