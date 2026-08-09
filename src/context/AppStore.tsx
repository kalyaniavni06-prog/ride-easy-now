/**
 * AppStore — central React context.
 *
 * Authentication strategy:
 *   - If Supabase env vars are configured → uses Supabase Auth (email/password).
 *   - Otherwise → falls back to localStorage demo auth (no server required).
 *
 * Bookings, passes, and drafts always use localStorage for the demo.
 * Swap those reads/writes for Supabase DB queries when a backend is ready.
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

function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [passes, setPasses] = useState<TravelPass[]>([]);

  // ─── Bootstrap session ────────────────────────────────────────────────────
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Supabase path: restore session from cookie/localStorage managed by SDK
      supabase.auth.getSession().then(({ data }) => {
        const session = data.session;
        if (session?.user) {
          const su = session.user;
          setUser({
            id: su.id,
            name: (su.user_metadata?.["name"] as string | undefined) ?? su.email ?? "User",
            email: su.email ?? "",
            phone: (su.user_metadata?.["phone"] as string | undefined) ?? undefined,
          });
        }
        setBookings(storage.getBookings());
        setPasses(storage.getPasses());
        setReady(true);
      });

      // Keep session in sync when tab regains focus / auth state changes
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const su = session.user;
          setUser({
            id: su.id,
            name: (su.user_metadata?.["name"] as string | undefined) ?? su.email ?? "User",
            email: su.email ?? "",
            phone: (su.user_metadata?.["phone"] as string | undefined) ?? undefined,
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        listener.subscription.unsubscribe();
      };
    } else {
      // Demo / localStorage path
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
        email,
        password,
        options: {
          data: { name, phone: phone ?? "" },
        },
      });
      if (error) {
        // Translate Supabase error messages to user-friendly text
        if (error.message.toLowerCase().includes("already registered")) {
          throw new Error("An account with this email already exists. Try signing in instead.");
        }
        throw new Error(error.message);
      }
      // Session is set via onAuthStateChange listener above
      return;
    }

    // Demo fallback
    await delay();
    const accounts = storage.getAccounts();
    const key = email.toLowerCase();
    if (accounts[key]) throw new Error("An account with this email already exists. Try signing in instead.");
    const newUser: AuthUser = { id: crypto.randomUUID(), name, email: key, phone };
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
        // Supabase v2 uses HTTP status codes — 400 means bad credentials or unconfirmed.
        // We check the message for the confirmation case specifically.
        const msg = error.message.toLowerCase();
        if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
          throw new Error(
            "Please confirm your email address first. Check your inbox for a confirmation link from TransitEase.",
          );
        }
        // For all other auth failures (wrong password, no account, etc.)
        // show a generic message — never expose the raw Supabase error.
        throw new Error("Incorrect email or password. Please check your details and try again.");
      }

      // No error, but no session — means email confirmation is still pending.
      // Supabase v2 can return this state when "Confirm email" is enabled.
      if (!data.session) {
        throw new Error(
          "Please confirm your email address first. Check your inbox for a confirmation link from TransitEase.",
        );
      }

      // User state is set by the onAuthStateChange listener — nothing to do here.
      return;
    }

    // ── Demo / localStorage fallback (no Supabase configured) ────────────────
    await delay();
    const accounts = storage.getAccounts();
    const account = accounts[email.toLowerCase()];
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
      // user state cleared by onAuthStateChange
      return;
    }
    storage.setUser(null);
    setUser(null);
  }, []);

  // ─── Password reset ───────────────────────────────────────────────────────
  const requestPasswordReset = useCallback<AppState["requestPasswordReset"]>(async (email) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.resetPasswordForEmail(email);
      return;
    }
    await delay(700);
  }, []);

  // ─── Bookings (localStorage) ──────────────────────────────────────────────
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

  // ─── Travel passes (localStorage) ────────────────────────────────────────
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
      bookings: user ? bookings.filter((b) => b.userEmail === user.email) : [],
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
