import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { PASS_PLANS } from "@/data/transit";
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
  signOut: () => void;
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

  useEffect(() => {
    setUser(storage.getUser());
    setBookings(storage.getBookings());
    setPasses(storage.getPasses());
    setReady(true);
  }, []);

  const signUp = useCallback<AppState["signUp"]>(async ({ name, email, password, phone }) => {
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

  const signIn = useCallback<AppState["signIn"]>(async (email, password) => {
    await delay();
    const accounts = storage.getAccounts();
    const account = accounts[email.toLowerCase()];
    if (!account || account.password !== password) {
      throw new Error("We couldn't match those details. Check your email and password and try again.");
    }
    storage.setUser(account.user);
    setUser(account.user);
  }, []);

  const signOut = useCallback(() => {
    storage.setUser(null);
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback<AppState["requestPasswordReset"]>(async () => {
    await delay(700);
  }, []);

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
