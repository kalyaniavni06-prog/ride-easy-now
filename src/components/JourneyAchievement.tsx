/**
 * JourneyAchievement — subtle achievement badge after a confirmed booking.
 * Tasteful, not gamified. Stored in localStorage so it only shows once per booking.
 */
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Booking } from "@/lib/storage";

const DISMISSED_KEY = "transitease.achievements.dismissed";

function getDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]") as string[]; }
  catch { return []; }
}

function dismiss(id: string) {
  const d = getDismissed();
  if (!d.includes(id)) {
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...d, id])); } catch { /* noop */ }
  }
}

function getAchievement(allBookings: Booking[], current: Booking): { title: string; sub: string; emoji: string } | null {
  const confirmed = allBookings.filter(b => b.status === "confirmed");
  if (confirmed.length === 1) return { title: "First Journey Planned!", emoji: "🎉", sub: "You've taken your first step on TransitEase." };
  if (confirmed.length === 5) return { title: "Frequent Traveller",     emoji: "🚆", sub: "5 journeys booked — you're a regular." };
  if (confirmed.length === 10) return { title: "Smart Traveller",       emoji: "🏆", sub: "10 journeys planned — you know your routes." };
  const types = new Set(confirmed.map(b => b.type));
  if (types.size === 2) return { title: "Multi-Modal Traveller",         emoji: "🚌", sub: "You've booked both bus and train journeys." };
  return null;
}

export function JourneyAchievement({ booking, allBookings }: { booking: Booking; allBookings: Booking[] }) {
  const [visible, setVisible] = useState(false);
  const achievement = getAchievement(allBookings, booking);

  useEffect(() => {
    if (!achievement) return;
    const key = `${booking.id}-${achievement.title}`;
    if (!getDismissed().includes(key)) setVisible(true);
  }, []);

  if (!visible || !achievement) return null;

  const key = `${booking.id}-${achievement.title}`;

  return (
    <div className="relative flex items-center gap-4 rounded-2xl border border-yellow-400/25 bg-yellow-400/6 px-5 py-4">
      <span className="text-3xl leading-none" aria-hidden>{achievement.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-yellow-300">{achievement.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{achievement.sub}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => { dismiss(key); setVisible(false); }}
        className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
