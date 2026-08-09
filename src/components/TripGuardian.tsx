/**
 * TripGuardian — compact pre-journey checklist panel.
 * Shown on the confirmation/booking page after a booking is made.
 * Uses only data from the existing Booking record — no invented info.
 */
import { Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Clock, MapPin, Shield, Sparkles, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDuration } from "@/data/transit";
import { formatLongDate } from "@/lib/search-params";
import type { Booking } from "@/lib/storage";

interface TripGuardianProps {
  booking: Booking;
}

function pad2(n: number) { return n.toString().padStart(2, "0"); }

function recommendedArrivalTime(departure: string): string {
  const [h, m] = departure.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) - 20;
  const hh = Math.floor(((total % 1440) + 1440) % 1440 / 60);
  const mm = ((total % 60) + 60) % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

export function TripGuardian({ booking }: TripGuardianProps) {
  const isBus = booking.type === "bus";
  const arrivalTime = recommendedArrivalTime(booking.departure);

  const checklist = [
    { done: true,  text: "Booking confirmed — PNR saved" },
    { done: false, text: `Arrive at ${isBus ? "bus stand" : "station"} by ${arrivalTime}` },
    { done: false, text: "Carry valid government photo ID" },
    { done: false, text: `Verify your ${isBus ? "bay" : "platform"} number on the display board` },
    { done: false, text: `Board ${isBus ? "bay" : "platform"} — Seat${booking.seats.length > 1 ? "s" : ""}: ${booking.seats.join(", ")}` },
  ];

  return (
    <section className="surface-panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/8 bg-primary/6 px-5 py-3">
        <Shield className="size-4 text-primary shrink-0" aria-hidden />
        <h2 className="text-sm font-bold text-primary">Trip Guardian</h2>
        <span className="ml-auto text-[11px] text-muted-foreground">Your journey, covered</span>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2">
        {/* Left: key details */}
        <div className="space-y-3">
          <InfoRow icon={Ticket}   label="Booking ID" value={booking.id} mono />
          <InfoRow icon={MapPin}   label="Boarding"   value={`${booking.from} ${isBus ? "Central Bus Stand" : "Junction"}`} />
          <InfoRow icon={MapPin}   label="Drop-off"   value={`${booking.to} ${isBus ? "Bus Terminal" : "Junction"}`} />
          <InfoRow icon={Clock}    label="Departs"    value={`${booking.departure} on ${formatLongDate(booking.date)}`} />
          <InfoRow icon={Clock}    label="Arrives"    value={`${booking.arrival} (${formatDuration(booking.durationMins)})`} />
          <div className="rounded-lg border border-primary/20 bg-primary/8 px-3 py-2">
            <p className="text-xs text-muted-foreground">Recommended arrival</p>
            <p className="text-sm font-bold text-primary">{arrivalTime} at the {isBus ? "bus stand" : "station"}</p>
          </div>
        </div>

        {/* Right: checklist */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Pre-journey checklist
          </p>
          <ul className="space-y-2.5">
            {checklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                {item.done
                  ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
                  : <AlertCircle  className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" aria-hidden />
                }
                <span className={item.done ? "text-emerald-300" : "text-muted-foreground"}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <Button asChild size="sm" variant="outline" className="w-full gap-1.5 border-primary/25 bg-primary/8 text-primary hover:bg-primary/15">
              <Link
                to="/assistant"
                search={{ from: booking.from, to: booking.to, date: booking.date, type: booking.type, passengers: booking.passengers.length }}
              >
                <Sparkles className="size-3.5" />
                Ask AI about this journey
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: typeof Ticket; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium text-foreground ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
