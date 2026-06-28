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
} from '@mui/material';

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
  return new Date(iso).toLocaleDateString('de-DE');
}

export default function MeineAnfragen() {
  const [anfragen, setAnfragen] = useState([]);
  const [zustand, setZustand] = useState(Zustand.LADEN);

  useEffect(() => {
    // Guard gegen setState nach Unmount (z. B. schneller Seitenwechsel)
    let aktiv = true;
    setZustand(Zustand.LADEN);

    fetch(API_URL, {
      headers: { Accept: 'application/json' },
      // Nötig bei Session-Auth (Cookie). Bei Token-Auth stattdessen:
      // headers: { Accept: 'application/json', Authorization: `Token ${token}` }
      credentials: 'include',
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

  // --- Ladezustand ---
  if (zustand === Zustand.LADEN) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Anfragen werden geladen" />
      </Box>
    );
  }

  // --- Fehlerzustand ---
  if (zustand === Zustand.FEHLER) {
    return (
      <ErrorMessage message="Die Anfragen konnten nicht geladen werden. Bitte später erneut versuchen." />
    );
  }

  // --- AK5: keine Anfragen vorhanden ---
  if (anfragen.length === 0) {
    return <HintBox message="Du hast noch keine Ausleihanfragen gestellt." />;
  }

  // --- AK1 + AK2: Liste mit Status ---
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Meine Ausleihanfragen
      </Typography>

      <TableContainer component={Paper}>
        <Table aria-label="Übersicht meiner Ausleihanfragen">
          <TableHead>
            <TableRow>
              <TableCell>Gegenstand</TableCell>
              <TableCell>Von</TableCell>
              <TableCell>Bis</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {anfragen.map((anfrage) => (
              <TableRow key={anfrage.id} hover>
                <TableCell>{anfrage.gegenstand_name}</TableCell>
                <TableCell>{formatDatum(anfrage.startdatum)}</TableCell>
                <TableCell>{formatDatum(anfrage.enddatum)}</TableCell>
                <TableCell>
                  {/* anfragestatus ist der Code (z. B. "genehmigt") */}
                  <StatusBadge status={anfrage.anfragestatus} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
