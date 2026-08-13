import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bus, Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppStore";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — TransitEase" },
      { name: "description", content: "Create a TransitEase account to book buses, trains and travel passes." },
      { property: "og:title", content: "Create account — TransitEase" },
      { property: "og:description", content: "Join TransitEase and manage all your journeys in one place." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const { signUp } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.name.trim().length < 2 || !form.email.includes("@") || form.password.length < 6) {
      setError("Enter your name, a valid email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await signUp({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password });

      if (isSupabaseConfigured) {
        // Supabase sends a confirmation email by default — show instructions
        setConfirmationSent(true);
      } else {
        toast.success("Account created");
        void navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (confirmationSent) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="surface-panel p-8 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <MailCheck className="size-7" aria-hidden />
            </span>
            <h1 className="mt-5 text-xl font-bold">Confirm your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to{" "}
              <strong className="text-foreground">{form.email}</strong>. Click the link in your inbox to activate your
              account, then log in.
            </p>
            <Button asChild className="mt-6 shadow-sm">
              <Link to="/login" search={{ redirect: "/dashboard" }}>Go to log in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Bus className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Book faster and keep every ticket in one place.</p>
        </div>

        <form onSubmit={submit} className="surface-panel space-y-5 p-6">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Full name
            </Label>
            <Input
              id="name"
              value={form.name}
              autoComplete="name"
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ananya Sharma"
              className="mt-1.5 border-white/12 bg-white/4"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              autoComplete="email"
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
              className="mt-1.5 border-white/12 bg-white/4"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              autoComplete="new-password"
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="At least 6 characters"
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
            Create account
          </Button>

          {!isSupabaseConfigured && (
            <p className="rounded-lg border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-center text-xs text-amber-300">
              Demo mode — accounts are stored in your browser only.
            </p>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to="/login" search={{ redirect: "/dashboard" }} className="font-medium text-primary hover:underline underline-offset-2">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
