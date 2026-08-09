import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppStore";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — TransitEase" },
      { name: "description", content: "Request a demo password reset link for your TransitEase account." },
      { property: "og:title", content: "Reset password — TransitEase" },
      { property: "og:description", content: "Recover access to your TransitEase account." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const { requestPasswordReset } = useApp();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We'll send reset instructions to your email. This is a demo flow — no email is actually sent.
      </p>

      <form
        className="surface-panel mt-6 space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          await requestPasswordReset(email);
          setSent(true);
        }}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
        </div>
        {sent ? (
          <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
            If an account exists for {email}, reset instructions are on the way.
          </p>
        ) : null}
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Back to log in
          </Link>
        </p>
      </form>
    </div>
  );
}
