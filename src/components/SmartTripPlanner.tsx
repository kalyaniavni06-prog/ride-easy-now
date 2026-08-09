/**
 * SmartTripPlanner — analyses the current search results and surfaces
 * the best, cheapest and fastest options in a visually prominent card.
 * Uses the same deterministic demo data as the search results.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, Bus, Clock, Star, TrainFront, TrendingDown, TrendingUp, Trophy, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { analyzeJourneys } from "@/lib/ai-assistant";
import { formatDuration, formatINR, searchJourneys } from "@/data/transit";
import type { JourneySearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface SmartTripPlannerProps {
  search: JourneySearch;
}

const TAG_META = {
  best:      { icon: Trophy,      label: "Best Overall",      border: "border-yellow-400/25", bg: "bg-yellow-400/6",  badge: "border-yellow-400/25 bg-yellow-400/10 text-yellow-300",  emoji: "🏆" },
  cheapest:  { icon: TrendingDown, label: "Cheapest",          border: "border-emerald-400/25",bg: "bg-emerald-400/6", badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",emoji: "💰" },
  fastest:   { icon: Zap,         label: "Fastest",            border: "border-cyan-400/25",   bg: "bg-cyan-400/6",   badge: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",          emoji: "⚡" },
  comfortable:{ icon: TrendingUp, label: "Most Comfortable",   border: "border-indigo-400/25", bg: "bg-indigo-400/6", badge: "border-indigo-400/25 bg-indigo-400/10 text-indigo-300",    emoji: "🛋️" },
};

export function SmartTripPlanner({ search }: SmartTripPlannerProps) {
  const journeys = searchJourneys(search.from, search.to, search.date, search.type);
  const recs = analyzeJourneys(journeys, { type: search.type, passengers: search.passengers });

  if (recs.length === 0) return null;

  // Smart savings: how much cheaper is cheapest vs best-overall?
  const best = recs.find((r) => r.tag === "best");
  const cheapest = recs.find((r) => r.tag === "cheapest");
  const fastest = recs.find((r) => r.tag === "fastest");
  const savings = best && cheapest && cheapest.journey.id !== best.journey.id
    ? best.journey.fare - cheapest.journey.fare
    : 0;
  const timeSaved = best && fastest && fastest.journey.id !== best.journey.id
    ? best.journey.durationMins - fastest.journey.durationMins
    : 0;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Trophy className="size-4 text-yellow-400" aria-hidden />
            Smart Trip Planner
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">AI-analysed recommendations for your route</p>
        </div>
      </div>

      {/* Smart savings banner */}
      {(savings > 0 || timeSaved > 0) && (
        <div className="flex flex-wrap gap-3">
          {savings > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/8 px-4 py-2.5">
              <TrendingDown className="size-4 text-emerald-400 shrink-0" aria-hidden />
              <div>
                <p className="text-xs font-semibold text-emerald-300">Save {formatINR(savings)}</p>
                <p className="text-[11px] text-emerald-400/70">vs best-overall pick</p>
              </div>
            </div>
          )}
          {timeSaved > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/8 px-4 py-2.5">
              <Zap className="size-4 text-cyan-400 shrink-0" aria-hidden />
              <div>
                <p className="text-xs font-semibold text-cyan-300">Save {formatDuration(timeSaved)}</p>
                <p className="text-[11px] text-cyan-400/70">on travel time</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendation cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {recs.map(({ journey: j, tag, reason }) => {
          const meta = TAG_META[tag];
          const isBus = j.type === "bus";
          const Icon = isBus ? Bus : TrainFront;
          const linkSearch = { ...search, from: j.from, to: j.to };

          return (
            <div
              key={`${tag}-${j.id}`}
              className={cn(
                "rounded-xl border p-4 transition-all hover:shadow-[var(--shadow-lift)]",
                meta.border, meta.bg,
              )}
            >
              {/* Tag */}
              <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", meta.badge)}>
                {meta.emoji} {meta.label}
              </span>

              {/* Transport badge */}
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  isBus ? "border border-cyan-400/20 bg-cyan-400/8 text-cyan-300" : "border border-indigo-400/20 bg-indigo-400/8 text-indigo-300",
                )}>
                  <Icon className="size-3" aria-hidden />
                  {isBus ? "Bus" : "Train"}
                </span>
                <span className="text-xs text-muted-foreground truncate">{j.operator}</span>
              </div>

              {/* Times */}
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="font-bold tabular-nums">{j.departure}</span>
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <ArrowRight className="size-3" />
                  <Clock className="size-3" />
                  {formatDuration(j.durationMins)}
                </span>
                <span className="font-bold tabular-nums">{j.arrival}</span>
              </div>

              {/* Fare + rating */}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-extrabold tracking-tight">{formatINR(j.fare)}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="size-3 fill-yellow-400 text-yellow-400" />
                  {j.rating}
                </span>
              </div>

              {/* Reason */}
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">{reason}</p>

              {/* CTA */}
              <Button asChild size="sm" className="mt-3 w-full text-xs shadow-sm" disabled={j.seatsAvailable === 0}>
                <Link to="/seats/$journeyId" params={{ journeyId: j.id }} search={linkSearch}>
                  Select seats
                </Link>
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Recommendations based on demo schedule data · Not connected to live feeds
      </p>
    </div>
  );
}
