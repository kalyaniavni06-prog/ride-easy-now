import { Link } from "@tanstack/react-router";
import { ArrowRight, Bus, Clock, Snowflake, Star, TrainFront, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDuration, formatINR, type Journey } from "@/data/transit";
import type { JourneySearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export function JourneyCard({ journey, search }: { journey: Journey; search: JourneySearch }) {
  const isBus = journey.type === "bus";
  const Icon = isBus ? Bus : TrainFront;
  const soldOut = journey.seatsAvailable === 0;
  const fewLeft = !soldOut && journey.seatsAvailable <= 5;
  const linkSearch = { ...search, from: journey.from, to: journey.to };

  return (
    <article
      className={cn(
        "surface-panel p-4 sm:p-5 transition-all",
        "hover:border-primary/25 hover:shadow-[var(--shadow-lift)]",
        soldOut && "opacity-70",
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Left: operator + route */}
        <div className="min-w-0 flex-1">
          {/* Header row */}
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

            {journey.ac && isBus ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/8 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                <Snowflake className="size-3" aria-hidden /> AC
              </span>
            ) : null}
            {journey.direct ? (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Direct
              </span>
            ) : null}

            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Star className="size-3.5 fill-yellow-400 text-yellow-400" aria-hidden />
              {journey.rating}
            </span>
          </div>

          {/* Departure → Arrival timeline */}
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
              <Link
                to="/seats/$journeyId"
                params={{ journeyId: journey.id }}
                search={linkSearch}
                aria-disabled={soldOut}
              >
                Select seats
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
