const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";
export const OAUTH_MESSAGE_SOURCE = "yt-reply-frontend";
import { useAuth } from "@clerk/clerk-react";

function buildUrl(path) {
  return `${API_PREFIX}${path}`;
}

async function request(path, options = {}, auth = {}) {
  const { token, userId } = auth;

  const { method = "GET", body, headers, ...rest } = options;
  const requestHeaders = new Headers(headers || {});

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (userId) {
    requestHeaders.set("x-clerk-user-id", userId);
  }

  const response = await fetch(buildUrl(path), {
    method,
    body,
    headers: requestHeaders,
    ...rest,
  });

  const raw = await response.text();
  let payload = null;

  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = raw ? { raw } : null;
  }

  if (!response.ok) {
    const detail =
      payload?.detail ||
      payload?.message ||
      response.statusText ||
      "Request failed";
    const error = new Error(detail);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const backendApi = {
  getContentOverview: () => request("/content/overview"),

  getVideoDetail: (videoId) => request(`/content/videos/${videoId}`),

  syncVideoComments: (videoId) =>
    request(`/content/videos/${videoId}/sync-comments`, {
      method: "POST",
    }),

  postReplyForComment: (
    commentId,
    { replyText = null, preferEditedReply = true } = {},
  ) =>
    request(`/content/comments/${commentId}/post-reply`, {
      method: "POST",
      body: JSON.stringify({
        reply_text: replyText,
        prefer_edited_reply: preferEditedReply,
      }),
    }),

  // completeOAuth: (code) =>
  //   request(`/auth/callback?code=${encodeURIComponent(code)}`),

  syncYoutube: ({ runRag = false } = {}) =>
    request(`/youtube/sync?run_rag=${runRag ? "true" : "false"}`, {
      method: "POST",
    }),

  generateForVideo: (videoId, { forceRegenerate = false, topK = null } = {}) =>
    request(`/rag/generate/video/${videoId}`, {
      method: "POST",
      body: JSON.stringify({
        force_regenerate: forceRegenerate,
        top_k: topK,
      }),
    }),

  generateForComment: (
    commentId,
    { forceRegenerate = false, topK = null } = {},
  ) =>
    request(`/rag/generate/comment/${commentId}`, {
      method: "POST",
      body: JSON.stringify({
        force_regenerate: forceRegenerate,
        top_k: topK,
      }),
    }),
};


export const useAuthenticatedApi = () => {
  const { getToken, userId, isLoaded } = useAuth();

  const makeRequest = async (endpoint, options = {}) => {
    if (!isLoaded || !userId) {
      throw new Error("User not authenticated yet");
    }

    const token = await getToken();

    return request(endpoint, options, {
      token,
      userId,
    });
  };

  return makeRequest;
};


export const initiateYouTubeOAuth = () => {
  // to navigate the browser directly to redirect url.
  window.location.href = `${API_PREFIX}/auth/youtube`;
};