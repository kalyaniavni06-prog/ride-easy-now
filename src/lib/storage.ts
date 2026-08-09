// Local persistence layer. Each function is a thin, replaceable seam:
// swapping these for Supabase queries later requires no UI changes.

import type { TransportType } from "@/data/transit";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let letters = "";
  for (let i = 0; i < 3; i++) letters += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "T";
  const digits = Math.floor(100000 + Math.random() * 899999);
  return `${type === "bus" ? "TB" : "TR"}${letters}${digits}`;
}
