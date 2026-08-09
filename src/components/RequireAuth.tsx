import { Link, useNavigate } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/context/AppStore";

/**
 * Client-side auth gate.
 *
 * Works with Supabase Auth (when configured) and the localStorage demo fallback.
 *
 * Race-condition note: After login, the user state is set synchronously in
 * AppStore.signIn before navigate() is called. This component still has a
 * redirect timer as a fallback for cases where the user genuinely isn't
 * authenticated (e.g. direct URL access while logged out).
 *
 * We do NOT redirect on the very first render cycle — we wait for `ready`
 * to be true AND give one extra tick for any in-flight state updates to
 * settle before deciding the user is truly unauthenticated.
 */
export function RequireAuth({ children, redirectTo }: { children: ReactNode; redirectTo: string }) {
  const { ready, user } = useApp();
  const navigate = useNavigate();
  // Track whether we've been mounted long enough to safely redirect
  const stableRef = useRef(false);

  useEffect(() => {
    // Mark as stable after one frame — this lets any synchronous state updates
    // from signIn() settle before we evaluate the auth state.
    const frame = requestAnimationFrame(() => {
      stableRef.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (user) return; // authenticated — nothing to do

    // Not authenticated. Give React 100ms to process any pending state updates
    // (e.g. onAuthStateChange firing just after navigation), then redirect if
    // still not authenticated.
    const timer = setTimeout(() => {
      if (!stableRef.current) return; // still in first frame — don't redirect yet
      void navigate({ to: "/login", search: { redirect: redirectTo } });
    }, 100);

    return () => clearTimeout(timer);
  }, [ready, user, navigate, redirectTo]);

  // Still loading session
  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-12">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Ready but no user yet — show a holding screen while the 100ms timer runs
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-12">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
