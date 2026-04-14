import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import SyncPage from "./pages/SyncPage";
import GenerateVideoPage from "./pages/GenerateVideoPage";
import GenerateCommentPage from "./pages/GenerateCommentPage";
import ActivityPage from "./pages/ActivityPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import { AppStateProvider } from "./state/AppStateProvider";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/sync", label: "Sync" },
  { to: "/generate/video", label: "Generate by Video" },
  { to: "/generate/comment", label: "Generate by Comment" },
  { to: "/activity", label: "Activity" }
];

function Shell() {
  return (
    <div className="app-shell">
      <div className="aurora aurora-a" aria-hidden />
      <div className="aurora aurora-b" aria-hidden />

      <header className="app-header reveal">
        <div>
          <p className="eyebrow">React Control Panel</p>
          <h1>YouTube Reply Ops</h1>
          <p className="subtitle">
            OAuth connect, sync channel data, and run RAG reply generation against the existing FastAPI backend.
          </p>
        </div>
      </header>

      <div className="app-body">
        <aside className="side-nav reveal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </aside>

        <main className="content reveal">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/sync" element={<SyncPage />} />
            <Route path="/generate/video" element={<GenerateVideoPage />} />
            <Route path="/generate/comment" element={<GenerateCommentPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}