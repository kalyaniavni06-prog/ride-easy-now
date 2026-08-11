import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Download, TicketX } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { QrPlaceholder } from "@/components/QrPlaceholder";
import { TripGuardian } from "@/components/TripGuardian";
import { TravelReadiness } from "@/components/TravelReadiness";
import { JourneyAchievement } from "@/components/JourneyAchievement";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppStore";
import { formatDuration, formatINR } from "@/data/transit";
import { formatLongDate } from "@/lib/search-params";
import { getBookingByPNR, type Booking } from "@/lib/storage";

export const Route = createFileRoute("/confirmation/$pnr")({
  head: () => ({
    meta: [
      { title: "Booking confirmed — TransitEase" },
      { name: "description", content: "Your demo ticket with PNR, seats, timings and fare details." },
      { property: "og:title", content: "Booking confirmed — TransitEase" },
      { property: "og:description", content: "Download or print your TransitEase demo ticket." },
    ],
  }),
  component: Confirmation,
});

function Confirmation() {
  const { pnr } = Route.useParams();
  const { bookings, ready } = useApp();

  // Primary: find booking from React state (respects user filter)
  // Fallback: read directly from localStorage — handles the race condition where
  // ready=true but user state hasn't synced yet, and also handles guest bookings.
  const [localBooking, setLocalBooking] = useState<Booking | null>(null);

  useEffect(() => {
    // Always check localStorage directly so confirmation works immediately after
    // booking, even before onAuthStateChange fires.
    const found = getBookingByPNR(pnr);
    if (found) setLocalBooking(found);
  }, [pnr]);

  const booking = bookings.find((b) => b.id === pnr) ?? localBooking;

  // Only show "not found" when:
  // 1. App is ready (session loaded)
  // 2. We checked localStorage (localBooking attempt complete)
  // 3. Still no booking found
  if (ready && localBooking === null && !booking) {
    // Give one extra tick for localStorage to be checked
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted-foreground">
        Loading ticket…
      </div>
    );
  }

  if (ready && !booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={TicketX}
          title="We couldn't find that ticket"
          description="This booking reference isn't in your history. Check My Bookings for your confirmed journeys."
          action={{ label: "Go to My Bookings", to: "/bookings" }}
          tone="danger"
        />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted-foreground">
        Loading ticket…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:py-0">
      {/* Success header */}
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-400">
          <CheckCircle2 className="size-9" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Booking confirmed</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your demo ticket is ready. A copy has been saved to My Bookings.
        </p>
      </div>

      {/* Ticket card */}
      <article className="surface-panel mt-8 overflow-hidden print:shadow-none">
        {/* Ticket header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-white/10 bg-white/3 px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Booking ID / PNR
            </p>
            <p className="mt-1 text-xl font-bold tracking-widest text-primary">{booking.id}</p>
          </div>
          <span
            className={
              booking.type === "bus"
                ? "rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300"
                : "rounded-full border border-indigo-400/25 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-300"
            }
          >
            {booking.type === "bus" ? "Bus ticket" : "Train ticket"}
          </span>
        </div>

        {/* Ticket body */}
        <div className="grid gap-6 px-6 py-6 sm:grid-cols-[1fr_auto]">
          <div className="space-y-5 min-w-0">
            <div>
              <p className="text-2xl font-bold">
                {booking.from}{" "}
                <span className="text-primary">→</span>{" "}
                {booking.to}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {booking.operator} · {booking.code}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <TicketItem label="Date" value={formatLongDate(booking.date)} />
              <TicketItem label="Departure" value={booking.departure} />
              <TicketItem
                label="Arrival"
                value={`${booking.arrival} (${formatDuration(booking.durationMins)})`}
              />
              <TicketItem label="Seats" value={booking.seats.join(", ")} />
              <TicketItem
                label="Passengers"
                value={booking.passengers.map((p) => p.name).join(", ")}
              />
              <TicketItem label="Fare paid" value={formatINR(booking.fareBreakdown.total)} />
            </dl>

            {/* Fare breakdown */}
            <div className="rounded-lg border border-white/8 bg-white/3 px-4 py-3 text-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fare breakdown</p>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base fare × {booking.seats.length}</span>
                  <span>{formatINR(booking.fareBreakdown.baseFare)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes (5%)</span>
                  <span>{formatINR(booking.fareBreakdown.taxes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Convenience fee</span>
                  <span>{formatINR(booking.fareBreakdown.convenience)}</span>
                </div>
                <div className="flex justify-between border-t border-white/8 pt-1.5 font-semibold">
                  <span>Total paid</span>
                  <span className="text-primary">{formatINR(booking.fareBreakdown.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="rounded-xl border border-white/10 bg-white p-2">
              <QrPlaceholder value={booking.id} size={120} />
            </div>
            <p className="text-[11px] text-muted-foreground">Show at boarding</p>
          </div>
        </div>

        {/* Ticket footer */}
        <div className="border-t border-white/8 bg-white/3 px-6 py-3">
          <p className="text-xs text-muted-foreground">
            Demo ticket — no real journey is booked. Carry a valid government ID during actual travel.
          </p>
        </div>
      </article>

      {/* Achievement badge */}
      <div className="mt-6 print:hidden">
        <JourneyAchievement booking={booking} allBookings={bookings} />
      </div>

      {/* Trip Guardian */}
      <div className="mt-4 print:hidden">
        <TripGuardian booking={booking} />
      </div>

      {/* Travel Readiness Checklist */}
      <div className="mt-4 print:hidden">
        <TravelReadiness booking={booking} />
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
        <Button onClick={() => window.print()} className="shadow-sm">
          <Download className="mr-2 size-4" /> Download / Print ticket
        </Button>
        <Button asChild variant="outline" className="border-white/12 bg-white/4">
          <Link to="/bookings">View My Bookings</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}

function TicketItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}
