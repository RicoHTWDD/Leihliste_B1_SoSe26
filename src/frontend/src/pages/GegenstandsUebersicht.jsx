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
import { ermittleAnzeigeStatus, ermittleZusatzinfo } from '../utils/anzeigeStatus';

// ---------------------------------------------------------------------------
// Datenquelle
// Backend-Endpoint (App "inventory"): GET /api/inventory/alle-exemplare/
// Antwort ist DRF-paginiert: { count, next, previous, results: [...] }.
// Zentrale Stelle für den Datenzugriff — die UI darunter bleibt davon unberührt.
//
// Statusanzeige (#121): Der Anzeige-Status wird NICHT hier abgeleitet, sondern
// zentral in utils/anzeigeStatus.js (gemeinsame Logik mit #131):
//   - liefert das Backend das abgeleitete Feld `anzeige_status`, wird es
//     direkt verwendet (Ziel-Kontrakt aus der Team-Abstimmung zu Story #18);
//   - sonst clientseitiger Fallback (defekt/verloren aus "zustand",
//     ansonsten der gespeicherte Verfügbarkeitsstatus).
// ---------------------------------------------------------------------------
async function fetchGegenstaende(statusFilter = 'alle') {
  const url = new URL(
    '/api/inventory/alle-exemplare/',
    window.location.origin
  );

  if (statusFilter === 'verfuegbar') {
    url.searchParams.set('verfuegbar', 'true');
  }

  if (statusFilter === 'nicht_verfuegbar') {
    url.searchParams.set('verfuegbar', 'false');
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const daten = await res.json();


  // Nur die im Frontend benötigten Felder übernehmen.
  // Hinweis: Es wird die erste Seite geladen. Bei mehr Exemplaren als die
  // DRF-Page-Size müsste hier über "next" nachgeladen werden.
  return daten.results.map((exemplar) => ({
    id: exemplar.id,
    name: exemplar.name,
    // 'verfuegbar' | 'ausgeliehen' | 'reserviert' | 'defekt' | 'nicht_verfuegbar'
    status: ermittleAnzeigeStatus(exemplar),
    // Statusabhängige Zusatzinfo laut Story #18: Rückgabe- bzw.
    // Reservierungsdatum. Der Standort wird hier unterdrückt, weil die
    // Übersicht dafür eine eigene Spalte hat (AK "Verfügbar -> Standort"
    // ist damit bereits erfüllt).
    zusatzinfo: ermittleZusatzinfo(exemplar, { standortAnzeigen: false }),
    kategorie: exemplar.kategorie,          // vom Backend über den Gegenstandstyp aufgelöst
    standort: exemplar.standort,            // ebenfalls über den Gegenstandstyp aufgelöst
    bildUrl: null,                          // liefert das Backend (noch) nicht
  }));
}

// Spaltendefinition für die sortierbaren Kopfzellen.
// Status bleibt als Spalte zur Anzeige und Sortierung erhalten.
// Die Filterung erfolgt separat über das Status-Dropdown.
const SPALTEN = [
  { feld: 'name', label: 'Name' },
  { feld: 'status', label: 'Status' },
  { feld: 'kategorie', label: 'Kategorie' },
  { feld: 'standort', label: 'Standort' },
];

export default function GegenstandUebersicht({ onSelectGegenstand, onAddAusleihe }) {
  const [gegenstaende, setGegenstaende] = useState([]);
  const [alleGegenstaende, setAlleGegenstaende] = useState(null);
  const [ladestatus, setLadestatus] = useState('laedt'); // 'laedt' | 'fertig' | 'fehler'

  const [suche, setSuche] = useState('');

// Drei Filter, die kombiniert wirken (UND-Verknüpfung).
// Status wird serverseitig, Kategorie und Standort clientseitig gefiltert.
// 'alle' = jeweiliger Filter inaktiv.

  const [statusFilter, setStatusFilter] = useState('alle');
  const [kategorieFilter, setKategorieFilter] = useState('alle');
  const [standortFilter, setStandortFilter] = useState('alle');
  const [sortierung, setSortierung] = useState({ feld: 'name', richtung: 'asc' });
  const [ausgewaehlt, setAusgewaehlt] = useState([]);

  // Ungefilterte Gegenstände einmal laden.
  // Dienen als Grundlage für die Kategorie- und Standortfilter.
  useEffect(() => {
    let aktiv = true;

    fetchGegenstaende('alle')
      .then((daten) => {
        if (!aktiv) return;
        setAlleGegenstaende(daten);
      })
      .catch(() => {
        if (aktiv) setLadestatus('fehler');
      });

    return () => {
      aktiv = false;
    };
  }, []);

  // Angezeigte Gegenstände abhängig vom Statusfilter laden.
  useEffect(() => {
    if (alleGegenstaende === null) return;

    // Bei "Alle" die bereits geladenen Daten verwenden.
    if (statusFilter === 'alle') {
      setGegenstaende(alleGegenstaende);
      setLadestatus('fertig');
      return;
    }

    let aktiv = true;
    setLadestatus('laedt');

    fetchGegenstaende(statusFilter)
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
  }, [statusFilter, alleGegenstaende]);

  // Kategorien dynamisch aus allen geladenen Daten.
  // Bleiben unabhängig vom aktiven Statusfilter verfügbar.
  const kategorien = useMemo(
    () => [...new Set((alleGegenstaende ?? []).map((g) => g.kategorie))].sort((a, b) => a.localeCompare(b, 'de')),
    [alleGegenstaende]
  );

  // Standorte dynamisch aus allen geladenen Daten.
  // Bleiben unabhängig vom aktiven Statusfilter verfügbar.
  const standorte = useMemo(
    () =>
      [...new Set((alleGegenstaende ?? []).map((g) => g.standort).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'de')
      ),
    [alleGegenstaende]
  );

// Suche, Kategorie und Standort werden clientseitig gefiltert.
// Der Statusfilter wird bereits beim Laden der Daten im Backend berücksichtigt.
// Kategorie- und Standort-Filter werden nacheinander angewandt => kombinierbar.

  const sichtbar = useMemo(() => {
    let liste = gegenstaende;

    if (suche.trim()) {
      const q = suche.trim().toLowerCase();
      liste = liste.filter((g) => g.name.toLowerCase().includes(q));
    }
    if (kategorieFilter !== 'alle') {
      liste = liste.filter((g) => g.kategorie === kategorieFilter);
    }
    if (standortFilter !== 'alle') {
      liste = liste.filter((g) => g.standort === standortFilter);
    }

    const faktor = sortierung.richtung === 'asc' ? 1 : -1;
    return [...liste].sort((a, b) => {
      const wertA = String(a[sortierung.feld] ?? '');
      const wertB = String(b[sortierung.feld] ?? '');
      return wertA.localeCompare(wertB, 'de') * faktor;
    });
  }, [gegenstaende, suche, kategorieFilter, standortFilter, sortierung]);

  // Prüft, ob mindestens ein Filter aktiv ist.
  const filterAktiv =
    statusFilter !== 'alle' ||
    kategorieFilter !== 'alle' ||
    standortFilter !== 'alle';

  // Setzt alle Filter zurück. Die Suche bleibt bestehen.
  function filterZuruecksetzen() {
    setStatusFilter('alle');
    setKategorieFilter('alle');
    setStandortFilter('alle');
  }

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

          {/* Filter 1: Kategorie (links) */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
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

          {/* Filter 2: Standort (mitte) — kombinierbar mit dem Kategorie-Filter */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={standortFilter}
              onChange={(e) => setStandortFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="alle">Alle Standorte</MenuItem>
              {standorte.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Filter 3: Status (rechts)*/}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="alle">Alle Gegenstände</MenuItem>
              <MenuItem value="verfuegbar">Nur verfügbar</MenuItem>
              <MenuItem value="nicht_verfuegbar">
                Nur nicht verfügbar
              </MenuItem>
            </Select>
          </FormControl>

          {/* "Ausleihe hinzufügen" führt zum Anfrageformular (Seite "Neue Anfrage"). */}
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

      {/* Button zum Zurücksetzen aller Filter */}
      <Stack
        direction="row"
        sx={{ mb: 2, justifyContent: 'flex-end' }}
      >
        <Button
          size="small"
          variant="outlined"
          disabled={!filterAktiv}
          onClick={filterZuruecksetzen}
        >
          Filter zurücksetzen
        </Button>
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
                  // Nicht verfügbare Zeilen optisch zurücknehmen (wie im Mockup) —
                  // aber pro Zelle statt pro Zeile: die Status-Zelle bleibt voll
                  // gesättigt, damit der Badge klar lesbar ist. AK aus #18:
                  // "Defekt" muss visuell deutlich von verfügbaren Gegenständen
                  // unterscheidbar sein — ein ausgegrauter roter Chip wäre das nicht.
                  const gedimmt = { opacity: istVerfuegbar ? 1 : 0.5 };
                  return (
                    <TableRow
                      key={g.id}
                      hover
                      selected={ausgewaehlt.includes(g.id)}
                      onClick={() => onSelectGegenstand?.(g.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {/* stopPropagation: Klick auf die Checkbox öffnet NICHT die Detailseite */}
                      <TableCell
                        padding="checkbox"
                        onClick={(e) => e.stopPropagation()}
                        sx={gedimmt}
                      >
                        <Checkbox
                          checked={ausgewaehlt.includes(g.id)}
                          onChange={() => auswahlUmschalten(g.id)}
                        />
                      </TableCell>
                      <TableCell sx={gedimmt}>
                        <Avatar variant="rounded" src={g.bildUrl || undefined}>
                          <ImageIcon fontSize="small" />
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, ...gedimmt }}>{g.name}</TableCell>
                      <TableCell>
                        {/* Kern von #121: aktueller Status als Badge (#140) direkt
                            in der Übersicht — sichtbar ohne die Detailansicht. */}
                        <StatusBadge status={g.status} />
                        {/* Statusabhängige Zusatzinfo (Rückgabe-/Reservierungsdatum).
                            Erscheint automatisch, sobald das Backend die Felder
                            `anzeige_status` + Datumsfelder liefert — bis dahin null. */}
                        {g.zusatzinfo && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {g.zusatzinfo}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={gedimmt}>{g.kategorie}</TableCell>
                      <TableCell sx={gedimmt}>{g.standort || '—'}</TableCell>
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