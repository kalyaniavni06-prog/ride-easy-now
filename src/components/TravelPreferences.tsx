/**
 * TravelPreferences — user travel priority, stored in localStorage.
 * Selection ACTUALLY changes the default sort order on the search results page.
 *
 * budget          → sorts by lowest fare
 * fastest         → sorts by shortest duration
 * comfort         → sorts by highest rating, then AC-first
 * fewer-transfers → sorts by direct routes first, then fewest stops
 */
import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type TravelPref = "budget" | "fastest" | "comfort" | "fewer-transfers";

export const PREFS: { id: TravelPref; label: string; emoji: string; desc: string }[] = [
  { id: "budget",           label: "Budget Friendly", emoji: "💰", desc: "Sort by lowest fare" },
  { id: "fastest",          label: "Fastest",         emoji: "⚡", desc: "Sort by shortest time" },
  { id: "comfort",          label: "Comfort",         emoji: "🛋️", desc: "Sort by highest rating" },
  { id: "fewer-transfers",  label: "Direct Routes",   emoji: "🎯", desc: "Direct journeys first" },
];

export const PREF_KEY = "transitease.travel-pref";

export function getStoredPref(): TravelPref {
  if (typeof window === "undefined") return "budget";
  try {
    const raw = localStorage.getItem(PREF_KEY);
    const valid: TravelPref[] = ["budget", "fastest", "comfort", "fewer-transfers"];
    return valid.includes(raw as TravelPref) ? (raw as TravelPref) : "budget";
  } catch {
    return "budget";
  }
}

export function savePref(pref: TravelPref) {
  try { localStorage.setItem(PREF_KEY, pref); } catch { /* non-fatal */ }
}

interface TravelPreferencesProps {
  /** Called when the user changes preference so parent can re-sort results */
  onChange?: (pref: TravelPref) => void;
}

export function TravelPreferences({ onChange }: TravelPreferencesProps) {
  const [selected, setSelected] = useState<TravelPref>("budget");

  useEffect(() => {
    setSelected(getStoredPref());
  }, []);

  const choose = (id: TravelPref) => {
    setSelected(id);
    savePref(id);
    onChange?.(id);
  };

  return (
    <div className="surface-panel p-5">
      <div className="flex items-center gap-2">
        <Settings2 className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-semibold text-foreground">Travel Preferences</h2>
        <span className="ml-auto text-xs text-muted-foreground">Changes result order instantly</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PREFS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => choose(p.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all active:scale-95",
              selected === p.id
                ? "border-primary/50 bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30"
                : "border-white/10 bg-white/4 text-muted-foreground hover:border-white/20 hover:bg-white/7",
            )}
            aria-pressed={selected === p.id}
          >
            <span className="text-lg leading-none" aria-hidden>{p.emoji}</span>
            <span className="text-xs font-semibold">{p.label}</span>
            <span className="text-[10px] opacity-70">{p.desc}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Active:{" "}
        <span className="font-semibold text-primary">
          {PREFS.find((p) => p.id === selected)?.label}
        </span>{" "}
        — results are sorted by this preference
      </p>
    </div>
  );
}
