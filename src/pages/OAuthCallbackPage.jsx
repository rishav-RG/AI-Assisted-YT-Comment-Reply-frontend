import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { backendApi, OAUTH_MESSAGE_SOURCE } from "../api/backendApi";
import StatusPill from "../components/StatusPill";

function sendCallbackResult(payload) {
  if (!window.opener || window.opener.closed) {
    return;
  }

  window.opener.postMessage(
    {
      source: OAUTH_MESSAGE_SOURCE,
      type: "oauth-complete",
      ...payload
    },
    window.location.origin
  );
}

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState({ kind: "running", label: "Processing OAuth callback..." });
  const [details, setDetails] = useState("Exchanging authorization code with backend.");

  useEffect(() => {
    let cancelled = false;

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

      try {
        const result = await backendApi.completeOAuth(code);
        if (cancelled) {
          return;
        }

        setStatus({ kind: "ok", label: "YouTube connected" });
        setDetails(`Backend response: ${result?.status || "connected"}. This window will close automatically.`);
        sendCallbackResult({ ok: true, result });

        window.setTimeout(() => {
          window.close();
        }, 900);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error?.message || "OAuth callback exchange failed.";
        setStatus({ kind: "error", label: "Backend exchange failed" });
        setDetails(message);
        sendCallbackResult({ ok: false, message });
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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