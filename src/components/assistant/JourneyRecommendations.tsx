import { Link } from "@tanstack/react-router";
import { ArrowRight, Bus, Clock, Star, TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDuration, formatINR } from "@/data/transit";
import type { RecommendedJourney } from "@/lib/ai-assistant";
import type { JourneySearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

const TAG_CONFIG = {
  best: {
    emoji: "🏆",
    label: "Best Overall",
    border: "border-yellow-400/25",
    bg: "bg-yellow-400/6",
    badge: "border-yellow-400/25 bg-yellow-400/10 text-yellow-300",
  },
  cheapest: {
    emoji: "💰",
    label: "Cheapest",
    border: "border-emerald-400/25",
    bg: "bg-emerald-400/6",
    badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  },
  fastest: {
    emoji: "⚡",
    label: "Fastest",
    border: "border-cyan-400/25",
    bg: "bg-cyan-400/6",
    badge: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
  },
  comfortable: {
    emoji: "🛋️",
    label: "Most Comfortable",
    border: "border-indigo-400/25",
    bg: "bg-indigo-400/6",
    badge: "border-indigo-400/25 bg-indigo-400/10 text-indigo-300",
  },
};

interface JourneyRecommendationsProps {
  recommendations: RecommendedJourney[];
  search: Partial<JourneySearch>;
}

export function JourneyRecommendations({ recommendations, search }: JourneyRecommendationsProps) {
  if (recommendations.length === 0) return null;

  const safeSearch: JourneySearch = {
    from: search.from ?? "",
    to: search.to ?? "",
    date: search.date ?? "",
    type: search.type ?? "both",
    passengers: search.passengers ?? 1,
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI Recommendations</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {recommendations.map(({ journey: j, tag, reason }) => {
          const cfg = TAG_CONFIG[tag];
          const isBus = j.type === "bus";
          const Icon = isBus ? Bus : TrainFront;

          return (
            <div
              key={`${tag}-${j.id}`}
              className={cn(
                "rounded-xl border p-4 transition-all hover:shadow-[var(--shadow-lift)]",
                cfg.border,
                cfg.bg,
              )}
            >
              {/* Tag badge */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    cfg.badge,
                  )}
                >
                  {cfg.emoji} {cfg.label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    isBus
                      ? "border border-cyan-400/20 bg-cyan-400/8 text-cyan-300"
                      : "border border-indigo-400/20 bg-indigo-400/8 text-indigo-300",
                  )}
                >
                  <Icon className="size-3" aria-hidden />
                  {isBus ? "Bus" : "Train"}
                </span>
              </div>

              {/* Operator */}
              <p className="mt-2.5 text-sm font-bold text-foreground">{j.operator}</p>

              {/* Timeline */}
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="font-semibold tabular-nums">{j.departure}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowRight className="size-3" />
                  <Clock className="size-3" />
                  {formatDuration(j.durationMins)}
                </span>
                <span className="font-semibold tabular-nums">{j.arrival}</span>
              </div>

              {/* Stats row */}
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="size-3 fill-yellow-400 text-yellow-400" />
                  {j.rating}
                </span>
                <span>{j.seatsAvailable} seats</span>
                <span className="font-bold text-foreground">{formatINR(j.fare)}/seat</span>
              </div>

              {/* Reason */}
              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{reason}</p>

              {/* CTA */}
              <div className="mt-3 flex gap-2">
                <Button
                  asChild
                  size="sm"
                  className="flex-1 text-xs shadow-sm"
                  disabled={j.seatsAvailable === 0}
                >
                  <Link
                    to="/seats/$journeyId"
                    params={{ journeyId: j.id }}
                    search={safeSearch}
                  >
                    Select seats
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs border-white/12 bg-white/4"
                >
                  <Link
                    to="/journey/$journeyId"
                    params={{ journeyId: j.id }}
                    search={safeSearch}
                  >
                    Details
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
