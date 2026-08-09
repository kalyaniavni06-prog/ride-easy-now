/**
 * QuickTripMode — "Quick Trip" selector on the home and search pages.
 * Lets users pick Cheapest / Fastest / Best Overall / Most Comfortable
 * and navigates directly to search results highlighting that option.
 */
import { useNavigate } from "@tanstack/react-router";
import { Star, TrendingDown, Trophy, Zap } from "lucide-react";
import { todayISO } from "@/lib/search-params";
import { cn } from "@/lib/utils";

const MODES = [
  {
    id: "cheapest",
    label: "Cheapest",
    icon: TrendingDown,
    desc: "Lowest fare available",
    colour: "border-emerald-400/25 bg-emerald-400/8 text-emerald-300 hover:border-emerald-400/50 hover:bg-emerald-400/15",
    iconColour: "text-emerald-400",
  },
  {
    id: "fastest",
    label: "Fastest",
    icon: Zap,
    desc: "Shortest travel time",
    colour: "border-cyan-400/25 bg-cyan-400/8 text-cyan-300 hover:border-cyan-400/50 hover:bg-cyan-400/15",
    iconColour: "text-cyan-400",
  },
  {
    id: "best",
    label: "Best Overall",
    icon: Trophy,
    desc: "Top TransitEase Score",
    colour: "border-yellow-400/25 bg-yellow-400/8 text-yellow-300 hover:border-yellow-400/50 hover:bg-yellow-400/15",
    iconColour: "text-yellow-400",
  },
  {
    id: "comfortable",
    label: "Most Comfortable",
    icon: Star,
    desc: "Highest rated option",
    colour: "border-indigo-400/25 bg-indigo-400/8 text-indigo-300 hover:border-indigo-400/50 hover:bg-indigo-400/15",
    iconColour: "text-indigo-400",
  },
] as const;

interface QuickTripModeProps {
  from?: string;
  to?: string;
}

export function QuickTripMode({ from = "Mumbai", to = "Pune" }: QuickTripModeProps) {
  const navigate = useNavigate();
  const date = todayISO();

  const go = (mode: (typeof MODES)[number]["id"]) => {
    void navigate({
      to: "/search",
      search: {
        from,
        to,
        date,
        type: "both",
        passengers: 1,
        // Pass the quick mode as a hash-style param so search page can highlight
      },
      hash: `quick-${mode}`,
    });
  };

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Zap className="size-4 text-primary" aria-hidden />
        Quick Trip Mode
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => go(mode.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all active:scale-95",
              mode.colour,
            )}
          >
            <mode.icon className={cn("size-5", mode.iconColour)} aria-hidden />
            <span className="text-xs font-semibold">{mode.label}</span>
            <span className="text-[10px] opacity-70">{mode.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
