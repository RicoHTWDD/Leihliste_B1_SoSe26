import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";

import { StatusBadge, HintBox, ErrorMessage } from "./ui";

/* Demo-/Übersichtsseite: zeigt die eigenen Komponenten (#140) und Beispiel-Buttons (MUI).
   Nur zum Ansehen / für Screenshots – nicht Teil der App-Navigation. */

const rowSx = { display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", mt: 1, mb: 3 };

export default function UiShowcase() {
  return (
    <Box sx={{ maxWidth: 760, mx: "auto", p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>UI-Komponenten</Typography>

      <Typography variant="overline" color="text.secondary">StatusBadge · Gegenstände</Typography>
      <Box sx={rowSx}>
        <StatusBadge status="verfuegbar" />
        <StatusBadge status="ausgeliehen" />
        <StatusBadge status="reserviert" />
        <StatusBadge status="defekt" />
      </Box>

      <Typography variant="overline" color="text.secondary">StatusBadge · Anfragen</Typography>
      <Box sx={rowSx}>
        <StatusBadge status="eingereicht" />
        <StatusBadge status="genehmigt" />
        <StatusBadge status="abgelehnt" />
        <StatusBadge status="zurueckgezogen" />
      </Box>

      <Typography variant="overline" color="text.secondary">Buttons (MUI)</Typography>
      <Box sx={rowSx}>
        <Button variant="contained">Primär</Button>
        <Button variant="outlined">Sekundär</Button>
        <Button variant="text">Ghost</Button>
        <Button variant="contained" color="error" startIcon={<DeleteIcon />}>Löschen</Button>
        <Button variant="contained" startIcon={<AddIcon />}>Ausleihe hinzufügen</Button>
        <IconButton aria-label="Suchen"><SearchIcon /></IconButton>
      </Box>

      <Typography variant="overline" color="text.secondary">HintBox · ErrorMessage</Typography>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <HintBox title="Keine passenden Gegenstände" message="Für den aktiven Filter gibt es keine Treffer." />
        <HintBox title="Noch keine Anfragen" message="Sobald du eine Ausleihanfrage stellst, erscheint sie hier." />
        <ErrorMessage title="Anfragen konnten nicht geladen werden" message="Bitte aktualisiere die Seite oder versuche es später erneut." />
      </Stack>
    </Box>
  );
}
