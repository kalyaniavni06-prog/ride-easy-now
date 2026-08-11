// Local persistence layer. Each function is a thin, replaceable seam:
// swapping these for Supabase queries later requires no UI changes.

import type { TransportType } from "@/data/transit";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | undefined;
}

export interface Passenger {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  seat: string;
}

export interface Booking {
  id: string; // PNR
  createdAt: string;
  userEmail: string;
  type: TransportType;
  operator: string;
  code: string;
  from: string;
  to: string;
  date: string; // yyyy-MM-dd
  departure: string;
  arrival: string;
  durationMins: number;
  seats: string[];
  passengers: Passenger[];
  contactEmail: string;
  contactPhone: string;
  fareBreakdown: { baseFare: number; taxes: number; convenience: number; total: number };
  status: "confirmed" | "cancelled";
}

export interface TravelPass {
  id: string;
  userEmail: string;
  planId: string;
  name: string;
  price: number;
  coverage: string;
  startDate: string;
  endDate: string;
}

const KEYS = {
  user: "transitease.user",
  bookings: "transitease.bookings",
  passes: "transitease.passes",
  users: "transitease.users",
  draft: "transitease.draft",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — non-fatal for the demo */
  }
}

export const storage = {
  getUser: () => read<AuthUser | null>(KEYS.user, null),
  setUser: (user: AuthUser | null) => (user ? write(KEYS.user, user) : window.localStorage.removeItem(KEYS.user)),
  getAccounts: () => read<Record<string, { password: string; user: AuthUser }>>(KEYS.users, {}),
  setAccounts: (accounts: Record<string, { password: string; user: AuthUser }>) => write(KEYS.users, accounts),
  getBookings: () => read<Booking[]>(KEYS.bookings, []),
  setBookings: (bookings: Booking[]) => write(KEYS.bookings, bookings),
  getPasses: () => read<TravelPass[]>(KEYS.passes, []),
  setPasses: (passes: TravelPass[]) => write(KEYS.passes, passes),
};

export interface BookingDraft {
  journeyId: string;
  from: string;
  to: string;
  date: string;
  passengers: number;
  seats: string[];
}

export const draftStore = {
  get: (): BookingDraft | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(KEYS.draft);
      return raw ? (JSON.parse(raw) as BookingDraft) : null;
    } catch {
      return null;
    }
  },
  set: (draft: BookingDraft) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(KEYS.draft, JSON.stringify(draft));
  },
  clear: () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(KEYS.draft);
  },
};

export function generatePNR(type: TransportType) {
  const year = new Date().getFullYear();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let letters = "";
  for (let i = 0; i < 3; i++) letters += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "T";
  const digits = Math.floor(100000 + Math.random() * 899999);
  // Format: TE-2026-TBXXX123456
  return `TE-${year}-${type === "bus" ? "TB" : "TR"}${letters}${digits}`;
}

/**
 * Look up a single booking by PNR from localStorage directly.
 * Used as a fallback when the user state is not yet loaded or the
 * booking was made as a guest — so confirmation always works.
 */
export function getBookingByPNR(pnr: string): Booking | null {
  try {
    const all = read<Booking[]>(KEYS.bookings, []);
    return all.find((b) => b.id === pnr) ?? null;
  } catch {
    return null;
  }
}

// ─── Recent searches ──────────────────────────────────────────────────────────

export interface RecentSearch {
  from: string;
  to: string;
  date: string;
  type: "bus" | "train" | "both";
  passengers: number;
  savedAt: string;
}

const RECENT_KEY = "transitease.recent-searches";
const MAX_RECENT = 5;

export const recentSearches = {
  get: (): RecentSearch[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      return raw ? (JSON.parse(raw) as RecentSearch[]) : [];
    } catch {
      return [];
    }
  },
  add: (search: Omit<RecentSearch, "savedAt">) => {
    if (typeof window === "undefined") return;
    try {
      const existing = recentSearches.get();
      // Remove duplicate (same from+to+type)
      const deduped = existing.filter(
        (r) => !(r.from === search.from && r.to === search.to && r.type === search.type),
      );
      const next: RecentSearch[] = [
        { ...search, savedAt: new Date().toISOString() },
        ...deduped,
      ].slice(0, MAX_RECENT);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // non-fatal
    }
  },
  clear: () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(RECENT_KEY);
  },
};
