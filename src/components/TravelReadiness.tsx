/**
 * TravelReadiness — "Your trip readiness" interactive checklist.
 * Uses booking data. User can tick off items before travel.
 * State is stored in localStorage per PNR.
 */
import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import type { Booking } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface ReadinessItem {
  id: string;
  label: string;
  auto: boolean; // auto-checked based on booking data
}

function getItems(booking: Booking): ReadinessItem[] {
  const isBus = booking.type === "bus";
  return [
    { id: "ticket",   label: "Ticket confirmed — PNR saved",            auto: booking.status === "confirmed" },
    { id: "seat",     label: `Seat${booking.seats.length > 1 ? "s" : ""} selected: ${booking.seats.join(", ")}`, auto: booking.seats.length > 0 },
    { id: "boarding", label: `Boarding point: ${booking.from} ${isBus ? "Central Bus Stand" : "Junction"}`, auto: true },
    { id: "arrival",  label: "Recommended arrival time noted",           auto: false },
    { id: "id",       label: "Government ID ready",                      auto: false },
    { id: "reminder", label: "Travel reminder set",                      auto: false },
  ];
}

const storageKey = (pnr: string) => `transitease.readiness.${pnr}`;

export function TravelReadiness({ booking }: { booking: Booking }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const items = getItems(booking);

  // Load saved state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(booking.id));
      const saved: string[] = raw ? JSON.parse(raw) : [];
      const initial = new Set([
        ...saved,
        ...items.filter((i) => i.auto).map((i) => i.id),
      ]);
      setChecked(initial);
    } catch {
      setChecked(new Set(items.filter((i) => i.auto).map((i) => i.id)));
    }
  }, [booking.id]);

  const toggle = (id: string, auto: boolean) => {
    if (auto) return; // auto items can't be toggled
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(storageKey(booking.id), JSON.stringify([...next])); } catch { /* non-fatal */ }
      return next;
    });
  };

  const doneCount = items.filter((i) => checked.has(i.id)).length;
  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <section className="surface-panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
        <h2 className="text-sm font-bold text-foreground">🧳 Your trip readiness</h2>
        <span className={cn(
          "text-xs font-semibold",
          pct === 100 ? "text-emerald-400" : pct >= 60 ? "text-primary" : "text-amber-400",
        )}>
          {doneCount}/{items.length} ready
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-white/8">
        <div
          className={cn(
            "h-full transition-all duration-500",
            pct === 100 ? "bg-emerald-400" : pct >= 60 ? "bg-primary" : "bg-amber-400",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist */}
      <ul className="divide-y divide-white/6 px-5 py-1">
        {items.map((item) => {
          const done = checked.has(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={item.auto}
                onClick={() => toggle(item.id, item.auto)}
                className={cn(
                  "flex w-full items-center gap-3 py-3 text-left text-sm transition-colors",
                  !item.auto && "hover:text-foreground cursor-pointer",
                  item.auto && "cursor-default",
                )}
              >
                {done
                  ? <CheckCircle2 className="size-4 shrink-0 text-emerald-400" aria-hidden />
                  : <Circle className="size-4 shrink-0 text-muted-foreground/40" aria-hidden />
                }
                <span className={done ? "text-foreground" : "text-muted-foreground"}>
                  {item.label}
                </span>
                {!item.auto && (
                  <span className="ml-auto text-[10px] text-muted-foreground/50">
                    {done ? "Done" : "Tap to mark"}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {pct === 100 && (
        <div className="border-t border-white/8 px-5 py-3 text-center text-xs font-semibold text-emerald-400">
          ✓ You're all set for your journey!
        </div>
      )}
    </section>
  );
}
