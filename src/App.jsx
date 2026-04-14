import {
  SignedIn,
  SignedOut,
  UserButton
} from "@clerk/clerk-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import SyncPage from "./pages/SyncPage";
import GenerateVideoPage from "./pages/GenerateVideoPage";
import GenerateCommentPage from "./pages/GenerateCommentPage";
import ActivityPage from "./pages/ActivityPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import { AppStateProvider } from "./state/AppStateProvider";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/overview", label: "Overview" },
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
        <div className="header-top">
          <div>
            <p className="eyebrow">React Control Panel</p>
            <h1>YouTube Reply Ops</h1>
            <p className="subtitle">
              OAuth connect, sync channel data, and run RAG reply generation against the existing FastAPI backend.
            </p>
          </div>

          <div className="auth-controls" aria-label="Authentication Controls">
            <SignedOut>
              <NavLink className="btn ghost auth-btn" to="/sign-in">
                Log in
              </NavLink>
              <NavLink className="btn auth-btn" to="/sign-up">
                Sign up
              </NavLink>
            </SignedOut>

            <SignedIn>
              <div className="auth-user-pill">
                <span className="auth-user-label">Account</span>
                <UserButton afterSignOutUrl="/sign-in" />
              </div>
            </SignedIn>
          </div>
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
            <Route path="/" element={<HomePage />} />
            <Route path="/overview" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/sync" element={<SyncPage />} />
            <Route path="/generate/video" element={<GenerateVideoPage />} />
            <Route path="/generate/comment" element={<GenerateCommentPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
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