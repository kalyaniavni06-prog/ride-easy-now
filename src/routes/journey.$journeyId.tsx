import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bus, Clock, MapPinOff, Snowflake, Star, TrainFront } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { formatDuration, formatINR, searchJourneys } from "@/data/transit";
import { fareBreakdown, formatLongDate, validateJourneySearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/journey/$journeyId")({
  validateSearch: validateJourneySearch,
  head: () => ({
    meta: [
      { title: "Journey details — TransitEase" },
      { name: "description", content: "Route timeline, stops, fare breakdown and seat availability." },
      { property: "og:title", content: "Journey details — TransitEase" },
      { property: "og:description", content: "See stops, timings and a full fare breakdown before you book." },
    ],
  }),
  component: JourneyDetails,
});

function JourneyDetails() {
  const { journeyId } = Route.useParams();
  const search = Route.useSearch();
  const journey = searchJourneys(search.from, search.to, search.date, "both").find((j) => j.id === journeyId);

  if (!journey) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={MapPinOff}
          title="This journey is no longer available"
          description="Schedules change through the day. Head back to results and pick another service."
          action={{ label: "Back to search", to: "/search" }}
          tone="danger"
        />
      </div>
    );
  }

  const isBus = journey.type === "bus";
  const Icon = isBus ? Bus : TrainFront;
  const fare = fareBreakdown(journey.fare, search.passengers);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6 text-muted-foreground hover:text-foreground">
        <Link to="/search" search={search}>
          <ArrowLeft className="mr-2 size-4" /> Back to results
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Operator card */}
          <section className="surface-panel p-5">
            <div className="flex flex-wrap items-center gap-2">
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
              {journey.ac && isBus ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/8 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                  <Snowflake className="size-3" aria-hidden /> AC
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {journey.direct ? "Direct" : "Multiple stops"}
              </span>
              <span className="ml-auto flex items-center gap-1 text-sm font-medium text-muted-foreground">
                <Star className="size-4 fill-yellow-400 text-yellow-400" aria-hidden />
                {journey.rating}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold">{journey.operator}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {journey.code} · {formatLongDate(search.date)} · {formatDuration(journey.durationMins)}
            </p>

            {journey.amenities.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {journey.amenities.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {a}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          {/* Route timeline */}
          <section className="surface-panel p-5">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Route &amp; stops
            </h2>
            <ol className="space-y-0">
              {journey.stops.map((stop, i) => {
                const isFirst = i === 0;
                const isLast = i === journey.stops.length - 1;
                return (
                  <li key={`${stop.name}-${i}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "mt-0.5 size-3 rounded-full border-2 shrink-0",
                          isFirst || isLast
                            ? "border-primary bg-primary"
                            : "border-border bg-card",
                        )}
                        aria-hidden
                      />
                      {!isLast && (
                        <span className="mt-1 w-px flex-1 border-l border-dashed border-border" aria-hidden />
                      )}
                    </div>
                    <div className={cn("pb-6 min-w-0", isLast && "pb-0")}>
                      <p className={cn("text-sm font-semibold", (isFirst || isLast) && "text-primary")}>
                        {stop.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{stop.time}</span>
                        {stop.day > 0 ? ` (+${stop.day}d)` : ""} ·{" "}
                        {isFirst ? "Boarding point" : isLast ? "Drop point" : "Intermediate stop"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Boarding / destination cards */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="surface-panel p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Boarding</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {journey.from} {isBus ? "Central Bus Stand" : "Junction, Platform 3"}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4 text-primary" aria-hidden />
                Departs{" "}
                <span className="font-semibold text-foreground">{journey.departure}</span>
              </p>
            </div>
            <div className="surface-panel p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Destination</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {journey.to} {isBus ? "Bus Terminal" : "Junction"}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4 text-primary" aria-hidden />
                Arrives{" "}
                <span className="font-semibold text-foreground">{journey.arrival}</span>
              </p>
            </div>
          </section>

          {/* Cancellation policy */}
          <section className="surface-panel p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Cancellation policy
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { timing: "More than 24 hours before departure", refund: "Full refund (minus ₹50 processing fee)" },
                { timing: "4–24 hours before departure", refund: "50% refund" },
                { timing: "Less than 4 hours before departure", refund: "No refund" },
              ].map((row) => (
                <li key={row.timing} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
                  <span className="text-muted-foreground">{row.timing}</span>
                  <span className="font-medium text-foreground">{row.refund}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Demo policy only — no real refunds are processed in this prototype.
            </p>
          </section>
        </div>

        {/* Right: fare sidebar */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="surface-panel p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Fare breakdown
            </h2>
            <p className="mt-4 text-3xl font-extrabold tracking-tight">{formatINR(fare.total)}</p>
            <p className="text-xs text-muted-foreground">for {search.passengers} {search.passengers === 1 ? "passenger" : "passengers"}</p>

            <dl className="mt-5 space-y-2.5 text-sm">
              <FareRow label={`Base fare × ${search.passengers}`} value={formatINR(fare.baseFare)} />
              <FareRow label="Taxes (5%)" value={formatINR(fare.taxes)} />
              <FareRow label="Convenience fee" value={formatINR(fare.convenience)} />
              <div className="border-t border-white/8 pt-2.5">
                <FareRow label="Total payable" value={formatINR(fare.total)} bold />
              </div>
            </dl>

            <div className="mt-5 flex items-center justify-between rounded-lg border border-white/8 bg-white/4 px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Seats available</span>
              <span
                className={cn(
                  "font-semibold",
                  journey.seatsAvailable === 0
                    ? "text-destructive"
                    : journey.seatsAvailable <= 5
                      ? "text-amber-300"
                      : "text-emerald-400",
                )}
              >
                {journey.seatsAvailable === 0 ? "Sold out" : journey.seatsAvailable}
              </span>
            </div>

            <Button
              asChild
              className="mt-4 w-full shadow-sm"
              size="lg"
              disabled={journey.seatsAvailable === 0}
            >
              <Link to="/seats/$journeyId" params={{ journeyId: journey.id }} search={search}>
                Select seats
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FareRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={bold ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</dt>
      <dd className={bold ? "text-base font-bold" : "tabular-nums"}>{value}</dd>
    </div>
  );
}
