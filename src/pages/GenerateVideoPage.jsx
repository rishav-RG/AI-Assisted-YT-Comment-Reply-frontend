import { useEffect, useMemo, useState } from "react";

import { backendApi } from "../api/backendApi";
import StatusPill from "../components/StatusPill";
import { useAppState } from "../state/AppStateProvider";

export default function GenerateVideoPage() {
  const { state, addHistory } = useAppState();

  const [videoId, setVideoId] = useState("");
  const [forceRegenerate, setForceRegenerate] = useState(false);
  const [topK, setTopK] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!videoId && Array.isArray(state.lastSync?.videos) && state.lastSync.videos.length > 0) {
      setVideoId(String(state.lastSync.videos[0]));
    }
  }, [state.lastSync, videoId]);

  const status = useMemo(() => {
    if (loading) {
      return { kind: "running", label: "Generation in progress" };
    }
    if (error) {
      return { kind: "error", label: error };
    }
    if (summary) {
      return { kind: "ok", label: "Generation completed" };
    }
    return { kind: "idle", label: "Waiting for execution" };
  }, [loading, error, summary]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSummary(null);

    const parsedVideoId = Number(videoId);
    if (!Number.isInteger(parsedVideoId) || parsedVideoId <= 0) {
      setError("Video ID must be a positive integer.");
      return;
    }

    let parsedTopK = null;
    if (topK.trim()) {
      parsedTopK = Number(topK);
      if (!Number.isInteger(parsedTopK) || parsedTopK <= 0) {
        setError("top_k must be a positive integer when provided.");
        return;
      }
    }

    setLoading(true);

    try {
      const data = await backendApi.generateForVideo(parsedVideoId, {
        forceRegenerate,
        topK: parsedTopK
      });

      const resultSummary = data?.summary || null;
      setSummary(resultSummary);
      addHistory({
        type: "generate-video",
        summary: `Video ${parsedVideoId}: generated ${resultSummary?.generated ?? 0}, failed ${resultSummary?.failed ?? 0}`,
        meta: { forceRegenerate, topK: parsedTopK }
      });
    } catch (apiError) {
      const message = apiError?.message || "Video generation failed";
      setError(message);
      addHistory({
        type: "generate-video",
        summary: `Video ${parsedVideoId} failed: ${message}`,
        meta: { forceRegenerate, topK: parsedTopK }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <h2>Generate Replies by Video</h2>
        <p>Endpoint mapping: POST /rag/generate/video/{"{video_id}"}</p>
      </header>

      <article className="panel">
        <form className="form-grid" onSubmit={submit}>
          <label>
            <span>Video ID (DB id from sync response)</span>
            <input
              type="number"
              min="1"
              placeholder="Example: 2"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
            />
          </label>

          <label>
            <span>top_k (optional)</span>
            <input
              type="number"
              min="1"
              placeholder="Leave empty to use backend default"
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
            />
          </label>

          <label className="switch-row">
            <input
              type="checkbox"
              checked={forceRegenerate}
              onChange={(e) => setForceRegenerate(e.target.checked)}
            />
            <span>force_regenerate</span>
          </label>

          <div className="row">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate for video"}
            </button>
            <StatusPill status={status.kind} label={status.label} />
          </div>
        </form>
      </article>

      <article className="panel">
        <h3>Generation summary</h3>
        {summary ? (
          <div className="metrics-grid">
            <div className="metric">
              <span>Video ID</span>
              <strong>{summary.video_id}</strong>
            </div>
            <div className="metric">
              <span>Scanned</span>
              <strong>{summary.scanned}</strong>
            </div>
            <div className="metric">
              <span>Generated</span>
              <strong>{summary.generated}</strong>
            </div>
            <div className="metric">
              <span>Skipped existing</span>
              <strong>{summary.skipped_existing_reply}</strong>
            </div>
            <div className="metric">
              <span>Skipped creator</span>
              <strong>{summary.skipped_creator}</strong>
            </div>
            <div className="metric">
              <span>Failed</span>
              <strong>{summary.failed}</strong>
            </div>
            <div className="metric">
              <span>Indexed chunks</span>
              <strong>{summary.index?.indexed ?? 0}</strong>
            </div>
            <div className="metric">
              <span>Skipped chunks</span>
              <strong>{summary.index?.skipped ?? 0}</strong>
            </div>
          </div>
        ) : (
          <p>No summary yet.</p>
        )}
      </article>
    </section>
  );
}