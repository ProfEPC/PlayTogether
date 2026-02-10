import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import HostPage from "./pages/HostPage";
import PlayerPage from "./pages/PlayerPage";
import AdminPage from "./pages/AdminPage";

function Nav() {
  return (
    <nav style={{ display: "flex", gap: 12, padding: 12 }}>
      {/* Home removed - host is the default entry */}
      <Link to="/host">Host</Link>
      <Link to="/player">Player</Link>
      <Link to="/admin">Admin</Link>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<HostPage />} />
        <Route path="/host" element={<HostPage />} />
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/host" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
