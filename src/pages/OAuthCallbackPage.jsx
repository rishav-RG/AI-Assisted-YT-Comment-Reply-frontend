import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

import { useAuthenticatedApi, OAUTH_MESSAGE_SOURCE } from "../api/backendApi";
import StatusPill from "../components/StatusPill";

function sendCallbackResult(payload) {
  if (!window.opener || window.opener.closed) return;

  window.opener.postMessage(
    { source: OAUTH_MESSAGE_SOURCE, type: "oauth-complete", ...payload },
    window.location.origin
  );
}

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState({ kind: "running", label: "Processing OAuth callback..." });
  const [details, setDetails] = useState("Waiting for authentication...");
  const api = useAuthenticatedApi();
  const hasRun = useRef(false);
  const { isLoaded, userId } = useAuth();  // added

  useEffect(() => {
    if (!isLoaded || !userId) return;
    if (hasRun.current) return;
    hasRun.current = true;

    async function handleCallback() {
      const oauthError = searchParams.get("error");
      const code = searchParams.get("code");

      if (oauthError) {
        const message = `Google OAuth returned error: ${oauthError}`;
        setStatus({ kind: "error", label: "OAuth failed" });
        setDetails(message);
        sendCallbackResult({ ok: false, message });
        return;
      }

      if (!code) {
        const message = "No code query param found in callback URL.";
        setStatus({ kind: "error", label: "Missing code" });
        setDetails(message);
        sendCallbackResult({ ok: false, message });
        return;
      }

      setDetails("Exchanging authorization code with backend.");

      try {
        const result = await api(`/auth/callback?code=${encodeURIComponent(code)}`);

        setStatus({ kind: "ok", label: "YouTube connected" });
        setDetails("YouTube connected successfully. You can now close this window.");
        sendCallbackResult({ ok: true, result });
      } catch (error) {
        const message = error?.message || "OAuth callback exchange failed.";
        setStatus({ kind: "error", label: "Backend exchange failed" });
        setDetails(message);
        sendCallbackResult({ ok: false, message });
      }
    }

    handleCallback();
  }, [isLoaded, userId, searchParams]);

  return (
    <section className="oauth-callback-page">
      <article className="oauth-callback-card">
        <h2>YouTube OAuth Callback</h2>
        <p>This page finalizes OAuth by calling backend GET /auth/callback.</p>
        <div className="row">
          <StatusPill status={status.kind} label={status.label} />
        </div>
        <p className="oauth-details">{details}</p>
        <div className="row">
          <button className="btn ghost" type="button" onClick={() => window.close()}>
            Close window
          </button>
        </div>
      </article>
    </section>
  );
}