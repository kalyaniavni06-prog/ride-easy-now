import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bus, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — TransitEase" },
      { name: "description", content: "Choose a new password for your TransitEase account." },
      { property: "og:title", content: "Set a new password — TransitEase" },
      { property: "og:description", content: "Securely update your TransitEase account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

type Phase = "checking" | "ready" | "invalid" | "done";

function ResetPassword() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase appends a recovery token to the URL; the client exchanges it for a
  // temporary session. Wait for that session before showing the form.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setPhase("invalid");
      return;
    }
    let cancelled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || session) setPhase("ready");
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setPhase("ready");
      } else {
        // Give the client a moment to parse the recovery link from the URL.
        setTimeout(() => {
          if (!cancelled) setPhase((p) => (p === "checking" ? "invalid" : p));
        }, 1500);
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Include at least one letter and one number.");
      return;
    }
    if (password !== confirm) {
      setError("Both passwords must match.");
      return;
    }

    setBusy(true);
    try {
      if (!supabase) throw new Error("unavailable");
      const { error: sbErr } = await supabase.auth.updateUser({ password });
      if (sbErr) {
        const msg = sbErr.message.toLowerCase();
        if (msg.includes("expired") || msg.includes("invalid")) {
          throw new Error("This reset link has expired. Please request a new one.");
        }
        if (msg.includes("same") || msg.includes("different from the old")) {
          throw new Error("Choose a password you haven't used before.");
        }
        throw new Error("We couldn't update your password. Please try again.");
      }
      setPhase("done");
    } catch (err) {
      setError(
        err instanceof Error && err.message !== "unavailable"
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
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Set a new password</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Choose a strong password you don't use anywhere else.
          </p>
        </div>

        {phase === "checking" ? (
          <div className="surface-panel space-y-4 p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : phase === "invalid" ? (
          <div className="surface-panel p-8 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/10 text-destructive">
              <ShieldCheck className="size-7" aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-bold">Reset link not valid</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This password reset link is missing, already used, or expired. Request a fresh link and
              try again.
            </p>
            <Button asChild className="mt-6 shadow-sm">
              <Link to="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        ) : phase === "done" ? (
          <div className="surface-panel p-8 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <CheckCircle2 className="size-7" aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-bold">Password updated</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your password has been changed. You can now log in with your new password.
            </p>
            <Button
              className="mt-6 w-full shadow-sm"
              onClick={() => {
                void supabase?.auth.signOut().finally(() => {
                  void navigate({ to: "/login", search: { redirect: "/dashboard" } });
                });
              }}
            >
              Back to log in
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="surface-panel space-y-5 p-6" noValidate>
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                New password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="border-white/12 bg-white/4 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Minimum 8 characters, including a letter and a number.
              </p>
            </div>

            <div>
              <Label htmlFor="confirm" className="text-sm font-medium">
                Confirm password
              </Label>
              <Input
                id="confirm"
                type={show ? "text" : "password"}
                value={confirm}
                autoComplete="new-password"
                onChange={(e) => setConfirm(e.target.value)}
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
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
              {busy ? "Updating…" : "Update password"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Changed your mind?{" "}
              <Link
                to="/login"
                search={{ redirect: "/dashboard" }}
                className="font-medium text-primary underline-offset-2 hover:underline"
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
