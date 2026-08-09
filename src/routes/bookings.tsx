import { createFileRoute, Link } from "@tanstack/react-router";
import { Bus, TicketX, TrainFront } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { RequireAuth } from "@/components/RequireAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/context/AppStore";
import { formatINR } from "@/data/transit";
import { formatLongDate, todayISO } from "@/lib/search-params";
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
      <p className="mt-1 text-sm text-muted-foreground">Tickets are stored on this device for the demo.</p>

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Previous ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={TicketX}
              title="No upcoming journeys"
              description="Once you book a bus or train, your ticket appears here with seat and boarding details."
              action={{ label: "Search journeys", to: "/search" }}
            />
          ) : (
            upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} onCancel={() => { cancelBooking(b.id); toast.success("Booking cancelled"); }} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-4">
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
  const Icon = booking.type === "bus" ? Bus : TrainFront;
  return (
    <article className="surface-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Icon className="size-3.5" aria-hidden /> {booking.type === "bus" ? "Bus" : "Train"}
            </Badge>
            <Badge variant={booking.status === "confirmed" ? "default" : "outline"}>
              {booking.status === "confirmed" ? "Confirmed" : "Cancelled"}
            </Badge>
            <span className="text-xs text-muted-foreground">PNR {booking.id}</span>
          </div>
          <h2 className="mt-2 text-lg font-semibold">
            {booking.from} → {booking.to}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatLongDate(booking.date)} · {booking.departure} – {booking.arrival} · Seats {booking.seats.join(", ")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{formatINR(booking.fareBreakdown.total)}</p>
          <div className="mt-2 flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/confirmation/$pnr" params={{ pnr: booking.id }}>
                View ticket
              </Link>
            </Button>
            {onCancel ? (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
