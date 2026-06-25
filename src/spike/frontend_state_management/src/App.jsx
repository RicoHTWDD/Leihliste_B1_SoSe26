import { createContext, useContext, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  Navigate,
} from "react-router-dom";

const AppStateContext = createContext(null);

const testGegenstaende = [
  {
    id: 1,
    name: "Mikroskop MIK-001",
    typ: "Mikroskop",
    status: "verfügbar",
    standort: "Labor A.101",
  },
  {
    id: 2,
    name: "Mikroskop MIK-002",
    typ: "Mikroskop",
    status: "ausgeliehen",
    standort: "Labor A.101",
  },
  {
    id: 3,
    name: "Mikroskop MIK-003",
    typ: "Mikroskop",
    status: "verfügbar",
    standort: "Labor B.204",
  },
  {
    id: 4,
    name: "Mikroskop MIK-004",
    typ: "Mikroskop",
    status: "verfügbar",
    standort: "Labor A.101",
  },
  {
    id: 5,
    name: "Laptop LAP-001",
    typ: "Laptop",
    status: "verfügbar",
    standort: "Büro B.204",
  },
  {
    id: 6,
    name: "Beamer BEA-001",
    typ: "Beamer",
    status: "verfügbar",
    standort: "Labor A.101",
  },
  {
    id: 7,
    name: "Tablet TAB-001",
    typ: "Tablet",
    status: "reserviert",
    standort: "Büro B.204",
  },
];

const initialAnfragen = [
  {
    id: 1,
    gegenstandName: "Mikroskop MIK-001",
    ausleiherName: "Nina Beispiel",
    status: "gesendet",
  },
  {
    id: 2,
    gegenstandName: "Laptop LAP-001",
    ausleiherName: "Max Muster",
    status: "in_bearbeitung",
  },
  {
    id: 3,
    gegenstandName: "Beamer BEA-001",
    ausleiherName: "Erika Test",
    status: "bestaetigt",
  },
];

function AppStateProvider({ children }) {
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyMicroscopes, setShowOnlyMicroscopes] = useState(false);
  const [showOnlyLaborA101, setShowOnlyLaborA101] = useState(false);

  const [anfragen, setAnfragen] = useState(initialAnfragen);

  function updateAnfrageStatus(anfrageId, neuerStatus) {
    setAnfragen((aktuelleAnfragen) =>
      aktuelleAnfragen.map((anfrage) =>
        anfrage.id === anfrageId
          ? { ...anfrage, status: neuerStatus }
          : anfrage
      )
    );
  }

  return (
    <AppStateContext.Provider
      value={{
        showOnlyAvailable,
        setShowOnlyAvailable,
        showOnlyMicroscopes,
        setShowOnlyMicroscopes,
        showOnlyLaborA101,
        setShowOnlyLaborA101,
        anfragen,
        updateAnfrageStatus,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

function useAppState() {
  return useContext(AppStateContext);
}

function Navigation() {
  return (
    <nav style={{ marginBottom: "24px" }}>
      <Link to="/gegenstaende">Gegenstände</Link>
      {" | "}
      <Link to="/anfragen">Anfragen</Link>
    </nav>
  );
}

function StatusText({ status }) {
  const statusLabels = {
    gesendet: "gesendet",
    in_bearbeitung: "in Bearbeitung",
    bestaetigt: "bestätigt",
    abgelehnt: "abgelehnt",
  };

  return <>{statusLabels[status] ?? status}</>;
}

function GegenstaendePage() {
  const {
    showOnlyAvailable,
    setShowOnlyAvailable,
    showOnlyMicroscopes,
    setShowOnlyMicroscopes,
    showOnlyLaborA101,
    setShowOnlyLaborA101,
  } = useAppState();

  const visibleGegenstaende = testGegenstaende.filter((item) => {
    if (showOnlyAvailable && item.status !== "verfügbar") {
      return false;
    }

    if (showOnlyMicroscopes && item.typ !== "Mikroskop") {
      return false;
    }

    if (showOnlyLaborA101 && item.standort !== "Labor A.101") {
      return false;
    }

    return true;
  });

  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <Navigation />

      <h1>Gegenstände</h1>

      <div>
        <label>
          <input
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={(event) => setShowOnlyAvailable(event.target.checked)}
          />
          {" "}Nur verfügbare Gegenstände anzeigen
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={showOnlyMicroscopes}
            onChange={(event) => setShowOnlyMicroscopes(event.target.checked)}
          />
          {" "}Nur Mikroskope anzeigen
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={showOnlyLaborA101}
            onChange={(event) => setShowOnlyLaborA101(event.target.checked)}
          />
          {" "}Nur Gegenstände im Labor A.101 anzeigen
        </label>
      </div>

      <p>
        Angezeigte Gegenstände: <strong>{visibleGegenstaende.length}</strong>
      </p>

      <ul>
        {visibleGegenstaende.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong> - {item.status} - {item.standort}{" "}
            <Link to={`/gegenstaende/${item.id}`}>Details öffnen</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

function GegenstandDetailPage() {
  const { id } = useParams();

  const {
    showOnlyAvailable,
    showOnlyMicroscopes,
    showOnlyLaborA101,
  } = useAppState();

  const item = testGegenstaende.find(
    (gegenstand) => gegenstand.id === Number(id)
  );

  if (!item) {
    return (
      <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
        <Navigation />
        <p>Gegenstand nicht gefunden.</p>
        <Link to="/gegenstaende">Zurück zur Übersicht</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <Navigation />

      <h1>Detailansicht Gegenstand</h1>

      <p>
        <strong>Name:</strong> {item.name}
      </p>

      <p>
        <strong>Typ:</strong> {item.typ}
      </p>

      <p>
        <strong>Status:</strong> {item.status}
      </p>

      <p>
        <strong>Standort:</strong> {item.standort}
      </p>

      <h2>Aktuelle Filter im Context</h2>

      <ul>
        <li>Nur verfügbar: {showOnlyAvailable ? "ja" : "nein"}</li>
        <li>Nur Mikroskope: {showOnlyMicroscopes ? "ja" : "nein"}</li>
        <li>Nur Labor A.101: {showOnlyLaborA101 ? "ja" : "nein"}</li>
      </ul>

      <Link to="/gegenstaende">Zurück zur Übersicht</Link>
    </main>
  );
}

function AnfragenPage() {
  const { anfragen, updateAnfrageStatus } = useAppState();

  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <Navigation />

      <h1>Anfragen</h1>

      <p>
        Hier wird getestet, ob der Anfrage-Status im React Context gespeichert
        bleibt.
      </p>

      <ul>
        {anfragen.map((anfrage) => (
          <li key={anfrage.id} style={{ marginBottom: "16px" }}>
            <strong>{anfrage.gegenstandName}</strong>
            <br />
            Ausleiher: {anfrage.ausleiherName}
            <br />
            Status: <strong><StatusText status={anfrage.status} /></strong>
            <br />
            <label>
              Status ändern:{" "}
              <select
                value={anfrage.status}
                onChange={(event) =>
                  updateAnfrageStatus(anfrage.id, event.target.value)
                }
              >
                <option value="gesendet">gesendet</option>
                <option value="in_bearbeitung">in Bearbeitung</option>
                <option value="bestaetigt">bestätigt</option>
                <option value="abgelehnt">abgelehnt</option>
              </select>
            </label>
            <br />
            <Link to={`/anfragen/${anfrage.id}`}>Details öffnen</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

function AnfrageDetailPage() {
  const { id } = useParams();
  const { anfragen, updateAnfrageStatus } = useAppState();

  const anfrage = anfragen.find((item) => item.id === Number(id));

  if (!anfrage) {
    return (
      <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
        <Navigation />
        <p>Anfrage nicht gefunden.</p>
        <Link to="/anfragen">Zurück zur Anfrageübersicht</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <Navigation />

      <h1>Detailansicht Anfrage</h1>

      <p>
        <strong>Gegenstand:</strong> {anfrage.gegenstandName}
      </p>

      <p>
        <strong>Ausleiher:</strong> {anfrage.ausleiherName}
      </p>

      <p>
        <strong>Aktueller Status:</strong>{" "}
        <StatusText status={anfrage.status} />
      </p>

      <label>
        Status ändern:{" "}
        <select
          value={anfrage.status}
          onChange={(event) =>
            updateAnfrageStatus(anfrage.id, event.target.value)
          }
        >
          <option value="gesendet">gesendet</option>
          <option value="in_bearbeitung">in Bearbeitung</option>
          <option value="bestaetigt">bestätigt</option>
          <option value="abgelehnt">abgelehnt</option>
        </select>
      </label>

      <p>
        <Link to="/anfragen">Zurück zur Anfrageübersicht</Link>
      </p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/gegenstaende" />} />
          <Route path="/gegenstaende" element={<GegenstaendePage />} />
          <Route path="/gegenstaende/:id" element={<GegenstandDetailPage />} />
          <Route path="/anfragen" element={<AnfragenPage />} />
          <Route path="/anfragen/:id" element={<AnfrageDetailPage />} />
        </Routes>
      </AppStateProvider>
    </BrowserRouter>
  );
}