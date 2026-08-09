/**
 * TravelPreferences — lightweight preference panel stored in localStorage.
 * Influences TransitEase Score sorting and demo recommendations.
 * No backend required.
 */
import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type TravelPref = "budget" | "fastest" | "comfort" | "fewer-transfers";

const PREFS: { id: TravelPref; label: string; emoji: string; desc: string }[] = [
  { id: "budget",           label: "Budget Friendly", emoji: "💰", desc: "Prioritise lowest fare" },
  { id: "fastest",          label: "Fastest",         emoji: "⚡", desc: "Prioritise shortest time" },
  { id: "comfort",          label: "Comfort",         emoji: "🛋️", desc: "Prioritise ratings & AC" },
  { id: "fewer-transfers",  label: "Fewer Transfers", emoji: "🎯", desc: "Direct routes preferred" },
];

const PREF_KEY = "transitease.travel-pref";

export function getStoredPref(): TravelPref {
  if (typeof window === "undefined") return "budget";
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return (raw as TravelPref) ?? "budget";
  } catch { return "budget"; }
}

export function TravelPreferences() {
  const [selected, setSelected] = useState<TravelPref>("budget");

  useEffect(() => { setSelected(getStoredPref()); }, []);

  const choose = (id: TravelPref) => {
    setSelected(id);
    try { localStorage.setItem(PREF_KEY, id); } catch { /* non-fatal */ }
  };

  return (
    <div className="surface-panel p-5">
      <div className="flex items-center gap-2">
        <Settings2 className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-semibold text-foreground">🎯 Travel Preferences</h2>
        <span className="ml-auto text-xs text-muted-foreground">Shapes your recommendations</span>
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
                ? "border-primary/50 bg-primary/15 text-primary shadow-sm"
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
        Selected: <span className="font-medium text-foreground">{PREFS.find(p => p.id === selected)?.label}</span> · Affects demo recommendations only
      </p>
    </div>
  );
}
