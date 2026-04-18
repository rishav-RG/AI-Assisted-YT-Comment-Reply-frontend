import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuthenticatedApi } from "../api/backendApi";
import StatusPill from "../components/StatusPill";
import { useAppState } from "../state/AppStateProvider";

function getCommentStatus(comment) {
  if (comment?.is_creator) {
    return { kind: "connected", label: "CREATOR" };
  }
  if (comment?.spam_flag) {
    return { kind: "warning", label: "spam" };
  }
  if (comment?.is_processed) {
    return { kind: "ok", label: "processed" };
  }
  return { kind: "idle", label: "unanswered" };
}

function getReplyText(comment) {
  return comment?.latest_reply?.edited_reply || comment?.latest_reply?.generated_reply || "";
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString();
}

export default function VideoDetailPage() {
  const { addHistory } = useAppState();
  const { videoId } = useParams();

  const parsedVideoId = Number(videoId);

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [syncingComments, setSyncingComments] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);

  const [generatingByCommentId, setGeneratingByCommentId] = useState({});
  const [postingByCommentId, setPostingByCommentId] = useState({});
  const [commentNoticeById, setCommentNoticeById] = useState({});

  // Store edited replies in local state (not persisted)
  const [editedReplyByCommentId, setEditedReplyByCommentId] = useState({});
  // Track which comment is in edit mode
  const [editingReplyByCommentId, setEditingReplyByCommentId] = useState({});

  const [pageNotice, setPageNotice] = useState({ kind: "idle", label: "Ready" });

  const api = useAuthenticatedApi();

  const loadVideoDetail = async ({ silent = false } = {}) => {
    if (!Number.isInteger(parsedVideoId) || parsedVideoId <= 0) {
      setError("Video ID is invalid.");
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    setError("");

    try {
      const payload = await api(`/content/videos/${parsedVideoId}`);
      setDetail(payload);
    } catch (apiError) {
      setError(apiError?.message || "Failed to load video detail");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadVideoDetail();
  }, [videoId]);

  const runSyncComments = async () => {
    setSyncingComments(true);
    setPageNotice({ kind: "running", label: "Syncing latest comments" });

    try {
      const result = await api(`/content/videos/${parsedVideoId}/sync-comments`, { method: "POST" });
      const labeledCount = result?.labeled_count || 0;
      setPageNotice({
        kind: "ok",
        label: `Synced ${result?.fetched || 0} comments (${result?.inserted || 0} new), labeled ${labeledCount}`
      });
      addHistory({
        type: "sync-video-comments",
        summary: `Video ${parsedVideoId}: synced ${result?.fetched || 0} comments, labeled ${labeledCount}`
      });
      await loadVideoDetail({ silent: true });
    } catch (apiError) {
      const message = apiError?.message || "Failed syncing comments";
      setPageNotice({ kind: "error", label: message });
      addHistory({ type: "sync-video-comments", summary: `Video ${parsedVideoId} sync failed: ${message}` });
    } finally {
      setSyncingComments(false);
    }
  };

  const runGenerateAll = async () => {
    setGeneratingAll(true);
    setPageNotice({ kind: "running", label: "Generating replies for unanswered comments" });

    try {
      const result = await api(`/rag/generate/video/${parsedVideoId}`, {
        method: "POST",
        body: JSON.stringify({ force_regenerate: false, top_k: null }),
      });
      const summary = result?.summary || {};

      setPageNotice({
        kind: "ok",
        label: `Generated ${summary.generated || 0} replies, failed ${summary.failed || 0}`
      });
      addHistory({
        type: "generate-video",
        summary: `Video ${parsedVideoId}: generated ${summary.generated || 0} replies`
      });
      await loadVideoDetail({ silent: true });
    } catch (apiError) {
      const message = apiError?.message || "Failed generating replies for video";
      setPageNotice({ kind: "error", label: message });
      addHistory({ type: "generate-video", summary: `Video ${parsedVideoId} generation failed: ${message}` });
    } finally {
      setGeneratingAll(false);
    }
  };

  const runGenerateForComment = async (comment) => {
    setGeneratingByCommentId((prev) => ({ ...prev, [comment.id]: true }));
    setCommentNoticeById((prev) => ({ ...prev, [comment.id]: { kind: "running", label: "Generating" } }));

    try {
      const result = await api(`/rag/generate/comment/${comment.id}`, {
        method: "POST",
        body: JSON.stringify({ force_regenerate: false, top_k: null }),
      });
      const status = result?.result?.status || "generated";

      setCommentNoticeById((prev) => ({
        ...prev,
        [comment.id]: { kind: "ok", label: `Generation ${status}` }
      }));
      addHistory({
        type: "generate-comment",
        summary: `Comment ${comment.id}: generation ${status}`
      });
      await loadVideoDetail({ silent: true });
    } catch (apiError) {
      const message = apiError?.message || "Failed to generate reply";
      setCommentNoticeById((prev) => ({ ...prev, [comment.id]: { kind: "error", label: message } }));
      addHistory({ type: "generate-comment", summary: `Comment ${comment.id} generation failed: ${message}` });
    } finally {
      setGeneratingByCommentId((prev) => ({ ...prev, [comment.id]: false }));
    }
  };

  const runPostReply = async (comment) => {
    // Use edited reply if present, else generated
    const replyText = editedReplyByCommentId[comment.id] ?? getReplyText(comment);
    if (!replyText) {
      setCommentNoticeById((prev) => ({
        ...prev,
        [comment.id]: { kind: "warning", label: "Generate a reply first" }
      }));
      return;
    }

    setPostingByCommentId((prev) => ({ ...prev, [comment.id]: true }));
    setCommentNoticeById((prev) => ({ ...prev, [comment.id]: { kind: "running", label: "Posting to YouTube" } }));

    try {
      // Optionally: pass replyText to backend if API supports it, else just post
      const result = await api(`/content/comments/${comment.id}/post-reply`, {
        method: "POST",
        body: JSON.stringify({ reply_text: replyText, prefer_edited_reply: true }),
      });
      setCommentNoticeById((prev) => ({
        ...prev,
        [comment.id]: { kind: "connected", label: `Posted ${result?.youtube_reply_comment_id || "successfully"}` }
      }));
      addHistory({
        type: "post-reply",
        summary: `Comment ${comment.id}: posted to YouTube`
      });
      await loadVideoDetail({ silent: true });
    } catch (apiError) {
      const message = apiError?.message || "Failed posting reply";
      setCommentNoticeById((prev) => ({ ...prev, [comment.id]: { kind: "error", label: message } }));
      addHistory({ type: "post-reply", summary: `Comment ${comment.id} post failed: ${message}` });
    } finally {
      setPostingByCommentId((prev) => ({ ...prev, [comment.id]: false }));
    }
  };

  const renderComment = (comment, nested = false) => {
    const status = getCommentStatus(comment);
    const generatedText = getReplyText(comment);
    const busyGenerating = Boolean(generatingByCommentId[comment.id]);
    const busyPosting = Boolean(postingByCommentId[comment.id]);
    const canAct = Boolean(comment?.can_generate_reply);
    const commentNotice = commentNoticeById[comment.id];
    const isEditing = !!editingReplyByCommentId[comment.id];
    const editedText = editedReplyByCommentId[comment.id];

    // The text to show in the reply box (edited or generated)
    const replyToShow = isEditing ? editedText ?? generatedText : editedText ?? generatedText;

    // Handlers for editing
    const handleEditClick = () => {
      setEditingReplyByCommentId((prev) => ({ ...prev, [comment.id]: true }));
      setEditedReplyByCommentId((prev) => ({ ...prev, [comment.id]: editedText ?? generatedText }));
    };
    const handleCancelEdit = () => {
      setEditingReplyByCommentId((prev) => ({ ...prev, [comment.id]: false }));
      setEditedReplyByCommentId((prev) => ({ ...prev, [comment.id]: undefined }));
    };
    const handleSaveEdit = () => {
      setEditingReplyByCommentId((prev) => ({ ...prev, [comment.id]: false }));
      // Keep edited text in state
    };
    const handleEditChange = (e) => {
      setEditedReplyByCommentId((prev) => ({ ...prev, [comment.id]: e.target.value }));
    };

    return (
      <article key={comment.id} className={`comment-card ${nested ? "nested" : ""}`}>
        <header className="comment-head">
          <div className="comment-head-main">
            <strong>{comment.author || (comment.is_creator ? "Channel" : "Viewer")}</strong>
            <StatusPill status={status.kind} label={status.label} />
          </div>
          <small>{formatDateTime(comment.created_at)}</small>
        </header>

        <p className="comment-text">{comment.comment_text || "No text"}</p>

        <div className="chip-list comment-chip-list">
          <span className="chip">Intent: {comment.intent || "unknown"}</span>
          <span className="chip">Spam: {comment.spam_flag ? "yes" : "no"}</span>
        </div>

        {canAct ? (
          <div className="row comment-actions-row">
            <button
              className="btn"
              onClick={() => runGenerateForComment(comment)}
              disabled={busyGenerating || busyPosting}
            >
              {busyGenerating ? "Generating..." : "Generate Reply"}
            </button>
            <button
              className="btn ghost"
              onClick={() => runPostReply(comment)}
              disabled={busyGenerating || busyPosting || !(editedText ?? generatedText)}
              title={generatedText ? "Post generated reply" : "Generate a reply first"}
            >
              {busyPosting ? "Posting..." : "Post to YouTube"}
            </button>
            {commentNotice ? <StatusPill status={commentNotice.kind} label={commentNotice.label} /> : null}
          </div>
        ) : (
          <p className="helper-text">Creator-authored comment. No reply action here.</p>
        )}
        {!comment.is_creator && (
          <div className="generated-reply-box" style={{ position: "relative" }}>
            <p className="generated-reply-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Latest generated reply</span>
              {!isEditing && (editedText ?? generatedText) ? (
                <button
                  className="btn ghost"
                  style={{ fontSize: "0.9em", padding: "2px 8px" }}
                  onClick={handleEditClick}
                  disabled={busyGenerating || busyPosting}
                  title="Edit reply"
                >
                  Edit
                </button>
              ) : null}
            </p>
            {isEditing ? (
              <>
                <textarea
                  value={replyToShow || ""}
                  onChange={handleEditChange}
                  rows={3}
                  style={{ width: "100%", resize: "vertical" }}
                  disabled={busyGenerating || busyPosting}
                  autoFocus
                />
                <div className="row" style={{ marginTop: 4 }}>
                  <button className="btn" onClick={handleSaveEdit} disabled={busyGenerating || busyPosting}>
                    Save
                  </button>
                  <button className="btn ghost" onClick={handleCancelEdit} disabled={busyGenerating || busyPosting}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p>
                {replyToShow || "No generated reply yet."}
                {editedText && !isEditing ? (
                  <span style={{ marginLeft: 8, fontSize: "0.85em", color: "#888" }}>(edited)</span>
                ) : null}
              </p>
            )}
          </div>
        )}
      </article>
    );
  };

  const threads = detail?.threads || [];
  const orphanReplies = detail?.orphan_replies || [];

  // Reset edited replies and edit mode when detail changes (e.g., after sync)
  useEffect(() => {
    setEditedReplyByCommentId({});
    setEditingReplyByCommentId({});
  }, [detail?.video?.id]);

  const summary = useMemo(() => {
    const stats = detail?.stats || {};
    return {
      total: stats.total_comments || 0,
      topLevel: stats.top_level_comments || 0,
      replies: stats.reply_comments || 0,
      pending: stats.pending_comment_count || 0,
      processed: stats.processed_comment_count || 0
    };
  }, [detail?.stats]);

  const youtubeUrl = detail?.video?.youtube_video_id
    ? `https://www.youtube.com/watch?v=${detail.video.youtube_video_id}`
    : "";

  if (loading) {
    return (
      <section className="page video-detail-page">
        <p>Loading video details...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page video-detail-page">
        <article className="panel">
          <h3>Unable to load video</h3>
          <p>{error}</p>
          <div className="row">
            <Link className="btn ghost" to="/overview">
              Back to Overview
            </Link>
            <button className="btn" onClick={() => loadVideoDetail()}>
              Retry
            </button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="page video-detail-page">
      <header className="page-header video-detail-header">
        <p className="home-quick-eyebrow">Video Workspace</p>
        <h2>{detail?.video?.title || `Video ${videoId}`}</h2>
        <p>{detail?.video?.description || "No description provided for this video."}</p>

        <div className="row">
          <Link className="btn ghost" to="/overview">
            Back to Overview
          </Link>
          {youtubeUrl ? (
            <a className="btn ghost" href={youtubeUrl} target="_blank" rel="noreferrer">
              Open on YouTube
            </a>
          ) : null}
          <StatusPill status={pageNotice.kind} label={pageNotice.label} />
        </div>
      </header>

      <div className="metrics-grid">
        <article className="metric">
          <span>Total comments</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="metric">
          <span>Top-level threads</span>
          <strong>{summary.topLevel}</strong>
        </article>
        <article className="metric">
          <span>Replies</span>
          <strong>{summary.replies}</strong>
        </article>
        <article className="metric">
          <span>Unanswered</span>
          <strong>{summary.pending}</strong>
        </article>
        <article className="metric">
          <span>Processed</span>
          <strong>{summary.processed}</strong>
        </article>
      </div>

      <article className="panel">
        <h3>Video actions</h3>
        <p>Sync latest comments for this video, then generate replies for unanswered comments in one click.</p>
        <div className="row">
          <button className="btn" onClick={runSyncComments} disabled={syncingComments || generatingAll}>
            {syncingComments ? "Syncing comments..." : "Sync latest comments"}
          </button>
          <button className="btn ghost" onClick={runGenerateAll} disabled={generatingAll || syncingComments}>
            {generatingAll ? "Generating replies..." : "Generate all unanswered replies"}
          </button>
        </div>
      </article>

      <section className="thread-list" aria-label="Video comments and replies">
        {threads.length === 0 ? <p>No comments found for this video.</p> : null}

        {threads.map((thread) => (
          <article className="thread-card" key={thread.id}>
            {renderComment(thread)}
            {Array.isArray(thread.replies) && thread.replies.length > 0 ? (
              <div className="thread-replies">
                {thread.replies.map((reply) => renderComment(reply, true))}
              </div>
            ) : null}
          </article>
        ))}
      </section>

      {orphanReplies.length > 0 ? (
        <article className="panel">
          <h3>Replies without known parent</h3>
          <p>These replies are present in the database but their top-level parent comment was not found.</p>
          <div className="thread-replies">
            {orphanReplies.map((reply) => renderComment(reply, true))}
          </div>
        </article>
      ) : null}
    </section>
  );
}
