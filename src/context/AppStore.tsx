/**
 * AppStore — central React context.
 *
 * Authentication:
 *   - Supabase Auth when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set.
 *   - localStorage demo fallback otherwise (local dev / no env vars).
 *
 * Key design: signIn sets user state IMMEDIATELY from the session returned by
 * signInWithPassword, without waiting for onAuthStateChange. This prevents the
 * race condition where navigate() fires before the user state is set, causing
 * RequireAuth to see user=null and redirect back to /login.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { PASS_PLANS } from "@/data/transit";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  storage,
  type AuthUser,
  type Booking,
  type TravelPass,
} from "@/lib/storage";

interface AppState {
  ready: boolean;
  user: AuthUser | null;
  bookings: Booking[];
  passes: TravelPass[];
  signUp: (input: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  addBooking: (booking: Booking) => void;
  cancelBooking: (id: string) => void;
  buyPass: (planId: string) => TravelPass;
}

const AppContext = createContext<AppState | null>(null);

/** Map a Supabase Auth user to our internal AuthUser shape */
function mapSupabaseUser(su: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): AuthUser {
  return {
    id: su.id,
    name:
      (su.user_metadata?.["name"] as string | undefined) ??
      (su.email?.split("@")[0] ?? "User"),
    email: su.email ?? "",
    phone: (su.user_metadata?.["phone"] as string | undefined) ?? undefined,
  };
}

function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [passes, setPasses] = useState<TravelPass[]>([]);

  // ─── Bootstrap session on mount ──────────────────────────────────────────
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Restore any existing session synchronously before marking ready
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          setUser(mapSupabaseUser(data.session.user));
        }
        setBookings(storage.getBookings());
        setPasses(storage.getPasses());
        setReady(true);
      });

      // 2. Keep in sync with future auth events (sign in, sign out, token refresh)
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(mapSupabaseUser(session.user));
        } else {
          setUser(null);
        }
      });

      return () => {
        listener.subscription.unsubscribe();
      };
    } else {
      // Demo / localStorage fallback
      setUser(storage.getUser());
      setBookings(storage.getBookings());
      setPasses(storage.getPasses());
      setReady(true);
      return undefined;
    }
  }, []);

  // ─── Sign up ──────────────────────────────────────────────────────────────
  const signUp = useCallback<AppState["signUp"]>(async ({ name, email, password, phone }) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: name.trim(), phone: phone ?? "" } },
      });
      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          throw new Error("An account with this email already exists. Try signing in instead.");
        }
        throw new Error(error.message);
      }
      return;
    }

    // Demo fallback
    await delay();
    const accounts = storage.getAccounts();
    const key = email.trim().toLowerCase();
    if (accounts[key]) throw new Error("An account with this email already exists. Try signing in instead.");
    const newUser: AuthUser = { id: crypto.randomUUID(), name: name.trim(), email: key, phone };
    accounts[key] = { password, user: newUser };
    storage.setAccounts(accounts);
    storage.setUser(newUser);
    setUser(newUser);
  }, []);

  // ─── Sign in ──────────────────────────────────────────────────────────────
  const signIn = useCallback<AppState["signIn"]>(async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        // Unconfirmed email — show confirmation prompt, not "wrong password"
        if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
          throw new Error(
            "Please confirm your email address first. Check your inbox for a confirmation link from TransitEase.",
          );
        }
        // All other failures — wrong password, no account, rate limit, etc.
        // Never expose the raw Supabase error message.
        throw new Error("Incorrect email or password. Please check your details and try again.");
      }

      // No error, but no session → email not yet confirmed (Supabase v2 behaviour)
      if (!data.session) {
        throw new Error(
          "Please confirm your email address first. Check your inbox for a confirmation link from TransitEase.",
        );
      }

      // ✅ Set user state IMMEDIATELY from the returned session data.
      // Do NOT wait for onAuthStateChange — it fires asynchronously and would
      // arrive AFTER navigate() runs, causing RequireAuth to see user=null and
      // redirect the user straight back to /login (race condition).
      setUser(mapSupabaseUser(data.session.user));
      return;
    }

    // Demo fallback
    await delay();
    const accounts = storage.getAccounts();
    const account = accounts[email.trim().toLowerCase()];
    if (!account || account.password !== password) {
      throw new Error("Incorrect email or password. Please check your details and try again.");
    }
    storage.setUser(account.user);
    setUser(account.user);
  }, []);

  // ─── Sign out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      setUser(null); // clear immediately, onAuthStateChange will also fire
      return;
    }
    storage.setUser(null);
    setUser(null);
  }, []);

  // ─── Password reset ───────────────────────────────────────────────────────
  const requestPasswordReset = useCallback<AppState["requestPasswordReset"]>(async (email) => {
    if (isSupabaseConfigured && supabase) {
      // Always send users back to this deployment's own origin (preview,
      // production domain or localhost) — never a hardcoded URL.
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        redirectTo ? { redirectTo } : {},
      );
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("rate") || msg.includes("too many") || (error.status ?? 0) === 429) {
          throw new Error("Too many attempts. Please wait a few minutes and try again.");
        }
        if (msg.includes("invalid") && msg.includes("email")) {
          throw new Error("That email address doesn't look valid.");
        }
        throw new Error("We couldn't send the reset email right now. Please try again shortly.");
      }
      return;
    }
    await delay(700);
  }, []);

  // ─── Bookings ─────────────────────────────────────────────────────────────
  const addBooking = useCallback((booking: Booking) => {
    setBookings((prev) => {
      const next = [booking, ...prev];
      storage.setBookings(next);
      return next;
    });
  }, []);

  const cancelBooking = useCallback((id: string) => {
    setBookings((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b));
      storage.setBookings(next);
      return next;
    });
  }, []);

  // ─── Travel passes ────────────────────────────────────────────────────────
  const buyPass = useCallback<AppState["buyPass"]>(
    (planId) => {
      const plan = PASS_PLANS.find((p) => p.id === planId) ?? PASS_PLANS[0]!;
      const start = new Date();
      const end = new Date(start.getTime() + plan.days * 24 * 60 * 60 * 1000);
      const pass: TravelPass = {
        id: `PASS-${Math.floor(100000 + Math.random() * 899999)}`,
        userEmail: user?.email ?? "guest",
        planId: plan.id,
        name: plan.name,
        price: plan.price,
        coverage: plan.coverage,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
      setPasses((prev) => {
        const next = [pass, ...prev];
        storage.setPasses(next);
        return next;
      });
      return pass;
    },
    [user],
  );

  const value = useMemo<AppState>(
    () => ({
      ready,
      user,
      // When logged in: show bookings belonging to this user + any guest bookings.
      // When not logged in: show ALL bookings so the confirmation page always works
      // (guest booking flow — user may not be logged in during checkout).
      bookings: user
        ? bookings.filter((b) => b.userEmail === user.email || b.userEmail === "guest")
        : bookings,
      passes: user ? passes.filter((p) => p.userEmail === user.email) : [],
      signUp,
      signIn,
      signOut,
      requestPasswordReset,
      addBooking,
      cancelBooking,
      buyPass,
    }),
    [ready, user, bookings, passes, signUp, signIn, signOut, requestPasswordReset, addBooking, cancelBooking, buyPass],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function isPassActive(pass: TravelPass) {
  return new Date(pass.endDate).getTime() > Date.now();
}
