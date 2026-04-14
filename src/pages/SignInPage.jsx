import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <section className="clerk-route-page">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </section>
  );
}