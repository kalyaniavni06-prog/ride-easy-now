import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArmchairIcon, ArrowLeft, MapPinOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { formatINR, seatLayout, searchJourneys, unavailableSeats } from "@/data/transit";
import { fareBreakdown, validateJourneySearch } from "@/lib/search-params";
import { draftStore } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/seats/$journeyId")({
  validateSearch: validateJourneySearch,
  head: () => ({
    meta: [
      { title: "Select your seats — TransitEase" },
      { name: "description", content: "Pick seats on a visual coach layout and see your total instantly." },
      { property: "og:title", content: "Select your seats — TransitEase" },
      { property: "og:description", content: "Visual seat map with live availability and fare totals." },
    ],
  }),
  component: SeatSelection,
});

function SeatSelection() {
  const { journeyId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const journey = searchJourneys(search.from, search.to, search.date, "both").find((j) => j.id === journeyId);
  const [selected, setSelected] = useState<string[]>([]);

  if (!journey) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={MapPinOff}
          title="We lost track of this service"
          description="This journey isn't available anymore. Search again to see current buses and trains."
          action={{ label: "Back to search", to: "/search" }}
          tone="danger"
        />
      </div>
    );
  }

  const layout = seatLayout(journey);
  const blocked = unavailableSeats(
    journey,
    layout.seats.map((s) => s.id),
  );
  const required = search.passengers;

  const toggleSeat = (id: string) => {
    if (blocked.has(id)) return;
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= required) {
        toast.info(`You've already picked ${required} ${required === 1 ? "seat" : "seats"}`, {
          description: "Deselect a seat first, or change passenger count from search.",
        });
        return prev;
      }
      return [...prev, id];
    });
  };

  const fare = fareBreakdown(journey.fare, selected.length || 0);

  const proceed = () => {
    if (selected.length !== required) {
      toast.error(`Please select ${required} ${required === 1 ? "seat" : "seats"} to continue`);
      return;
    }
    draftStore.set({
      journeyId: journey.id,
      from: search.from,
      to: search.to,
      date: search.date,
      passengers: required,
      seats: selected,
    });
    void navigate({
      to: "/checkout/$journeyId",
      params: { journeyId: journey.id },
      search: { ...search, seats: selected.join(",") },
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6 text-muted-foreground hover:text-foreground">
        <Link to="/journey/$journeyId" params={{ journeyId: journey.id }} search={search}>
          <ArrowLeft className="mr-2 size-4" /> Journey details
        </Link>
      </Button>

      <h1 className="text-2xl font-bold">Select your seats</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {journey.operator} · {search.from} → {search.to} · Departs {journey.departure}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Seat map */}
        <section className="surface-panel p-5">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <Legend className="border-white/15 bg-card" label="Available" />
            <Legend className="border-primary/60 bg-primary/20 text-primary" label="Selected" />
            <Legend className="cursor-not-allowed border-white/8 bg-white/4 text-muted-foreground/50" label="Unavailable" />
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="mx-auto w-fit rounded-2xl border border-white/10 bg-[oklch(0.185_0.024_256)] p-5">
              <p className="mb-4 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {journey.type === "bus" ? "Driver →" : "Engine →"}
              </p>
              <div className="space-y-2">
                {Array.from({ length: layout.rows }, (_, r) => r + 1).map((row) => {
                  const rowSeats = layout.seats.filter((s) => s.row === row);
                  return (
                    <div key={row} className="flex items-center gap-2">
                      <span className="w-5 shrink-0 text-right text-[11px] text-muted-foreground/60">{row}</span>
                      <div className="flex gap-1.5">
                        {rowSeats
                          .filter((s) => s.side === "left")
                          .map((seat) => (
                            <SeatButton
                              key={seat.id}
                              id={seat.id}
                              state={blocked.has(seat.id) ? "blocked" : selected.includes(seat.id) ? "selected" : "free"}
                              onClick={() => toggleSeat(seat.id)}
                            />
                          ))}
                      </div>
                      <span className="w-6 shrink-0" aria-hidden />
                      <div className="flex gap-1.5">
                        {rowSeats
                          .filter((s) => s.side === "right")
                          .map((seat) => (
                            <SeatButton
                              key={seat.id}
                              id={seat.id}
                              state={blocked.has(seat.id) ? "blocked" : selected.includes(seat.id) ? "selected" : "free"}
                              onClick={() => toggleSeat(seat.id)}
                            />
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="surface-panel p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Your selection
            </h2>

            <div className="mt-3 min-h-[2.5rem]">
              {selected.length === 0 ? (
                <p className="text-sm text-muted-foreground">No seats selected yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-primary/30 bg-primary/12 px-2 py-1 text-xs font-semibold text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {selected.length}/{required} seats selected for this booking.
            </p>

            <dl className="mt-4 space-y-2.5 border-t border-white/8 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Base fare</dt>
                <dd className="tabular-nums">{formatINR(fare.baseFare)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Taxes &amp; fees</dt>
                <dd className="tabular-nums">{formatINR(fare.taxes + fare.convenience)}</dd>
              </div>
              <div className="flex justify-between border-t border-white/8 pt-2.5">
                <dt className="font-semibold">Total</dt>
                <dd className="text-base font-bold">{formatINR(fare.total)}</dd>
              </div>
            </dl>

            <Button
              className="mt-4 w-full shadow-sm"
              size="lg"
              onClick={proceed}
              disabled={selected.length !== required}
            >
              Continue to passenger details
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Select {required} {required === 1 ? "seat" : "seats"} to continue
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SeatButton({
  id,
  state,
  onClick,
}: {
  id: string;
  state: "free" | "selected" | "blocked";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "blocked"}
      aria-pressed={state === "selected"}
      aria-label={`Seat ${id} — ${state === "blocked" ? "unavailable" : state === "selected" ? "selected" : "available"}`}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg border text-[11px] font-semibold transition-all",
        state === "free" &&
          "border-white/15 bg-card text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
        state === "selected" &&
          "scale-105 border-primary bg-primary/20 text-primary shadow-sm",
        state === "blocked" &&
          "cursor-not-allowed border-white/6 bg-white/3 text-muted-foreground/30",
      )}
    >
      {id}
    </button>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn("flex size-6 items-center justify-center rounded-md border", className)}
        aria-hidden
      >
        <ArmchairIcon className="size-3.5" />
      </span>
      {label}
    </span>
  );
}
