import { createFileRoute, Link } from "@tanstack/react-router";
import { Bus, TicketX, TrainFront } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/context/AppStore";
import { formatINR } from "@/data/transit";
import { formatLongDate, todayISO } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { Booking } from "@/lib/storage";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — TransitEase" },
      { name: "description", content: "View upcoming and past bus and train tickets, and cancel demo bookings." },
      { property: "og:title", content: "My Bookings — TransitEase" },
      { property: "og:description", content: "All your TransitEase tickets in one place." },
    ],
  }),
  component: () => (
    <RequireAuth redirectTo="/bookings">
      <BookingsPage />
    </RequireAuth>
  ),
});

function BookingsPage() {
  const { bookings, cancelBooking } = useApp();
  const today = todayISO();
  const upcoming = bookings.filter((b) => b.date >= today && b.status === "confirmed");
  const past = bookings.filter((b) => b.date < today || b.status === "cancelled");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">My Bookings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tickets are stored on this device for the demo.
      </p>

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList className="border border-white/10 bg-white/4 p-1">
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            Previous ({past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-5 space-y-4">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={TicketX}
              title="No upcoming journeys"
              description="Once you book a bus or train, your ticket appears here with seat and boarding details."
              action={{ label: "Search journeys", to: "/search" }}
            />
          ) : (
            upcoming.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onCancel={() => {
                  cancelBooking(b.id);
                  toast.success("Booking cancelled");
                }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-5 space-y-4">
          {past.length === 0 ? (
            <EmptyState
              icon={TicketX}
              title="Nothing in your travel history yet"
              description="Completed and cancelled journeys will be listed here."
              action={{ label: "Search journeys", to: "/search" }}
            />
          ) : (
            past.map((b) => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel?: () => void }) {
  const isBus = booking.type === "bus";
  const Icon = isBus ? Bus : TrainFront;
  const isConfirmed = booking.status === "confirmed";

  return (
    <article className="surface-panel p-5 transition-all hover:border-primary/20 hover:shadow-[var(--shadow-lift)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Badges row */}
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
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                isConfirmed
                  ? "border border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                  : "border border-white/10 bg-white/4 text-muted-foreground",
              )}
            >
              {isConfirmed ? "Confirmed" : "Cancelled"}
            </span>
            <span className="text-xs text-muted-foreground">PNR {booking.id}</span>
          </div>

          <h2 className="mt-3 text-lg font-bold">
            {booking.from}{" "}
            <span className="text-primary">→</span>{" "}
            {booking.to}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatLongDate(booking.date)} · {booking.departure} – {booking.arrival} · Seats{" "}
            <span className="font-medium text-foreground">{booking.seats.join(", ")}</span>
          </p>
        </div>

        {/* Price + actions */}
        <div className="flex flex-col items-end gap-3">
          <p className="text-xl font-bold">{formatINR(booking.fareBreakdown.total)}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/12 bg-white/4 hover:bg-white/8"
            >
              <Link to="/confirmation/$pnr" params={{ pnr: booking.id }}>
                View ticket
              </Link>
            </Button>
            {onCancel ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onCancel}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
