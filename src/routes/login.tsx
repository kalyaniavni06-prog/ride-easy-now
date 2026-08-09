import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function Login() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back");
      void navigate({ to: redirect });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Bus className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to see your bookings and passes.
          </p>
        </div>

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
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline underline-offset-2"
              >
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
            <p
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
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
      </div>
    </div>
  );
}
