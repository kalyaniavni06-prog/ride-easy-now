import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Download, TicketX } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { QrPlaceholder } from "@/components/QrPlaceholder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppStore";
import { formatDuration, formatINR } from "@/data/transit";
import { formatLongDate } from "@/lib/search-params";

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
  const booking = bookings.find((b) => b.id === pnr);

  if (ready && !booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={TicketX}
          title="We couldn't find that ticket"
          description="This booking reference isn't linked to your account. Check My Bookings for your confirmed journeys."
          action={{ label: "Go to My Bookings", to: "/bookings" }}
          tone="danger"
        />
      </div>
    );
  }

  if (!booking) return <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-muted-foreground">Loading ticket…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:py-0">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="size-8" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Booking confirmed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your demo ticket is ready. A copy has been added to My Bookings.
        </p>
      </div>

      <article className="surface-panel mt-8 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-border bg-surface px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Booking ID / PNR</p>
            <p className="text-lg font-bold tracking-wider">{booking.id}</p>
          </div>
          <Badge variant="secondary">{booking.type === "bus" ? "Bus ticket" : "Train ticket"}</Badge>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <div>
              <p className="text-xl font-bold">
                {booking.from} → {booking.to}
              </p>
              <p className="text-sm text-muted-foreground">
                {booking.operator} · {booking.code}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Item label="Date" value={formatLongDate(booking.date)} />
              <Item label="Departure" value={booking.departure} />
              <Item label="Arrival" value={`${booking.arrival} (${formatDuration(booking.durationMins)})`} />
              <Item label="Seats" value={booking.seats.join(", ")} />
              <Item label="Passengers" value={booking.passengers.map((p) => p.name).join(", ")} />
              <Item label="Fare paid" value={formatINR(booking.fareBreakdown.total)} />
            </dl>
          </div>
          <div className="flex flex-col items-center gap-2">
            <QrPlaceholder value={booking.id} size={132} />
            <p className="text-[11px] text-muted-foreground">Show at boarding</p>
          </div>
        </div>
      </article>

      <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
        <Button onClick={() => window.print()}>
          <Download className="mr-2 size-4" /> Download / print ticket
        </Button>
        <Button asChild variant="outline">
          <Link to="/bookings">View My Bookings</Link>
        </Button>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
