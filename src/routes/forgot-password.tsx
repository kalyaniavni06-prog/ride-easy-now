import { createFileRoute, Link } from "@tanstack/react-router";
import { Bus } from "lucide-react";
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Bus className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll send reset instructions to your email. This is a demo flow — no email is actually sent.
          </p>
        </div>

        <form
          className="surface-panel space-y-5 p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            await requestPasswordReset(email);
            setSent(true);
          }}
        >
          <div>
            <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 border-white/12 bg-white/4"
            />
          </div>

          {sent ? (
            <p
              role="status"
              className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2.5 text-sm text-emerald-300"
            >
              If an account exists for {email}, reset instructions are on their way.
            </p>
          ) : null}

          <Button type="submit" className="w-full shadow-sm">
            Send reset link
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline underline-offset-2">
              Back to log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
