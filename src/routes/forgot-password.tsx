import { createFileRoute, Link } from "@tanstack/react-router";
import { Bus, Loader2, MailCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — TransitEase" },
      { name: "description", content: "Reset your TransitEase account password." },
      { property: "og:title", content: "Reset password — TransitEase" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      if (isSupabaseConfigured && supabase) {
        // Use the current page origin as the redirect so it works on both
        // Vercel production and local dev without hardcoding a URL.
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/login`
            : "/login";
        const { error: sbErr } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo },
        );
        if (sbErr) throw new Error(sbErr.message);
      }
      // In demo mode (no Supabase) we still show success — never reveal whether
      // an account exists for a given email (security best practice).
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Bus className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="surface-panel p-8 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <MailCheck className="size-7" aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-bold">Check your inbox</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for <strong className="text-foreground">{email}</strong>, a
              password reset link is on its way. Check your spam folder if you don't see it within
              a few minutes.
            </p>
            <Button asChild className="mt-6 shadow-sm">
              <Link to="/login" search={{}}>Back to log in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="surface-panel space-y-5 p-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
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

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full shadow-sm" disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Send reset link
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link
                to="/login" search={{}}
                className="font-medium text-primary hover:underline underline-offset-2"
              >
                Back to log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
