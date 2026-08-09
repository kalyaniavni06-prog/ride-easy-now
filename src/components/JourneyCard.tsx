import { Link } from "@tanstack/react-router";
import { ArrowRight, Bus, Clock, Leaf, Snowflake, Star, TrainFront, Trophy, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDuration, formatINR, type Journey } from "@/data/transit";
import { scoreJourneys } from "@/lib/journey-score";
import type { JourneySearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface JourneyCardProps {
  journey: Journey;
  search: JourneySearch;
  /** Pass pre-computed scores so all cards in a list share the same pool */
  score?: number;
  isBestOverall?: boolean;
  isEco?: boolean;
}

export function JourneyCard({ journey, search, score, isBestOverall, isEco }: JourneyCardProps) {
  const isBus = journey.type === "bus";
  const Icon = isBus ? Bus : TrainFront;
  const soldOut = journey.seatsAvailable === 0;
  const fewLeft = !soldOut && journey.seatsAvailable <= 5;
  const linkSearch = { ...search, from: journey.from, to: journey.to };

  // Score colour
  const scoreColour =
    score === undefined ? ""
    : score >= 75 ? "text-emerald-400"
    : score >= 50 ? "text-primary"
    : "text-amber-400";

  return (
    <article
      className={cn(
        "surface-panel p-4 sm:p-5 transition-all duration-200",
        "hover:border-primary/30 hover:shadow-[var(--shadow-lift)] hover:-translate-y-px",
        soldOut && "opacity-60",
        isBestOverall && "border-yellow-400/30 bg-yellow-400/3",
      )}
    >
      {/* Best overall banner */}
      {isBestOverall && (
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-yellow-300">
          <Trophy className="size-3.5 fill-yellow-400/30" aria-hidden />
          Best Overall on this route
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Left: operator + route */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Transport badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                isBus
                  ? "border border-cyan-400/25 bg-cyan-400/10 text-cyan-300"
                  : "border border-indigo-400/25 bg-indigo-400/10 text-indigo-300",
              )}
            >
              <Icon className="size-3" aria-hidden />
              {isBus ? "Bus" : "Train"}
            </span>

            <h3 className="truncate text-sm font-bold text-foreground">{journey.operator}</h3>
            <span className="text-xs text-muted-foreground">{journey.code}</span>

            {journey.ac && isBus && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/8 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                <Snowflake className="size-3" aria-hidden /> AC
              </span>
            )}
            {journey.direct && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Direct
              </span>
            )}
            {isEco && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                <Leaf className="size-3" aria-hidden /> Lower est. impact
              </span>
            )}

            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Star className="size-3.5 fill-yellow-400 text-yellow-400" aria-hidden />
              {journey.rating}
            </span>
          </div>

          {/* Departure → Arrival */}
          <div className="mt-4 flex items-center gap-3">
            <div className="min-w-[4.5rem]">
              <p className="text-2xl font-bold tabular-nums leading-none">{journey.departure}</p>
              <p className="mt-1 text-xs text-muted-foreground">{journey.from}</p>
            </div>
            <div className="flex flex-1 flex-col items-center gap-1">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="size-3" aria-hidden />
                {formatDuration(journey.durationMins)}
              </span>
              <div className="flex w-full items-center gap-1" aria-hidden>
                <span className="size-2 rounded-full bg-primary" />
                <span className="h-px flex-1 border-t border-dashed border-border" />
                <ArrowRight className="size-3.5 text-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {journey.stops.length - 2 > 0 ? `${journey.stops.length - 2} stops` : "Non-stop"}
              </span>
            </div>
            <div className="min-w-[4.5rem] text-right">
              <p className="text-2xl font-bold tabular-nums leading-none">{journey.arrival}</p>
              <p className="mt-1 text-xs text-muted-foreground">{journey.to}</p>
            </div>
          </div>

          {/* TransitEase Score */}
          {score !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", score >= 75 ? "bg-emerald-400" : score >= 50 ? "bg-primary" : "bg-amber-400")}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className={cn("text-xs font-semibold tabular-nums", scoreColour)}>
                Score {score}/100
              </span>
            </div>
          )}
        </div>

        {/* Right: fare + actions */}
        <div className="flex items-end justify-between gap-4 border-t border-white/8 pt-4 lg:w-52 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="text-right">
            <p className="text-2xl font-extrabold tracking-tight">{formatINR(journey.fare)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">per passenger</p>

            {soldOut ? (
              <span className="mt-1.5 inline-flex items-center rounded-full border border-red-400/25 bg-red-400/10 px-2 py-0.5 text-[11px] font-semibold text-red-400">
                Sold out
              </span>
            ) : fewLeft ? (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                <Users className="size-3" aria-hidden />
                {journey.seatsAvailable} left
              </span>
            ) : (
              <span className="mt-1.5 inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                {journey.seatsAvailable} seats
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="border-white/12 bg-white/4 hover:bg-white/8">
              <Link to="/journey/$journeyId" params={{ journeyId: journey.id }} search={linkSearch}>
                Details
              </Link>
            </Button>
            <Button asChild size="sm" disabled={soldOut} className="shadow-sm">
              <Link to="/seats/$journeyId" params={{ journeyId: journey.id }} search={linkSearch} aria-disabled={soldOut}>
                Select seats
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Wraps a list of JourneyCards with pre-computed scores */
export function ScoredJourneyList({ journeys, search }: { journeys: ReturnType<typeof scoreJourneys>; search: JourneySearch }) {
  return (
    <>
      {journeys.map(({ journey, score, isBestOverall, isEco }) => (
        <JourneyCard
          key={journey.id}
          journey={journey}
          search={search}
          score={score}
          isBestOverall={isBestOverall}
          isEco={isEco}
        />
      ))}
    </>
  );
}
