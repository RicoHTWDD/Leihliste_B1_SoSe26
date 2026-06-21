import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

// Neutraler Hinweis für leere Zustände (z. B. keine Treffer, keine Anfragen).
export default function HintBox({ title, message, children }) {
  return (
    <Alert severity="info">
      {title && <AlertTitle>{title}</AlertTitle>}
      {message}
      {children}
    </Alert>
  );
}
