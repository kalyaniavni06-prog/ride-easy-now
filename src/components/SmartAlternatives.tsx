/**
 * SmartAlternatives — "Better alternatives" panel on journey details.
 * Shows up to 2 other journeys and explains WHY they may be preferable.
 * Based only on available demo data — never invents information.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, Bus, Clock, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, formatINR, searchJourneys, type Journey } from "@/data/transit";
import type { JourneySearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface SmartAlternativesProps {
  currentJourney: Journey;
  search: JourneySearch;
}

interface AlternativeReason {
  icon: typeof TrendingDown;
  text: string;
  positive: boolean;
}

function getReasons(current: Journey, alt: Journey): AlternativeReason[] {
  const reasons: AlternativeReason[] = [];

  const fareDiff = current.fare - alt.fare;
  if (fareDiff > 0) {
    reasons.push({ icon: TrendingDown, text: `${formatINR(fareDiff)} cheaper`, positive: true });
  } else if (fareDiff < 0) {
    reasons.push({ icon: TrendingUp, text: `${formatINR(-fareDiff)} more expensive`, positive: false });
  }

  const durDiff = current.durationMins - alt.durationMins;
  if (durDiff > 0) {
    reasons.push({ icon: Clock, text: `${formatDuration(durDiff)} faster`, positive: true });
  }

  const seatDiff = alt.seatsAvailable - current.seatsAvailable;
  if (seatDiff > 5) {
    reasons.push({ icon: Users, text: `${alt.seatsAvailable} seats (more availability)`, positive: true });
  }

  if (alt.rating > current.rating + 0.2) {
    reasons.push({ icon: TrendingUp, text: `Higher rating: ${alt.rating}★`, positive: true });
  }

  if (alt.direct && !current.direct) {
    reasons.push({ icon: ArrowRight, text: "Direct — no stops", positive: true });
  }

  return reasons.slice(0, 2);
}

export function SmartAlternatives({ currentJourney, search }: SmartAlternativesProps) {
  const all = searchJourneys(search.from, search.to, search.date, search.type);
  const alternatives = all
    .filter((j) => j.id !== currentJourney.id && j.seatsAvailable > 0)
    .sort((a, b) => {
      // Score: cheaper + faster + more seats
      const scoreA = (currentJourney.fare - a.fare) / 100 + (currentJourney.durationMins - a.durationMins) / 60;
      const scoreB = (currentJourney.fare - b.fare) / 100 + (currentJourney.durationMins - b.durationMins) / 60;
      return scoreB - scoreA;
    })
    .slice(0, 2);

  if (alternatives.length === 0) return null;

  return (
    <section className="surface-panel p-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Better alternatives
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">Other options on this route that may suit you better</p>

      <div className="mt-4 space-y-3">
        {alternatives.map((alt) => {
          const reasons = getReasons(currentJourney, alt);
          const isBus = alt.type === "bus";
          const linkSearch = { ...search, from: alt.from, to: alt.to };

          return (
            <div
              key={alt.id}
              className="rounded-xl border border-white/8 bg-white/3 p-4 transition-all hover:border-primary/20 hover:bg-white/5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      isBus
                        ? "border border-cyan-400/20 bg-cyan-400/8 text-cyan-300"
                        : "border border-indigo-400/20 bg-indigo-400/8 text-indigo-300",
                    )}>
                      {isBus ? <Bus className="size-3" /> : <ArrowRight className="size-3" />}
                      {isBus ? "Bus" : "Train"}
                    </span>
                    <span className="truncate text-sm font-semibold text-foreground">{alt.operator}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="font-bold tabular-nums">{alt.departure}</span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                    <span className="font-bold tabular-nums">{alt.arrival}</span>
                    <span className="text-xs text-muted-foreground">({formatDuration(alt.durationMins)})</span>
                  </div>

                  {/* Reasons */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {reasons.map((r, i) => (
                      <span key={i} className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        r.positive
                          ? "border border-emerald-400/25 bg-emerald-400/8 text-emerald-300"
                          : "border border-amber-400/25 bg-amber-400/8 text-amber-300",
                      )}>
                        <r.icon className="size-3" aria-hidden />
                        {r.text}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-lg font-extrabold">{formatINR(alt.fare)}</p>
                  <Button asChild size="sm" className="text-xs shadow-sm" disabled={alt.seatsAvailable === 0}>
                    <Link to="/seats/$journeyId" params={{ journeyId: alt.id }} search={linkSearch}>
                      Book this
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
