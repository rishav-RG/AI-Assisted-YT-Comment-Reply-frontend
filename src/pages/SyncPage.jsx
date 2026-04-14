import { useMemo, useState } from "react";

import { backendApi } from "../api/backendApi";
import StatusPill from "../components/StatusPill";
import { useAppState } from "../state/AppStateProvider";

export default function SyncPage() {
  const { state, setLastSync, addHistory } = useAppState();
  const [runRag, setRunRag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const result = state.lastSync;

  const status = useMemo(() => {
    if (loading) {
      return { kind: "running", label: "Sync running" };
    }
    if (error) {
      return { kind: "error", label: error };
    }
    if (result?.status) {
      return {
        kind: "ok",
        label: result.status
      };
    }
    return { kind: "idle", label: "No sync executed yet" };
  }, [loading, error, result]);

  const runSync = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await backendApi.syncYoutube({ runRag });
      setLastSync(data);
      addHistory({
        type: "sync",
        summary: `Sync completed with ${Array.isArray(data?.videos) ? data.videos.length : 0} videos`,
        meta: { runRag }
      });
    } catch (apiError) {
      const message = apiError?.message || "Sync failed";
      setError(message);
      addHistory({ type: "sync", summary: `Sync failed: ${message}`, meta: { runRag } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <h2>YouTube Sync</h2>
        <p>Endpoint mapping: POST /youtube/sync?run_rag=true|false</p>
      </header>

      <article className="panel">
        <form className="form-grid" onSubmit={runSync}>
          <label className="switch-row">
            <input type="checkbox" checked={runRag} onChange={(e) => setRunRag(e.target.checked)} />
            <span>Run RAG generation immediately after sync</span>
          </label>

          <div className="row">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Sync in progress..." : "Run sync"}
            </button>
            <StatusPill status={status.kind} label={status.label} />
          </div>
        </form>
      </article>

      <div className="panel-grid">
        <article className="panel">
          <h3>Synced video IDs</h3>
          {Array.isArray(result?.videos) && result.videos.length > 0 ? (
            <div className="chip-list">
              {result.videos.map((videoId) => (
                <span key={videoId} className="chip">
                  {videoId}
                </span>
              ))}
            </div>
          ) : (
            <p>No synced videos in current session.</p>
          )}
        </article>

        <article className="panel">
          <h3>RAG summary list</h3>
          {Array.isArray(result?.rag) && result.rag.length > 0 ? (
            <div className="stack-list">
              {result.rag.map((item, index) => (
                <div className="stack-item" key={`${item?.video_id || "video"}-${index}`}>
                  <p>
                    Video {item.video_id}: generated {item.generated}, failed {item.failed}, scanned {item.scanned}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>RAG summaries appear only when run_rag is enabled.</p>
          )}
        </article>
      </div>
    </section>
  );
}