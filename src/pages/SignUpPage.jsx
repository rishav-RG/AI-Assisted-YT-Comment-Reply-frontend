import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <section className="clerk-route-page">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </section>
  );
}