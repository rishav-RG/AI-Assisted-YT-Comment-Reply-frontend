import { useEffect, useState } from "react";
import {
  SignedIn,
  SignedOut,
  UserButton,
  useAuth
} from "@clerk/clerk-react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLoader from "./components/AppLoader";
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

function ProtectedRoute({ children }) {
  const { isSignedIn } = useAuth();
  const location = useLocation();

  // enable this check to bypass login for other routes
  if (import.meta.env.VITE_DISABLE_AUTH === 'true') {
    return children;
  }

  if (!isSignedIn) {
    const from = `${location.pathname}${location.search}`;

    return (
      <Navigate
        to={`/sign-in?from=${encodeURIComponent(from)}`}
        replace
      />
    );
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  const fromPath = `${location.pathname}${location.search}`;
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const stored = localStorage.getItem("yt-theme");
    if (stored === "dark" || stored === "light") {
      return stored;
    }

    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.dataset.theme = theme;
    localStorage.setItem("yt-theme", theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

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
              <NavLink
                className="btn ghost auth-btn"
                to={`/sign-in?from=${encodeURIComponent(fromPath)}`}
              >
                Log in
              </NavLink>
              <NavLink
                className="btn auth-btn"
                to={`/sign-up?from=${encodeURIComponent(fromPath)}`}
              >
                Sign up
              </NavLink>
            </SignedOut>

            <SignedIn>
              <div className="auth-user-pill">
                <span className="auth-user-label">Account</span>
                <UserButton afterSignOutUrl="/sign-in" />
              </div>
            </SignedIn>

            <button
              type="button"
              className="theme-toggle"
              onClick={handleThemeToggle}
              aria-pressed={theme === "dark"}
              aria-label="Toggle dark theme"
            >
              <span className="theme-toggle-label">
                {theme === "dark" ? "Dark" : "Light"}
              </span>
              <span className="theme-toggle-track" aria-hidden="true">
                <span className="theme-toggle-thumb" />
              </span>
            </button>
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
            <Route
              path="/overview"
              element={(
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/sync"
              element={(
                <ProtectedRoute>
                  <SyncPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/generate/video"
              element={(
                <ProtectedRoute>
                  <GenerateVideoPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/generate/comment"
              element={(
                <ProtectedRoute>
                  <GenerateCommentPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/activity"
              element={(
                <ProtectedRoute>
                  <ActivityPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/oauth/callback"
              element={(
                <ProtectedRoute>
                  <OAuthCallbackPage />
                </ProtectedRoute>
              )}
            />
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
  const { isLoaded } = useAuth();

  // added to make sure app loads only after clerk auth successfully loaded 
  if (!isLoaded) {
    return <AppLoader />;
  }

  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}