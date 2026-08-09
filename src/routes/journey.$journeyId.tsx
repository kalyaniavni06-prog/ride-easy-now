import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bus, Clock, MapPinOff, Snowflake, TrainFront } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration, formatINR, searchJourneys } from "@/data/transit";
import { fareBreakdown, formatLongDate, validateJourneySearch } from "@/lib/search-params";

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

  const Icon = journey.type === "bus" ? Bus : TrainFront;
  const fare = fareBreakdown(journey.fare, search.passengers);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link to="/search" search={search}>
          <ArrowLeft className="mr-2 size-4" /> Back to results
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="surface-panel p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Icon className="size-3.5" aria-hidden /> {journey.type === "bus" ? "Bus" : "Train"}
              </Badge>
              {journey.ac && journey.type === "bus" ? (
                <Badge variant="outline" className="gap-1">
                  <Snowflake className="size-3" aria-hidden /> AC
                </Badge>
              ) : null}
              <Badge variant="outline">{journey.direct ? "Direct" : "Multiple stops"}</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-bold">{journey.operator}</h1>
            <p className="text-sm text-muted-foreground">
              {journey.code} · {formatLongDate(search.date)} · {formatDuration(journey.durationMins)}
            </p>

            {journey.amenities.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {journey.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground">
                    {a}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="surface-panel p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Route & stops</h2>
            <ol className="mt-4 space-y-0">
              {journey.stops.map((stop, i) => {
                const last = i === journey.stops.length - 1;
                return (
                  <li key={`${stop.name}-${i}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={
                          i === 0 || last
                            ? "size-3 rounded-full border-2 border-primary bg-primary"
                            : "size-3 rounded-full border-2 border-border bg-card"
                        }
                        aria-hidden
                      />
                      {!last ? <span className="w-px flex-1 bg-border" aria-hidden /> : null}
                    </div>
                    <div className={last ? "pb-0" : "pb-6"}>
                      <p className="text-sm font-semibold">{stop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {stop.time}
                        {stop.day > 0 ? ` (+${stop.day}d)` : ""} ·{" "}
                        {i === 0 ? "Boarding point" : last ? "Drop point" : "Intermediate stop"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="surface-panel p-5">
              <h3 className="text-sm font-semibold">Boarding</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {journey.from} {journey.type === "bus" ? "Central Bus Stand" : "Junction, Platform 3"}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm">
                <Clock className="size-4 text-muted-foreground" aria-hidden /> Departs {journey.departure}
              </p>
            </div>
            <div className="surface-panel p-5">
              <h3 className="text-sm font-semibold">Destination</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {journey.to} {journey.type === "bus" ? "Bus Terminal" : "Junction"}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm">
                <Clock className="size-4 text-muted-foreground" aria-hidden /> Arrives {journey.arrival}
              </p>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="surface-panel p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fare breakdown</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label={`Base fare × ${search.passengers}`} value={formatINR(fare.baseFare)} />
              <Row label="Taxes (5%)" value={formatINR(fare.taxes)} />
              <Row label="Convenience fee" value={formatINR(fare.convenience)} />
              <div className="border-t border-border pt-2">
                <Row label="Total payable" value={formatINR(fare.total)} bold />
              </div>
            </dl>
            <p className="mt-4 text-sm">
              <span className="font-semibold">{journey.seatsAvailable}</span>{" "}
              <span className="text-muted-foreground">of {journey.seatsTotal} seats available</span>
            </p>
            <Button asChild className="mt-4 w-full" size="lg" disabled={journey.seatsAvailable === 0}>
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

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</dt>
      <dd className={bold ? "text-base font-bold" : "tabular-nums"}>{value}</dd>
    </div>
  );
}
