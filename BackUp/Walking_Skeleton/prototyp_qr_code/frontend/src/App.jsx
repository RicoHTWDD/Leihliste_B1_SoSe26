// App.jsx
// Hauptkomponente der React App.
// Zeigt ein Eingabefeld für den Gegenstandsnamen,
// schickt ihn ans Django Backend und zeigt den
// zurückkommenden QR-Code als Bild an.

import { useState } from "react";

function App() {

  // Zustandsvariablen
  // name     = was der Nutzer ins Eingabefeld tippt
  // qrCode   = Base64 String des QR-Bildes vom Backend
  // loading  = true während auf Backend gewartet wird
  // fehler   = Fehlermeldung falls etwas schiefgeht
  const [name, setName] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fehler, setFehler] = useState(null);

  // Funktion: QR-Code vom Backend anfordern
  // Wird aufgerufen wenn Nutzer auf "QR generieren" klickt
  const qrCodeAnfordern = async () => {

    // Prüfe ob Eingabefeld leer ist
    if (!name.trim()) {
      setFehler('Bitte einen Gegenstandsnamen eingeben');
      return;
    }

    // Ladezustand starten
    setLoading(true);
    setFehler(null);
    setQrCode(null);

    try {
      // HTTP POST Request ans Django Backend schicken
      // Datenformat: JSON mit dem Gegenstandsnamen
      const antwort = await fetch('http://localhost:8000/api/qr/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // JSON.stringify wandelt JavaScript Objekt → JSON Text
        // { name: "Laptop-001" } → '{"name":"Laptop-001"}'
        body: JSON.stringify({ name: name })
      });

      // Prüfe ob Backend erfolgreich geantwortet hat
      if (!antwort.ok) {
        throw new Error('Backend hat einen Fehler zurückgegeben');
      }

      // JSON Antwort vom Backend lesen
      // Format: {"qr_code": "iVBORw0KGgo...", "name": "Laptop-001"}
      const daten = await antwort.json();

      // Base64 QR-Code in State speichern
      setQrCode(daten.qr_code);

    } catch (fehler) {
      // Fehlerbehandlung — z.B. Backend nicht erreichbar
      setFehler('Fehler: ' + fehler.message);
    } finally {
      // Ladezustand beenden
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>LeihListe – QR-Code Prototyp</h1>

      {/* Eingabefeld für Gegenstandsname */}
      <input
        type="text"
        placeholder="Gegenstandsname z.B. Laptop-001"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* Button zum Auslösen der QR Generierung */}
      <button
        onClick={qrCodeAnfordern}
        disabled={loading}
      >
        {loading ? 'Generiere...' : 'QR-Code generieren'}
      </button>

      {/* Fehlermeldung anzeigen falls vorhanden */}
      {fehler && <p style={{ color: 'red' }}>{fehler}</p>}

      {/* QR-Code Bild anzeigen falls vorhanden */}
      {qrCode && (
        <div>
          <h2>QR-Code für: {name}</h2>
          {/*
            Base64 Bild direkt in img src einbetten
            Format: data:image/png;base64,[Base64 String]
          */}
          <img
            src={`data:image/png;base64,${qrCode}`}
            alt={`QR-Code für ${name}`}
          />
        </div>
      )}
    </div>
  );
}

export default App;