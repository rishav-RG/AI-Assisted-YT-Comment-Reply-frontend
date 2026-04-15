import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { backendApi, OAUTH_MESSAGE_SOURCE, oauthStartUrl } from "../api/backendApi";
import StatCard from "../components/StatCard";
import StatusPill from "../components/StatusPill";
import { useAppState } from "../state/AppStateProvider";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "most-comments", label: "Most comments" },
  { value: "most-pending", label: "Most unanswered" }
];

const FILTER_OPTIONS = [
  { value: "all", label: "All videos" },
  { value: "has-comments", label: "Has comments" },
  { value: "has-unanswered", label: "Has unanswered" },
  { value: "all-processed", label: "All processed" }
];

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function buildSearchText(video) {
  return [video.title, video.description, video.youtube_video_id, String(video.id)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function DashboardPage() {
  const { state, setHealthCheck, markConnected, addHistory } = useAppState();
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [refreshingOverview, setRefreshingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [syncingAllVideos, setSyncingAllVideos] = useState(false);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");

  const [checkingHealth, setCheckingHealth] = useState(false);
  const [oauthStatus, setOauthStatus] = useState({
    kind: state.connectedHint ? "connected" : "idle",
    label: state.connectedHint ? "Connected" : "Ready to connect"
  });

  const popupRef = useRef(null);
  const popupWatchRef = useRef(null);

  const healthStatus = state.lastHealth?.status || "idle";
  const healthMessage = state.lastHealth?.message || "Not checked yet";

  const channel = overview?.channel || null;
  const overviewStats = overview?.stats || {
    video_count: 0,
    comment_count: 0,
    pending_comment_count: 0,
    processed_comment_count: 0
  };

  const loadOverview = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadingOverview(true);
    }

    setOverviewError("");

    try {
      const payload = await backendApi.getContentOverview();
      setOverview(payload);
    } catch (error) {
      setOverviewError(error?.message || "Failed to load channel overview");
    } finally {
      if (!silent) {
        setLoadingOverview(false);
      }
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const refreshOverview = async () => {
    setRefreshingOverview(true);
    await loadOverview({ silent: true });
    setRefreshingOverview(false);
  };

  const syncChannelData = async () => {
    setSyncingAllVideos(true);
    setOverviewError("");

    try {
      const result = await backendApi.syncYoutube({ runRag: false });
      addHistory({
        type: "sync",
        summary: `Full channel sync completed with ${Array.isArray(result?.videos) ? result.videos.length : 0} videos`
      });
      await loadOverview({ silent: true });
    } catch (error) {
      const message = error?.message || "Full channel sync failed";
      setOverviewError(message);
      addHistory({ type: "sync", summary: `Full channel sync failed: ${message}` });
    } finally {
      setSyncingAllVideos(false);
    }
  };

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

  const visibleVideos = useMemo(() => {
    const source = Array.isArray(overview?.videos) ? [...overview.videos] : [];
    const normalizedSearch = search.trim().toLowerCase();

    let filtered = source;

    if (normalizedSearch) {
      filtered = filtered.filter((video) => buildSearchText(video).includes(normalizedSearch));
    }

    if (filterBy === "has-comments") {
      filtered = filtered.filter((video) => (video.comment_count || 0) > 0);
    }

    if (filterBy === "has-unanswered") {
      filtered = filtered.filter((video) => (video.pending_comment_count || 0) > 0);
    }

    if (filterBy === "all-processed") {
      filtered = filtered.filter(
        (video) => (video.comment_count || 0) > 0 && (video.pending_comment_count || 0) === 0
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === "title-asc") {
        return (a.title || "").localeCompare(b.title || "");
      }

      if (sortBy === "most-comments") {
        return (b.comment_count || 0) - (a.comment_count || 0);
      }

      if (sortBy === "most-pending") {
        return (b.pending_comment_count || 0) - (a.pending_comment_count || 0);
      }

      const left = new Date(a.created_at || 0).getTime();
      const right = new Date(b.created_at || 0).getTime();
      return sortBy === "oldest" ? left - right : right - left;
    });

    return filtered;
  }, [overview?.videos, search, sortBy, filterBy]);

  const listStatus = useMemo(() => {
    if (overviewError) {
      return { kind: "error", label: overviewError };
    }
    if (loadingOverview || refreshingOverview || syncingAllVideos) {
      return { kind: "running", label: "Refreshing channel data" };
    }
    if (!channel) {
      return { kind: "idle", label: "No synced channel found" };
    }
    return { kind: "ok", label: "Data ready" };
  }, [overviewError, loadingOverview, refreshingOverview, syncingAllVideos, channel]);

  return (
    <section className="page overview-page">
      <header className="page-header overview-hero">
        <p className="home-quick-eyebrow">Creator Studio</p>
        <h2>{channel?.channel_name || "Overview"}</h2>
        <p>
          {channel?.description || "Sync your YouTube channel to load videos, comments, and reply workflow data."}
        </p>

        <div className="row">
          <button className="btn" onClick={syncChannelData} disabled={syncingAllVideos}>
            {syncingAllVideos ? "Syncing channel..." : "Sync latest channel data"}
          </button>
          <button className="btn ghost" onClick={refreshOverview} disabled={refreshingOverview || syncingAllVideos}>
            {refreshingOverview ? "Refreshing..." : "Refresh list"}
          </button>
          <StatusPill status={listStatus.kind} label={listStatus.label} />
        </div>
      </header>

      <div className="stats-grid">
        <StatCard
          title="Videos"
          value={`${overviewStats.video_count || 0}`}
          status={(overviewStats.video_count || 0) > 0 ? "ok" : "idle"}
          helper="Synced in local database"
        />
        <StatCard
          title="Unanswered"
          value={`${overviewStats.pending_comment_count || 0}`}
          status={(overviewStats.pending_comment_count || 0) > 0 ? "warning" : "ok"}
          helper="Non-creator comments with no generated reply"
        />
        <StatCard
          title="Processed"
          value={`${overviewStats.processed_comment_count || 0}`}
          status={(overviewStats.processed_comment_count || 0) > 0 ? "connected" : "idle"}
          helper={`${overviewStats.comment_count || 0} total comments tracked`}
        />
      </div>

      <article className="panel">
        <div className="row spread">
          <h3>Video Explorer</h3>
          <StatusPill status={visibleVideos.length > 0 ? "ok" : "idle"} label={`${visibleVideos.length} visible`} />
        </div>

        <div className="video-toolbar">
          <label className="toolbar-field toolbar-search">
            <span>Search title or ID</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search videos"
            />
          </label>

          <label className="toolbar-field">
            <span>Sort</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="toolbar-field">
            <span>Filter</span>
            <select value={filterBy} onChange={(event) => setFilterBy(event.target.value)}>
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loadingOverview ? <p>Loading videos...</p> : null}
        {overviewError ? <p className="error-inline">{overviewError}</p> : null}

        {!loadingOverview && !overviewError && visibleVideos.length === 0 ? (
          <p>No videos found for the current search/filter selection.</p>
        ) : null}

        <div className="video-grid">
          {visibleVideos.map((video) => (
            <article className="video-card" key={video.id}>
              <div className="video-card-head">
                <div className="video-play-mark" aria-hidden>
                  ▶
                </div>
                <div>
                  <p className="video-meta">DB #{video.id}</p>
                  <p className="video-meta">YouTube ID: {video.youtube_video_id}</p>
                </div>
              </div>

              <h4>{video.title || "Untitled video"}</h4>
              <p className="video-description">{video.description || "No description available."}</p>

              <div className="chip-list">
                <span className="chip">Comments: {video.comment_count || 0}</span>
                <span className="chip">Unanswered: {video.pending_comment_count || 0}</span>
                <span className="chip">Processed: {video.processed_comment_count || 0}</span>
                <span className="chip">Synced: {formatDate(video.created_at)}</span>
              </div>

              <div className="video-card-actions">
                <a
                  className="btn ghost"
                  href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on YouTube
                </a>
                <Link className="btn" to={`/videos/${video.id}`}>
                  Open Video Thread
                </Link>
              </div>
            </article>
          ))}
        </div>
      </article>

      <div className="panel-grid overview-ops-grid">
        <article className="panel">
          <h3>Check API availability</h3>
          <p>Calls GET / through the Vite proxy and stores health status in local activity history.</p>
          <div className="row">
            <button className="btn" onClick={runHealthCheck} disabled={checkingHealth}>
              {checkingHealth ? "Checking..." : "Check backend health"}
            </button>
            <StatusPill status={healthStatus} label={healthMessage} />
          </div>
        </article>

        <article className="panel">
          <h3>Connect YouTube OAuth</h3>
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
          <h3>Continue to execution pages</h3>
          <p>Use generation pages for manual endpoint testing and activity tracking.</p>
          <div className="row">
            <Link className="btn" to="/sync">
              Go to Sync
            </Link>
            <Link className="btn ghost" to="/generate/comment">
              Go to Comment Generation
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