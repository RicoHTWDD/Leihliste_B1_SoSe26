import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Select,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { StatusBadge, ErrorMessage } from "../components/ui";

const MOCK = true; // auf false setzen, sobald #132 existiert und gemerged ist
const MOCK_GEGENSTAND = {
  id: 1,
  inventarnummer: "INV-0001",
  name: "Mikroskop 1b",
  kategorie: "Elektronik",
  verfuegbarkeitsstatus: "verfuegbar", // verfuegbar | nicht_verfuegbar
  // beschreibung: liefert der Serializer aktuell nicht -> Platzhalter
};

// Router-Resource laut inventory/urls.py: "exemplare". Prefix vermutlich /api/inventory/.
const API_BASE = "/api/inventory/exemplare";

export default function GegenstandDetail({ gegenstandId = 1 }) {
  const [gegenstand, setGegenstand] = useState(MOCK ? MOCK_GEGENSTAND : null);
  const [ladevorgang, setLadevorgang] = useState(!MOCK);
  const [fehler, setFehler] = useState(null);

  useEffect(() => {
    if (MOCK) return;

    let aktiv = true;
    setLadevorgang(true);
    setFehler(null);

    fetch(`${API_BASE}/${gegenstandId}/`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((daten) => {
        if (aktiv) setGegenstand(daten);
      })
      .catch((e) => {
        if (aktiv) setFehler(e.message);
      })
      .finally(() => {
        if (aktiv) setLadevorgang(false);
      });

    return () => {
      aktiv = false;
    };
  }, [gegenstandId]);

  // --- Ladezustand ---
  if (ladevorgang) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress aria-label="Gegenstand wird geladen" />
      </Box>
    );
  }

  // --- Fehlerzustand ---
  if (fehler) {
    return (
      <Box sx={{ p: 2 }}>
        <ErrorMessage message="Der Gegenstand konnte nicht geladen werden." />
      </Box>
    );
  }

  // --- Nicht gefunden ---
  if (!gegenstand) {
    return (
      <Box sx={{ p: 2 }}>
        <ErrorMessage message="Gegenstand nicht gefunden." />
      </Box>
    );
  }

  const name = gegenstand.name ?? gegenstand.inventarnummer;

  return (
    <Box sx={{ p: 2 }}>
      {/* Breadcrumb-Titel: Gegenstände - {Kategorie} - {Name} */}
      <Typography variant="h6" component="div" sx={{ fontWeight: 700, mb: 2 }}>
        Gegenstände{gegenstand.kategorie ? ` - ${gegenstand.kategorie}` : ""} - {name}
      </Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        {/* Zurück - wird spaeter ans Routing angebunden (eigene Aufgabe) */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => window.history.back()}
          sx={{ color: "text.secondary", mb: 2 }}
        >
          Zurück
        </Button>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {/* PLATZHALTER (Bild-Issue): Thumbnails */}
          <Stack spacing={1}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{ width: 64, height: 64, bgcolor: "grey.200", borderRadius: 1 }}
              />
            ))}
          </Stack>

          {/* PLATZHALTER (Bild-Issue): Hauptbild */}
          <Box
            sx={{
              width: { xs: "100%", md: 320 },
              height: 240,
              bgcolor: "grey.300",
              borderRadius: 1,
              flexShrink: 0,
            }}
          />

          {/* Rechte Spalte */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              {name}
            </Typography>

            {/* PLATZHALTER (Beschreibung): Serializer liefert das Feld noch nicht */}
            <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
              {gegenstand.beschreibung ?? "Beschreibung …"}
            </Typography>

            {/* ===== #131: Verfuegbarkeitsstatus ===== */}
            <Box sx={{ my: 2 }}>
              <StatusBadge status={gegenstand.verfuegbarkeitsstatus} />
            </Box>
            {/* ===== Ende #131 ===== */}

            {/* PLATZHALTER (Story Ausleihprozess): Anzahl + Aktion, bewusst disabled */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Select size="small" defaultValue="" displayEmpty disabled sx={{ minWidth: 100 }}>
                <MenuItem value="" disabled>Anzahl</MenuItem>
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
              </Select>
              <Button variant="contained" disabled>
                Zur Anfrage hinzufügen
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}