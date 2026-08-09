import { Link, useNavigate } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/context/AppStore";

/**
 * Client-side auth gate.
 * Works with both Supabase Auth (when configured) and the localStorage demo fallback.
 */
export function RequireAuth({ children, redirectTo }: { children: ReactNode; redirectTo: string }) {
  const { ready, user } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) {
      const timer = setTimeout(() => {
        void navigate({ to: "/login", search: { redirect: redirectTo } });
      }, 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [ready, user, navigate, redirectTo]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-12">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="surface-panel px-6 py-12 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <LockKeyhole className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-xl font-semibold">Please sign in to continue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page holds your personal bookings and passes. Taking you to the sign-in page…
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild>
              <Link to="/login" search={{ redirect: redirectTo }}>
                Sign in
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/12 bg-white/4">
              <Link to="/">Back home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
