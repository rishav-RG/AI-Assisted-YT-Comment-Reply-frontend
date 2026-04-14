const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";
export const OAUTH_MESSAGE_SOURCE = "yt-reply-frontend";

function buildUrl(path) {
  return `${API_PREFIX}${path}`;
}

async function request(path, options = {}) {
  const { method = "GET", body, headers, ...rest } = options;
  const requestHeaders = new Headers(headers || {});

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path), {
    method,
    body,
    headers: requestHeaders,
    ...rest
  });

  const raw = await response.text();
  let payload = null;

  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = raw ? { raw } : null;
  }

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || response.statusText || "Request failed";
    const error = new Error(detail);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const backendApi = {
  getHealth: () => request("/"),

  completeOAuth: (code) => request(`/auth/callback?code=${encodeURIComponent(code)}`),

  syncYoutube: ({ runRag = false } = {}) =>
    request(`/youtube/sync?run_rag=${runRag ? "true" : "false"}`, {
      method: "POST"
    }),

  generateForVideo: (videoId, { forceRegenerate = false, topK = null } = {}) =>
    request(`/rag/generate/video/${videoId}`, {
      method: "POST",
      body: JSON.stringify({
        force_regenerate: forceRegenerate,
        top_k: topK
      })
    }),

  generateForComment: (commentId, { forceRegenerate = false, topK = null } = {}) =>
    request(`/rag/generate/comment/${commentId}`, {
      method: "POST",
      body: JSON.stringify({
        force_regenerate: forceRegenerate,
        top_k: topK
      })
    })
};

export const oauthStartUrl = buildUrl("/auth/youtube");