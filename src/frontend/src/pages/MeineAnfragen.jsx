import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { StatusBadge, HintBox, ErrorMessage } from "../components/ui";

// Vite-Proxy: /api -> http://localhost:8000 (kein nginx im lokalen Dev nötig)
const API_URL = '/api/lending/anfragen/meine_anfragen/';

// Ladezustände als expliziter State-Automat, statt mehrerer Boolean-Flags
const Zustand = {
  LADEN: 'laden',
  FEHLER: 'fehler',
  FERTIG: 'fertig',
};

function formatDatum(iso) {
  if (!iso) return '–';
  // Mockup-Format: 13.04.2026 (mit fuehrenden Nullen)
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function MeineAnfragen({ onNeueAnfrage }) {
  const [anfragen, setAnfragen] = useState([]);
  const [zustand, setZustand] = useState(Zustand.LADEN);

  useEffect(() => {
    // Guard gegen setState nach Unmount (z. B. schneller Seitenwechsel)
    let aktiv = true;
    setZustand(Zustand.LADEN);

    fetch(API_URL, {
      headers: { Accept: 'application/json' },
      credentials: 'include', // Session-Cookie fuer die Authentifizierung
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!aktiv) return;
        setAnfragen(Array.isArray(data) ? data : []);
        setZustand(Zustand.FERTIG);
      })
      .catch(() => {
        if (!aktiv) return;
        setZustand(Zustand.FEHLER);
      });

    return () => {
      aktiv = false;
    };
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      {/* Kopfzeile: IMMER sichtbar — damit "Neue Anfrage" auch bei leerer Liste
          (und während Laden/Fehler) erreichbar bleibt. */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h5" component="h1">
          Anfragen
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          {/* Suche: NUR Darstellung gemaess Mockup. Keine Filterlogik in #126
              (wie schon bei #125) - kommt als eigene Issue. Bewusst inert. */}
          <TextField
            size="small"
            placeholder="Suche"
            aria-label="Anfragen durchsuchen"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 240 }}
          />


        </Stack>
      </Box>

      {/* --- Ladezustand --- */}
      {zustand === Zustand.LADEN && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Anfragen werden geladen" />
        </Box>
      )}

      {/* --- Fehlerzustand --- */}
      {zustand === Zustand.FEHLER && (
        <ErrorMessage message="Die Anfragen konnten nicht geladen werden. Bitte später erneut versuchen." />
      )}

      {/* --- AK5: keine Anfragen vorhanden --- */}
      {zustand === Zustand.FERTIG && anfragen.length === 0 && (
        <HintBox message="Du hast noch keine Ausleihanfragen gestellt." />
      )}

      {/* --- AK1 + AK2: Liste mit Status (Spalten gemaess Mockup) --- */}
      {zustand === Zustand.FERTIG && anfragen.length > 0 && (
        <TableContainer component={Paper} elevation={0}>
          <Table aria-label="Übersicht meiner Ausleihanfragen">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Organisation</TableCell>
                <TableCell>Eingereicht am</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {anfragen.map((anfrage) => (
                <TableRow key={anfrage.id} hover>
                  {/* Mockup-Spalte "Name": Gegenstandsname (sinnvollster Wert fuer die Nutzerin).
                      Alternativ streng nach Mockup-Text: `Anfrage #${anfrage.id}` */}
                  <TableCell>{anfrage.gegenstand_name}</TableCell>
                  <TableCell>
                    {/* anfragestatus ist der Code (z. B. "genehmigt") */}
                    <StatusBadge status={anfrage.anfragestatus} />
                  </TableCell>
                  <TableCell>{anfrage.organisation_name}</TableCell>
                  <TableCell>{formatDatum(anfrage.erstellt_am)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}