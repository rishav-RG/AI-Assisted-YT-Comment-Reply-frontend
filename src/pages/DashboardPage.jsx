import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { backendApi, OAUTH_MESSAGE_SOURCE, oauthStartUrl } from "../api/backendApi";
import StatCard from "../components/StatCard";
import StatusPill from "../components/StatusPill";
import { useAppState } from "../state/AppStateProvider";

export default function DashboardPage() {
  const { state, setHealthCheck, markConnected, addHistory } = useAppState();
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [oauthStatus, setOauthStatus] = useState({
    kind: state.connectedHint ? "connected" : "idle",
    label: state.connectedHint ? "Connected" : "Ready to connect"
  });

  const popupRef = useRef(null);
  const popupWatchRef = useRef(null);

  const healthStatus = state.lastHealth?.status || "idle";
  const healthMessage = state.lastHealth?.message || "Not checked yet";

  const runHealthCheck = async () => {
    setCheckingHealth(true);

    try {
      const data = await backendApi.getHealth();
      const message = data?.message || "Backend reachable";
      setHealthCheck({ status: "ok", message });
      addHistory({ type: "health-check", summary: message });
    } catch (error) {
      const message = error?.message || "Failed to reach backend";
      setHealthCheck({ status: "error", message });
      addHistory({ type: "health-check", summary: `Failed: ${message}` });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    function onMessage(event) {
      if (event.origin !== window.location.origin) {
        return;
      }

      const payload = event.data;
      if (!payload || payload.source !== OAUTH_MESSAGE_SOURCE || payload.type !== "oauth-complete") {
        return;
      }

      if (payload.ok) {
        markConnected(true);
        setOauthStatus({ kind: "connected", label: "OAuth callback completed" });
        addHistory({ type: "oauth", summary: "OAuth callback completed automatically in popup" });
      } else {
        setOauthStatus({ kind: "error", label: payload.message || "OAuth callback failed" });
        addHistory({
          type: "oauth",
          summary: `OAuth callback failed: ${payload.message || "unknown error"}`
        });
      }
    }

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [addHistory, markConnected]);

  useEffect(() => {
    return () => {
      if (popupWatchRef.current) {
        window.clearInterval(popupWatchRef.current);
      }
    };
  }, []);

  const startPopupWatcher = () => {
    if (popupWatchRef.current) {
      window.clearInterval(popupWatchRef.current);
    }

    popupWatchRef.current = window.setInterval(() => {
      const popup = popupRef.current;
      if (!popup) {
        return;
      }

      if (popup.closed) {
        window.clearInterval(popupWatchRef.current);
        popupWatchRef.current = null;

        setOauthStatus((prev) => {
          if (prev.kind === "connected" || prev.kind === "error") {
            return prev;
          }
          return {
            kind: "warning",
            label: "Popup closed. Use manual confirm if needed."
          };
        });
      }
    }, 500);
  };

  const openOAuth = () => {
    const popup = window.open(oauthStartUrl, "youtube_oauth", "width=560,height=740,popup=yes");
    if (!popup) {
      setOauthStatus({ kind: "error", label: "Popup blocked by browser" });
      addHistory({ type: "oauth", summary: "OAuth popup blocked by browser" });
      return;
    }

    popupRef.current = popup;
    setOauthStatus({ kind: "running", label: "OAuth popup open" });
    addHistory({ type: "oauth", summary: "Opened YouTube OAuth flow" });
    startPopupWatcher();
  };

  const confirmConnected = () => {
    markConnected(true);
    setOauthStatus({ kind: "connected", label: "Connected (manual confirm)" });
    addHistory({
      type: "oauth",
      summary: "Marked as connected in frontend. Backend callback must have returned status connected."
    });
  };

  const videoCount = Array.isArray(state.lastSync?.videos) ? state.lastSync.videos.length : 0;
  const ragCount = Array.isArray(state.lastSync?.rag) ? state.lastSync.rag.length : 0;

  return (
    <section className="page">
      <header className="page-header">
        <h2>Workflow Overview</h2>
        <p>Run the backend workflow in order: health check, OAuth connect, sync, then generation.</p>
      </header>

      <div className="stats-grid">
        <StatCard
          title="Backend"
          value={healthStatus === "ok" ? "Online" : healthStatus === "error" ? "Offline" : "Unknown"}
          status={healthStatus}
          helper={healthMessage}
        />
        <StatCard
          title="OAuth"
          value={state.connectedHint ? "Connected" : "Awaiting connect"}
          status={state.connectedHint ? "connected" : oauthStatus.kind}
          helper={
            state.connectedHint
              ? "Connected state stored in frontend"
              : "Frontend marker only; backend owns token storage"
          }
        />
        <StatCard
          title="Last Sync"
          value={`${videoCount} videos`}
          status={videoCount > 0 ? "ok" : "idle"}
          helper={ragCount > 0 ? `${ragCount} RAG summaries returned` : "No RAG summaries yet"}
        />
      </div>

      <div className="panel-grid">
        <article className="panel">
          <h3>1. Check API availability</h3>
          <p>Calls GET / through the Vite proxy and stores status in local activity history.</p>
          <div className="row">
            <button className="btn" onClick={runHealthCheck} disabled={checkingHealth}>
              {checkingHealth ? "Checking..." : "Check backend health"}
            </button>
            <StatusPill status={healthStatus} label={healthMessage} />
          </div>
        </article>

        <article className="panel">
          <h3>2. Connect YouTube OAuth</h3>
          <p>
            Opens backend endpoint GET /auth/youtube. If redirect URI points to frontend /oauth/callback,
            completion is detected automatically.
          </p>
          <div className="row">
            <button className="btn" onClick={openOAuth}>Start OAuth in popup</button>
            <button className="btn ghost" onClick={confirmConnected}>I completed callback</button>
            <StatusPill status={oauthStatus.kind} label={oauthStatus.label} />
          </div>
          <div className="oauth-hint">
            Auto-complete setup: set GOOGLE_REDIRECT_URI to http://localhost:5173/oauth/callback and
            add the same redirect URI in your Google OAuth app settings.
          </div>
        </article>

        <article className="panel">
          <h3>3. Continue to execution pages</h3>
          <p>Run sync and generation routes from dedicated pages that map directly to backend endpoints.</p>
          <div className="row">
            <Link className="btn" to="/sync">
              Go to Sync
            </Link>
            <Link className="btn ghost" to="/generate/video">
              Go to Video Generation
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}