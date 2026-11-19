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
import {
  ermittleAnzeigeStatus,
  ermittleZusatzinfo,
} from "../utils/anzeigeStatus";

import { apiRequest } from "../utils/inventarApi.js";
import { bildAdresse } from "../utils/bildAdresse.js";

const API_BASE = "/api/inventory/exemplare";

export default function GegenstandDetail({
  gegenstandId, onBack, onTypAnzeigen, onBearbeiten, onLoeschen, canManageInventory,
}) {
  const [gegenstand, setGegenstand] = useState(null);
  const [ladevorgang, setLadevorgang] = useState(true);
  const [fehler, setFehler] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest(`${API_BASE}/${gegenstandId}/`, { signal: controller.signal })
      .then((daten) => {
        if (!controller.signal.aborted) setGegenstand(daten);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setFehler(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLadevorgang(false);
      });
    return () => controller.abort();
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
        <ErrorMessage message={fehler} />
        <Button onClick={onBack}>Zurück</Button>
      </Box>
    );
  }

  // --- Nicht gefunden ---
  if (!gegenstand) {
    return (
      <Box sx={{ p: 2 }}>
        <ErrorMessage message="Gegenstand nicht gefunden." />
        <Button onClick={onBack}>Zurück</Button>
      </Box>
    );
  }

  const name = gegenstand.name ?? gegenstand.inventarnummer;
  const bildUrl = bildAdresse(gegenstand.bild);
  const anzeigeStatus = ermittleAnzeigeStatus(gegenstand);
  const zusatzinfo = ermittleZusatzinfo(gegenstand);

  return (
    <Box sx={{ p: 2 }}>
      {/* Breadcrumb-Titel: Gegenstände - {Kategorie} - {Name} */}
      <Typography variant="h6" component="div" sx={{ fontWeight: 700, mb: 2 }}>
        Gegenstände{gegenstand.kategorie ? ` - ${gegenstand.kategorie}` : ""} - {name}
      </Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        {/* Zurück zur Gegenstandsübersicht */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ color: "text.secondary", mb: 2 }}
        >
          Zurück
        </Button>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {bildUrl && (
            <Box component="img" src={bildUrl} alt={`Foto von ${name}, ${gegenstand.inventarnummer}`}
              sx={{ width: { xs: '100%', md: 280 }, maxHeight: 300, objectFit: 'contain', alignSelf: 'flex-start' }} />
          )}

          {/* Rechte Spalte */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              {name}
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
              Inventarnummer: {gegenstand.inventarnummer}
            </Typography>
            <Typography variant="body2">Zustand: {gegenstand.zustand_display ?? gegenstand.zustand}</Typography>
            {gegenstand.standort && (
              <Typography variant="body2">Standort: {gegenstand.standort}</Typography>
            )}
            {gegenstand.gegenstandstyp != null && onTypAnzeigen && (
              <Button onClick={() => onTypAnzeigen(gegenstand.gegenstandstyp, gegenstand)}>
                Gegenstandstyp anzeigen
              </Button>
            )}
            {canManageInventory && (
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button variant="outlined" onClick={() => onBearbeiten(gegenstand)}>Bearbeiten</Button>
                <Button color="error" onClick={() => onLoeschen(gegenstand)}>Löschen</Button>
              </Stack>
            )}

            {/* ===== #131: Verfuegbarkeitsstatus ===== */}
            <Box sx={{ my: 2 }}>
              <StatusBadge status={anzeigeStatus} />

              {zusatzinfo && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {zusatzinfo}
                </Typography>
              )}
            </Box>
            {/* ===== Ende #131 ===== */}

            {/* PLATZHALTER (Story Ausleihprozess): Anzahl + Aktion, bewusst disabled */}
            <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: "center" }}>
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
