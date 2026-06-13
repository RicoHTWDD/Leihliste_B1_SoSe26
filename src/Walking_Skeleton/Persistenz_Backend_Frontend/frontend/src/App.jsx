import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

function App() {
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState("");
  const [requestingId, setRequestingId] = useState(null);

  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState("");

  function loadItems() {
    setItemsLoading(true);
    setItemsError("");

    fetch(`${API_URL}/items/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Inventar konnte nicht geladen werden.");
        }
        return response.json();
      })
      .then((data) => {
        setItems(data);
        setItemsLoading(false);
      })
      .catch((error) => {
        setItemsError(error.message);
        setItemsLoading(false);
      });
  }

function requestLoan(itemId) {
  setRequestingId(itemId);
  setItemsError("");

  const loanRequest = {
    item_id: itemId,
    start_date: "2026-06-20",
    end_date: "2026-06-25",
  };

  fetch(`${API_URL}/items/${itemId}/request-loan/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loanRequest),
  })
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.end_date?.[0] ||
          data.item_id ||
          data.detail ||
          "Ausleihe konnte nicht angefragt werden.";

        throw new Error(errorMessage);
      }

      return data;
    })
    .then((data) => {
      console.log("Ausleihanfrage erfolgreich:", data);
      loadItems();
    })
    .catch((error) => {
      setItemsError(error.message);
    })
    .finally(() => {
      setRequestingId(null);
    });
}

  function loadNotes() {
    setNotesLoading(true);
    setNotesError("");

    fetch(`${API_URL}/persistence/notes/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Notizen konnten nicht geladen werden.");
        }
        return response.json();
      })
      .then((data) => {
        setNotes(data);
        setNotesLoading(false);
      })
      .catch((error) => {
        setNotesError(error.message);
        setNotesLoading(false);
      });
  }

  function saveNote(event) {
    event.preventDefault();

    if (!noteText.trim()) {
      setNotesError("Bitte einen Text eingeben.");
      return;
    }

    setNotesError("");

    fetch(`${API_URL}/persistence/notes/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: noteText }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Notiz konnte nicht gespeichert werden.");
        }
        return response.json();
      })
      .then(() => {
        setNoteText("");
        loadNotes();
      })
      .catch((error) => {
        setNotesError(error.message);
      });
  }

  useEffect(() => {
    loadItems();
    loadNotes();
  }, []);

  return (
    <main>
      <h1>LeihListe</h1>
      <p className="subtitle">
        Walking Skeleton: React-Frontend kommuniziert mit Django-Backend und Persistenzschicht.
      </p>

      <section>
        <h2>Inventar</h2>

        {itemsLoading && <p>Inventar wird geladen...</p>}

        {itemsError && <p className="error">Fehler: {itemsError}</p>}

        {!itemsLoading && !itemsError && (
          <div className="item-list">
            {items.map((item) => (
              <section key={item.id} className="item-card">
                <h3>{item.name}</h3>

                <p>Kategorie: {item.category}</p>
                <p>Standort: {item.location}</p>
                <p>
                  Status: <span className="status">{item.status}</span>
                </p>

                <button
                  onClick={() => requestLoan(item.id)}
                  disabled={item.status !== "available" || requestingId === item.id}
                >
                  {requestingId === item.id
                    ? "Wird angefragt..."
                    : "Ausleihe anfragen"}
                </button>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="persistence-section">
        <h2>Persistenz-Nachweis</h2>
        <p>
          Diese Notizen werden über das Backend gespeichert und bleiben nach einem Server-Neustart erhalten.
        </p>

        <form onSubmit={saveNote}>
          <input
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="Notiz eingeben"
          />
          <button type="submit">Notiz speichern</button>
        </form>

        {notesLoading && <p>Notizen werden geladen...</p>}

        {notesError && <p className="error">Fehler: {notesError}</p>}

        {!notesLoading && !notesError && (
          <ul>
            {notes.map((note) => (
              <li key={note.id}>
                {note.text}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;