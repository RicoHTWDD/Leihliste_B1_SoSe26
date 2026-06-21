import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { StatusBadge, HintBox } from "./components/ui";

/* Issue #125 – Anfrageübersicht mit Status (MUI).
   Nur Darstellung: Beispieldaten fest hinterlegt, keine Filter-/Sortier-Logik,
   keine Backend-Anbindung. Status wird über StatusBadge (#140) angezeigt. */

const ANFRAGEN = [
  { id: 1, name: "Anfrage 1", status: "eingereicht",         organisation: "Hochschule", eingereichtAm: "13.04.2026" },
  { id: 2, name: "Anfrage 2", status: "abgelehnt",           organisation: "Bibliothek", eingereichtAm: "13.05.2026" },
  { id: 3, name: "Anfrage 3", status: "genehmigt",           organisation: "Hochschule", eingereichtAm: "01.06.2026" },
  { id: 4, name: "Anfrage 4", status: "teilweise_abgelehnt", organisation: "Firma 3",    eingereichtAm: "17.06.2026" },
  { id: 5, name: "Anfrage 5", status: "zurueckgezogen",      organisation: "Hochschule", eingereichtAm: "28.05.2026" },
];

const SPALTEN = ["Name", "Status", "Organisation", "Eingereicht am"];

export default function Anfragen() {
  // Zum Testen des leeren Zustands: const anfragen = [];
  const anfragen = ANFRAGEN;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
          Anfragen
        </Typography>
        <TextField
          placeholder="Suche"
          size="small"
          sx={{ flex: "1 1 320px", maxWidth: 420 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {anfragen.length === 0 ? (
        <HintBox
          title="Noch keine Anfragen"
          message="Sobald du eine Ausleihanfrage stellst, erscheint sie hier."
        />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                {SPALTEN.map((spalte) => (
                  <TableCell key={spalte} sx={{ color: "text.secondary", fontWeight: 600 }}>
                    {spalte}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {anfragen.map((anfrage) => (
                <TableRow key={anfrage.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{anfrage.name}</TableCell>
                  <TableCell><StatusBadge status={anfrage.status} /></TableCell>
                  <TableCell>{anfrage.organisation}</TableCell>
                  <TableCell>{anfrage.eingereichtAm}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
