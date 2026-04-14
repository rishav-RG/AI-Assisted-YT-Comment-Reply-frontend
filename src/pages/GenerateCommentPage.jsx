import { useMemo, useState } from "react";

import { backendApi } from "../api/backendApi";
import StatusPill from "../components/StatusPill";
import { useAppState } from "../state/AppStateProvider";

export default function GenerateCommentPage() {
  const { addHistory } = useAppState();

  const [commentId, setCommentId] = useState("");
  const [forceRegenerate, setForceRegenerate] = useState(false);
  const [topK, setTopK] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const status = useMemo(() => {
    if (loading) {
      return { kind: "running", label: "Generating reply" };
    }
    if (error) {
      return { kind: "error", label: error };
    }
    if (result) {
      return { kind: "ok", label: "Completed" };
    }
    return { kind: "idle", label: "Waiting for execution" };
  }, [loading, error, result]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    const parsedCommentId = Number(commentId);
    if (!Number.isInteger(parsedCommentId) || parsedCommentId <= 0) {
      setError("Comment ID must be a positive integer.");
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
      const data = await backendApi.generateForComment(parsedCommentId, {
        forceRegenerate,
        topK: parsedTopK
      });
      const resultPayload = data?.result || null;
      setResult(resultPayload);
      addHistory({
        type: "generate-comment",
        summary: `Comment ${parsedCommentId}: ${resultPayload?.status || "done"}`,
        meta: { forceRegenerate, topK: parsedTopK }
      });
    } catch (apiError) {
      const message = apiError?.message || "Comment generation failed";
      setError(message);
      addHistory({
        type: "generate-comment",
        summary: `Comment ${parsedCommentId} failed: ${message}`,
        meta: { forceRegenerate, topK: parsedTopK }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <h2>Generate Reply by Comment</h2>
        <p>Endpoint mapping: POST /rag/generate/comment/{"{comment_id}"}</p>
      </header>

      <article className="panel">
        <form className="form-grid" onSubmit={submit}>
          <label>
            <span>Comment ID (DB id)</span>
            <input
              type="number"
              min="1"
              placeholder="Example: 14"
              value={commentId}
              onChange={(e) => setCommentId(e.target.value)}
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
              {loading ? "Generating..." : "Generate for comment"}
            </button>
            <StatusPill status={status.kind} label={status.label} />
          </div>
        </form>
      </article>

      <article className="panel">
        <h3>Result</h3>
        {result ? (
          <div className="stack-list">
            <div className="stack-item">
              <p>Status: {result.status || "n/a"}</p>
            </div>
            <div className="stack-item">
              <p>Comment ID: {result.comment_id ?? "n/a"}</p>
            </div>
            <div className="stack-item">
              <p>Reply ID: {result.reply_id ?? "n/a"}</p>
            </div>
            <div className="stack-item">
              <p>
                Source Chunks: {Array.isArray(result.source_chunks) ? result.source_chunks.length : 0}
              </p>
            </div>
          </div>
        ) : (
          <p>No result yet.</p>
        )}
      </article>
    </section>
  );
}