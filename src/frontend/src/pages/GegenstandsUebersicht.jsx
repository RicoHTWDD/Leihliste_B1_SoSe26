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
  FormControlLabel,
  Switch,
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
// Status bleibt als Spalte erhalten (Badge); gefiltert wird er über den
// Verfügbarkeitsschalter (#122), nicht über ein eigenes Dropdown.
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
  // Drei unabhängige Filter, die kombiniert wirken (UND-Verknüpfung).
  // 'alle' = Dropdown-Filter inaktiv; false = Verfügbarkeitsfilter inaktiv.
  const [kategorieFilter, setKategorieFilter] = useState('alle');
  const [standortFilter, setStandortFilter] = useState('alle');
  // Verfügbarkeitsfilter (#122): true = nur Exemplare anzeigen, deren
  // (abgeleiteter) Anzeige-Status 'verfuegbar' ist.
  const [nurVerfuegbar, setNurVerfuegbar] = useState(false);
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

  // Kategorien dynamisch aus den Daten (für das Kategorie-Dropdown)
  const kategorien = useMemo(
    () => [...new Set(gegenstaende.map((g) => g.kategorie))].sort((a, b) => a.localeCompare(b, 'de')),
    [gegenstaende]
  );

  // Standorte dynamisch aus den Daten (für das Standort-Dropdown)
  const standorte = useMemo(
    () =>
      [...new Set(gegenstaende.map((g) => g.standort).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'de')
      ),
    [gegenstaende]
  );

  // Filtern + Sortieren – clientseitig, solange das Backend keine Query-
  // Parameter kennt (Backend-Filterlogik: #120). Alle Filter wirken
  // kombiniert (UND-Verknüpfung).
  const sichtbar = useMemo(() => {
    let liste = gegenstaende;

    if (suche.trim()) {
      const q = suche.trim().toLowerCase();
      liste = liste.filter((g) => g.name.toLowerCase().includes(q));
    }
    if (nurVerfuegbar) {
      // #122: "Nur verfügbare Gegenstände anzeigen" — verglichen wird der
      // Anzeige-Status; 'ausgeliehen', 'reserviert', 'defekt' usw. fallen raus.
      // Clientseitig, bis die Backend-Filterlogik (#120) einen Query-Parameter
      // anbietet (Umstellung dann zentral in fetchGegenstaende).
      liste = liste.filter((g) => g.status === 'verfuegbar');
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
  }, [gegenstaende, suche, nurVerfuegbar, kategorieFilter, standortFilter, sortierung]);

  // Steuert den Disabled-Zustand des Zurücksetzen-Buttons: aktiv, sobald
  // mindestens ein Filter etwas bewirken kann.
  const filterAktiv =
    nurVerfuegbar || kategorieFilter !== 'alle' || standortFilter !== 'alle';

  // Zurücksetzen-Button (#122). Bewusste Auslegung: Der Button setzt ALLE
  // Filter zurück (Verfügbarkeit, Kategorie, Standort) — bei drei Filter-
  // Bedienelementen wäre ein Reset nur für den Schalter irritierend.
  // Die Suche bleibt unberührt: sie ist eine Suche, kein Filter im Sinne
  // der Story.
  function filterZuruecksetzen() {
    setNurVerfuegbar(false);
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

          {/* Filter 2: Standort (rechts) — kombinierbar mit dem Kategorie-Filter */}
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

      {/* Verfügbarkeitsfilter (#122): "Checkbox oder Schalter" laut
          Beschreibung — der Switch kommuniziert das Ein-/Ausschalten besser.
          Eigene Zeile unterhalb der Kopfzeile, damit diese nicht überläuft. */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={nurVerfuegbar}
              onChange={(e) => setNurVerfuegbar(e.target.checked)}
            />
          }
          label="Nur verfügbare Gegenstände anzeigen"
        />
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