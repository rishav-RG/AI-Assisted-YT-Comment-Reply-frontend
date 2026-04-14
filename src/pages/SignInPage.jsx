import { useEffect, useMemo } from "react";
import { SignIn } from "@clerk/clerk-react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const closeTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get("from");

    if (!from || !from.startsWith("/")) {
      return "/";
    }

    if (from.startsWith("/sign-in") || from.startsWith("/sign-up")) {
      return "/";
    }

    return from;
  }, [location.search]);

  useEffect(() => {
    document.body.classList.add("auth-screen-open");

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        navigate(closeTo, { replace: true });
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("auth-screen-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeTo, navigate]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      navigate(closeTo, { replace: true });
    }
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <section className="clerk-route-page" aria-label="Sign in" onClick={handleBackdropClick}>
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl={`/sign-up?from=${encodeURIComponent(closeTo)}`}
        fallbackRedirectUrl="/dashboard"
      />
    </section>,
    document.body
  );
}