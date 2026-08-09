import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bus, Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, isSupabaseConfigured, supabasePublicUrl } from "@/lib/supabase";
import { useApp } from "@/context/AppStore";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : "/dashboard",
  }),
  head: () => ({
    meta: [{ title: "Log in — TransitEase" }],
  }),
  component: Login,
});

interface DiagResult {
  envLoaded: boolean;
  supabaseUrl: string;
  called: boolean;
  errorMessage: string | null;
  errorStatus: number | null;
  errorCode: string | null;
  hasSession: boolean;
  hasUser: boolean;
  userEmailMasked: string | null;
  emailConfirmedAt: string | null;
  stepReached: string;
}

function Login() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [diag, setDiag] = useState<DiagResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiag(null);
    setConfirmationNeeded(false);

    if (!email.trim() || !email.includes("@")) {
      setDiag({ envLoaded: isSupabaseConfigured, supabaseUrl: supabasePublicUrl, called: false, errorMessage: "Client validation: invalid email format", errorStatus: null, errorCode: null, hasSession: false, hasUser: false, userEmailMasked: null, emailConfirmedAt: null, stepReached: "client-validation-failed" });
      return;
    }
    if (password.length < 6) {
      setDiag({ envLoaded: isSupabaseConfigured, supabaseUrl: supabasePublicUrl, called: false, errorMessage: "Client validation: password too short", errorStatus: null, errorCode: null, hasSession: false, hasUser: false, userEmailMasked: null, emailConfirmedAt: null, stepReached: "client-validation-failed" });
      return;
    }

    setBusy(true);

    // Show env state immediately
    const base: Pick<DiagResult, "envLoaded" | "supabaseUrl"> = {
      envLoaded: isSupabaseConfigured,
      supabaseUrl: supabasePublicUrl || "(empty — env var not loaded)",
    };

    // CASE: Supabase not configured — env vars missing
    if (!isSupabaseConfigured || !supabase) {
      setDiag({ ...base, called: false, errorMessage: null, errorStatus: null, errorCode: null, hasSession: false, hasUser: false, userEmailMasked: null, emailConfirmedAt: null, stepReached: "SUPABASE-NOT-CONFIGURED-falling-back-to-localStorage" });
      // Run demo fallback
      try {
        await signIn(email.trim(), password);
        toast.success("Welcome back (demo)");
        void navigate({ to: redirect });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setDiag((prev) => prev ? { ...prev, errorMessage: msg, stepReached: "demo-auth-failed" } : prev);
      } finally {
        setBusy(false);
      }
      return;
    }

    // CASE: Supabase IS configured — call signInWithPassword directly
    let stepReached = "calling-signInWithPassword";
    try {
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      stepReached = "signInWithPassword-returned";

      // Mask email: show only first 2 chars + domain for privacy
      const maskEmail = (e: string | null | undefined): string | null => {
        if (!e) return null;
        const [local, domain] = e.split("@");
        return `${(local ?? "").slice(0, 2)}***@${domain ?? ""}`;
      };

      const result: DiagResult = {
        ...base,
        called: true,
        errorMessage: sbError?.message ?? null,
        errorStatus: sbError?.status ?? null,
        errorCode: (sbError as unknown as { code?: string } | null)?.code ?? null,
        hasSession: !!data.session,
        hasUser: !!data.user,
        userEmailMasked: maskEmail(data.user?.email),
        emailConfirmedAt: data.user?.email_confirmed_at ?? null,
        stepReached: sbError ? "FAILED" : data.session ? "SUCCESS-session-created" : "NO-SESSION-no-error",
      };
      setDiag(result);

      if (sbError) {
        // Don't navigate — show diagnostic
        setBusy(false);
        return;
      }

      if (!data.session) {
        setConfirmationNeeded(true);
        setBusy(false);
        return;
      }

      // SUCCESS — now sync state via AppStore and navigate
      stepReached = "calling-AppStore-signIn";
      await signIn(email.trim(), password);
      toast.success("Welcome back");
      void navigate({ to: redirect });

    } catch (err) {
      setDiag({
        ...base,
        called: true,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStatus: null,
        errorCode: "EXCEPTION",
        hasSession: false,
        hasUser: false,
        userEmailMasked: null,
        emailConfirmedAt: null,
        stepReached: `exception-at-${stepReached}`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
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
              We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
              Click it to activate your account, then come back and log in.
            </p>
            <Button variant="outline" className="mt-5 border-white/12 bg-white/4" onClick={() => setConfirmationNeeded(false)}>
              Back to log in
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="surface-panel space-y-5 p-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" type="email" value={email} autoComplete="email"
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="mt-1.5 border-white/12 bg-white/4" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline underline-offset-2">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" value={password} autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 border-white/12 bg-white/4" />
            </div>

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

        {/* ── Diagnostic panel — always shown after login attempt ── */}
        {diag && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-amber-400/40 bg-[#1a1200] p-4 text-xs">
            <p className="mb-3 font-bold text-amber-300">🔍 Login Diagnostic</p>
            <table className="w-full">
              <tbody className="font-mono">
                <DR k="env vars loaded" v={String(diag.envLoaded)} good={diag.envLoaded} />
                <DR k="supabase URL" v={diag.supabaseUrl || "(empty)"} good={diag.supabaseUrl.length > 0} />
                <DR k="signInWithPassword called" v={String(diag.called)} good={diag.called} />
                <DR k="error.message" v={diag.errorMessage ?? "null ✓"} good={diag.errorMessage === null} />
                <DR k="error.status" v={diag.errorStatus !== null ? String(diag.errorStatus) : "null ✓"} good={diag.errorStatus === null} />
                <DR k="error.code" v={diag.errorCode ?? "null ✓"} good={diag.errorCode === null} />
                <DR k="session returned" v={String(diag.hasSession)} good={diag.hasSession} />
                <DR k="user returned" v={String(diag.hasUser)} good={diag.hasUser} />
                <DR k="user email (masked)" v={diag.userEmailMasked ?? "null"} good={diag.userEmailMasked !== null} />
                <DR k="email confirmed at" v={diag.emailConfirmedAt ?? "null (not confirmed)"} good={diag.emailConfirmedAt !== null} />
                <DR k="step reached" v={diag.stepReached} good={diag.stepReached.startsWith("SUCCESS")} />
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DR({ k, v, good }: { k: string; v: string; good: boolean }) {
  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="py-1 pr-4 text-amber-300/60">{k}</td>
      <td className={good ? "py-1 text-emerald-400" : "py-1 text-red-400"}>{v}</td>
    </tr>
  );
}
