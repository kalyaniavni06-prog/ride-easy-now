import { Link } from "@tanstack/react-router";
import { ArrowRight, Bus, Clock, Snowflake, Star, TrainFront } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration, formatINR, type Journey } from "@/data/transit";
import type { JourneySearch } from "@/lib/search-params";

export function JourneyCard({ journey, search }: { journey: Journey; search: JourneySearch }) {
  const Icon = journey.type === "bus" ? Bus : TrainFront;
  const soldOut = journey.seatsAvailable === 0;
  const linkSearch = { ...search, from: journey.from, to: journey.to };

  return (
    <article className="surface-panel p-4 transition-shadow hover:shadow-[var(--shadow-lift)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Icon className="size-3.5" aria-hidden />
              {journey.type === "bus" ? "Bus" : "Train"}
            </Badge>
            <h3 className="truncate text-base font-semibold">{journey.operator}</h3>
            <span className="text-xs text-muted-foreground">{journey.code}</span>
            {journey.ac && journey.type === "bus" ? (
              <Badge variant="outline" className="gap-1 text-xs">
                <Snowflake className="size-3" aria-hidden /> AC
              </Badge>
            ) : null}
            {journey.direct ? (
              <Badge variant="outline" className="text-xs">
                Direct
              </Badge>
            ) : null}
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Star className="size-3.5 fill-warning text-warning" aria-hidden /> {journey.rating}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div>
              <p className="text-xl font-semibold tabular-nums">{journey.departure}</p>
              <p className="text-xs text-muted-foreground">{journey.from}</p>
            </div>
            <div className="flex min-w-24 flex-1 flex-col items-center">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" aria-hidden /> {formatDuration(journey.durationMins)}
              </span>
              <div className="mt-1 flex w-full items-center gap-1" aria-hidden>
                <span className="size-1.5 rounded-full bg-primary" />
                <span className="h-px flex-1 bg-border" />
                <ArrowRight className="size-3 text-muted-foreground" />
              </div>
              <span className="mt-1 text-[11px] text-muted-foreground">
                {journey.stops.length - 2 > 0 ? `${journey.stops.length - 2} stops` : "Non-stop"}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold tabular-nums">{journey.arrival}</p>
              <p className="text-xs text-muted-foreground">{journey.to}</p>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-border pt-4 lg:w-56 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="text-right">
            <p className="text-2xl font-bold">{formatINR(journey.fare)}</p>
            <p className={soldOut ? "text-xs font-medium text-destructive" : "text-xs text-muted-foreground"}>
              {soldOut ? "Sold out" : `${journey.seatsAvailable} seats left`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/journey/$journeyId" params={{ journeyId: journey.id }} search={linkSearch}>
                Details
              </Link>
            </Button>
            <Button asChild size="sm" disabled={soldOut}>
              <Link to="/seats/$journeyId" params={{ journeyId: journey.id }} search={linkSearch}>
                Select seats
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
