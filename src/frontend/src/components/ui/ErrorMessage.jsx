import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

// Fehlermeldung.
export default function ErrorMessage({ title = "Fehler", message }) {
  return (
    <Alert severity="error">
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
}
