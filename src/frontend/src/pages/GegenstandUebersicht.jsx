import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  Avatar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableSortLabel,
  CircularProgress,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';

import StatusBadge from '../components/ui/StatusBadge';
import ErrorMessage from '../components/ui/ErrorMessage';
import HintBox from '../components/ui/HintBox';

// ---------------------------------------------------------------------------
// Datenquelle
// Backend-Endpoint (App "inventory"): GET /api/inventory/alle-exemplare/
// Antwort ist DRF-paginiert: { count, next, previous, results: [...] }.
// Zentrale Stelle für den Datenzugriff — die UI darunter bleibt davon unberührt.
// ---------------------------------------------------------------------------
async function fetchGegenstaende() {
  // Relativer Pfad: der Vite-Dev-Server proxyt /api auf Django (Port 8000).
  const res = await fetch('/api/inventory/alle-exemplare/');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const daten = await res.json();

  // Nur die im Frontend benötigten Felder übernehmen.
  // Hinweis: Es wird die erste Seite geladen. Bei mehr Exemplaren als die
  // DRF-Page-Size müsste hier über "next" nachgeladen werden.
  return daten.results.map((exemplar) => ({
    id: exemplar.id,
    name: exemplar.name,
    status: exemplar.verfuegbarkeitsstatus, // 'verfuegbar' | 'nicht_verfuegbar'
    kategorie: exemplar.kategorie,          // vom Backend über den Gegenstandstyp aufgelöst
    standort: exemplar.standort,            // ebenfalls über den Gegenstandstyp aufgelöst
    bildUrl: null,                          // liefert das Backend (noch) nicht
  }));
}

// Spaltendefinition für die sortierbaren Kopfzellen
const SPALTEN = [
  { feld: 'name', label: 'Name' },
  { feld: 'status', label: 'Status' },
  { feld: 'kategorie', label: 'Kategorie' },
  { feld: 'standort', label: 'Standort' },
];

export default function GegenstandUebersicht({ onSelectGegenstand, onAddAusleihe }) {
  const [gegenstaende, setGegenstaende] = useState([]);
  const [ladestatus, setLadestatus] = useState('laedt'); // 'laedt' | 'fertig' | 'fehler'

  const [suche, setSuche] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [kategorieFilter, setKategorieFilter] = useState('alle');
  const [sortierung, setSortierung] = useState({ feld: 'name', richtung: 'asc' });
  const [ausgewaehlt, setAusgewaehlt] = useState([]);

  // Daten laden
  useEffect(() => {
    let aktiv = true;
    setLadestatus('laedt');
    fetchGegenstaende()
      .then((daten) => {
        if (!aktiv) return;
        setGegenstaende(daten);
        setLadestatus('fertig');
      })
      .catch(() => {
        if (aktiv) setLadestatus('fehler');
      });
    return () => {
      aktiv = false;
    };
  }, []);

  // Kategorien dynamisch aus den Daten (für das Filter-Dropdown)
  const kategorien = useMemo(
    () => [...new Set(gegenstaende.map((g) => g.kategorie))].sort((a, b) => a.localeCompare(b, 'de')),
    [gegenstaende]
  );

  // Filtern + Sortieren – clientseitig, solange das Backend keine Query-Parameter kennt
  const sichtbar = useMemo(() => {
    let liste = gegenstaende;

    if (suche.trim()) {
      const q = suche.trim().toLowerCase();
      liste = liste.filter((g) => g.name.toLowerCase().includes(q));
    }
    if (statusFilter !== 'alle') {
      liste = liste.filter((g) => g.status === statusFilter);
    }
    if (kategorieFilter !== 'alle') {
      liste = liste.filter((g) => g.kategorie === kategorieFilter);
    }

    const faktor = sortierung.richtung === 'asc' ? 1 : -1;
    return [...liste].sort((a, b) => {
      const wertA = String(a[sortierung.feld] ?? '');
      const wertB = String(b[sortierung.feld] ?? '');
      return wertA.localeCompare(wertB, 'de') * faktor;
    });
  }, [gegenstaende, suche, statusFilter, kategorieFilter, sortierung]);

  function sortierenNach(feld) {
    setSortierung((prev) =>
      prev.feld === feld
        ? { feld, richtung: prev.richtung === 'asc' ? 'desc' : 'asc' }
        : { feld, richtung: 'asc' }
    );
  }

  function auswahlUmschalten(id) {
    setAusgewaehlt((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function alleUmschalten() {
    setAusgewaehlt((prev) =>
      prev.length === sichtbar.length ? [] : sichtbar.map((g) => g.id)
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Box sx={{ p: 3 }}>
      {/* Kopfzeile: Titel + Suche + Filter + Aktion */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" component="h1" fontWeight={700}>
          Gegenstände
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
          <TextField
            size="small"
            placeholder="Suche"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 220 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="alle">Alle Status</MenuItem>
              <MenuItem value="verfuegbar">Verfügbar</MenuItem>
              <MenuItem value="nicht_verfuegbar">Nicht verfügbar</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={kategorieFilter}
              onChange={(e) => setKategorieFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="alle">Alle Kategorien</MenuItem>
              {kategorien.map((k) => (
                <MenuItem key={k} value={k}>
                  {k}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddAusleihe}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Ausleihe hinzufügen
          </Button>
        </Stack>
      </Stack>

      {/* Ladezustand */}
      {ladestatus === 'laedt' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Fehlerzustand – nutzt die ErrorMessage-Komponente (#140) */}
      {ladestatus === 'fehler' && (
        <ErrorMessage message="Die Gegenstände konnten nicht geladen werden. Bitte später erneut versuchen." />
      )}

      {/* Erfolgsfall */}
      {ladestatus === 'fertig' && (
        <Paper variant="outlined">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        ausgewaehlt.length > 0 && ausgewaehlt.length < sichtbar.length
                      }
                      checked={sichtbar.length > 0 && ausgewaehlt.length === sichtbar.length}
                      onChange={alleUmschalten}
                    />
                  </TableCell>
                  <TableCell />{/* Bild */}
                  {SPALTEN.map((spalte) => (
                    <TableCell key={spalte.feld}>
                      <TableSortLabel
                        active={sortierung.feld === spalte.feld}
                        direction={
                          sortierung.feld === spalte.feld ? sortierung.richtung : 'asc'
                        }
                        onClick={() => sortierenNach(spalte.feld)}
                      >
                        {spalte.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {sichtbar.map((g) => {
                  const istVerfuegbar = g.status === 'verfuegbar';
                  return (
                    <TableRow
                      key={g.id}
                      hover
                      selected={ausgewaehlt.includes(g.id)}
                      onClick={() => onSelectGegenstand?.(g.id)}
                      // Nicht verfügbare Zeilen optisch zurücknehmen (wie im Mockup)
                      sx={{ opacity: istVerfuegbar ? 1 : 0.5, cursor: 'pointer' }}
                    >
                      {/* stopPropagation: Klick auf die Checkbox öffnet NICHT die Detailseite */}
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={ausgewaehlt.includes(g.id)}
                          onChange={() => auswahlUmschalten(g.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Avatar variant="rounded" src={g.bildUrl || undefined}>
                          <ImageIcon fontSize="small" />
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{g.name}</TableCell>
                      <TableCell>
                        {/* StatusBadge aus #140 — siehe Hinweis zu den Status-Schlüsseln */}
                        <StatusBadge status={g.status} />
                      </TableCell>
                      <TableCell>{g.kategorie}</TableCell>
                      <TableCell>{g.standort || '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Leeres Filterergebnis – nutzt die HintBox-Komponente (#140) */}
          {sichtbar.length === 0 && (
            <Box sx={{ p: 2 }}>
              <HintBox message="Keine Gegenstände gefunden. Suche oder Filter anpassen." />
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}