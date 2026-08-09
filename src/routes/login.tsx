import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bus, Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useApp } from "@/context/AppStore";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : "/dashboard",
  }),
  head: () => ({
    meta: [
      { title: "Log in — TransitEase" },
      { name: "description", content: "Sign in to manage your bookings, tickets and travel passes." },
      { property: "og:title", content: "Log in — TransitEase" },
      { property: "og:description", content: "Access your TransitEase travel dashboard." },
    ],
  }),
  component: Login,
});

// ── Diagnostic result type ────────────────────────────────────────────────────
interface DiagResult {
  supabaseConfigured: boolean;
  called: boolean;
  errorMessage: string | null;
  errorStatus: number | null;
  hasSession: boolean;
  hasUser: boolean;
  userEmail: string | null;   // safe — not a secret
  emailConfirmed: boolean | null;
  rawErrorCode: string | null;
}

function Login() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);
  const [busy, setBusy] = useState(false);

  // Diagnostic state — shows raw Supabase result on screen
  const [diag, setDiag] = useState<DiagResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmationNeeded(false);
    setDiag(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);

    // ── DIAGNOSTIC: call Supabase directly so we can inspect the raw result ──
    // This bypasses AppStore.signIn so we can see exactly what Supabase returns
    // before any error-handling transforms it.
    if (isSupabaseConfigured && supabase) {
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      // Record everything safe (no tokens, no password)
      const result: DiagResult = {
        supabaseConfigured: true,
        called: true,
        errorMessage: sbError?.message ?? null,
        errorStatus: sbError?.status ?? null,
        hasSession: !!data.session,
        hasUser: !!data.user,
        userEmail: data.user?.email ?? null,
        emailConfirmed:
          data.user?.email_confirmed_at != null
            ? true
            : data.user !== null
              ? false
              : null,
        rawErrorCode: (sbError as { code?: string } | null)?.code ?? null,
      };
      setDiag(result);
      setBusy(false);

      // If we got a session, proceed with normal login via AppStore
      // (which sets the React user state for protected routes)
      if (!sbError && data.session) {
        try {
          await signIn(email.trim(), password);
          toast.success("Welcome back");
          void navigate({ to: redirect });
        } catch (err) {
          // signIn shouldn't fail if we just got a session above, but capture anyway
          setError(err instanceof Error ? err.message : "Login failed after session was created.");
        }
      }
      return;
    }

    // Supabase not configured — use AppStore (demo/localStorage path)
    setDiag({
      supabaseConfigured: false,
      called: false,
      errorMessage: null,
      errorStatus: null,
      hasSession: false,
      hasUser: false,
      userEmail: null,
      emailConfirmed: null,
      rawErrorCode: null,
    });

    try {
      await signIn(email.trim(), password);
      toast.success("Welcome back");
      void navigate({ to: redirect });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "We couldn't sign you in. Please try again.";
      if (
        msg.toLowerCase().includes("confirm") ||
        msg.toLowerCase().includes("not yet confirmed") ||
        msg.toLowerCase().includes("check your inbox")
      ) {
        setConfirmationNeeded(true);
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Bus className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to see your bookings and passes.</p>
        </div>

        {confirmationNeeded ? (
          <div className="surface-panel p-6 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <MailCheck className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Check your inbox</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Click it to activate
              your account, then come back and log in.
            </p>
            <Button
              variant="outline"
              className="mt-5 border-white/12 bg-white/4"
              onClick={() => setConfirmationNeeded(false)}
            >
              Back to log in
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="surface-panel space-y-5 p-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
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
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline underline-offset-2">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 border-white/12 bg-white/4"
              />
            </div>

            {error ? (
              <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full shadow-sm" disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Log in
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline underline-offset-2">
                Create an account
              </Link>
            </p>
          </form>
        )}

        {/* ── DIAGNOSTIC PANEL — visible on screen after login attempt ── */}
        {diag && (
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/8 p-4 text-xs font-mono">
            <p className="mb-2 font-semibold text-amber-300 not-italic">
              🔍 Auth Diagnostic (temporary — will be removed after debugging)
            </p>
            <table className="w-full border-collapse">
              <tbody>
                <DiagRow label="Supabase configured" value={String(diag.supabaseConfigured)} ok={diag.supabaseConfigured} />
                <DiagRow label="signInWithPassword called" value={String(diag.called)} ok={diag.called} />
                <DiagRow label="error.message" value={diag.errorMessage ?? "null (no error)"} ok={diag.errorMessage === null} />
                <DiagRow label="error.status" value={diag.errorStatus !== null ? String(diag.errorStatus) : "null"} ok={diag.errorStatus === null} />
                <DiagRow label="error.code" value={diag.rawErrorCode ?? "null"} ok={diag.rawErrorCode === null} />
                <DiagRow label="session returned" value={String(diag.hasSession)} ok={diag.hasSession} />
                <DiagRow label="user returned" value={String(diag.hasUser)} ok={diag.hasUser} />
                <DiagRow label="user email" value={diag.userEmail ?? "null"} ok={diag.userEmail !== null} />
                <DiagRow
                  label="email confirmed"
                  value={diag.emailConfirmed === null ? "null (no user)" : String(diag.emailConfirmed)}
                  ok={diag.emailConfirmed === true}
                />
              </tbody>
            </table>
            <p className="mt-3 text-amber-400/70">
              {diag.hasSession
                ? "✅ Session created. Login should proceed."
                : diag.errorMessage
                  ? `❌ Login failed: ${diag.errorMessage}`
                  : diag.emailConfirmed === false
                    ? "⚠️ User exists but email not confirmed. Must confirm before login."
                    : "⚠️ No session and no error — unusual state."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DiagRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <tr className="border-b border-amber-400/10 last:border-0">
      <td className="py-1 pr-4 text-amber-300/70">{label}</td>
      <td className={ok ? "py-1 text-emerald-400" : "py-1 text-red-400"}>{value}</td>
    </tr>
  );
}
