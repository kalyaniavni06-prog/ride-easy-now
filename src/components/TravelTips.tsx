/**
 * TravelTips — contextual travel guidance shown on the journey details page.
 * Content is derived from journey data (type, timing, duration) — no fake live data.
 */
import { AlertTriangle, Clock, FileText, HelpCircle, MapPin, Package } from "lucide-react";
import type { Journey } from "@/data/transit";
import { formatDuration } from "@/data/transit";

interface TravelTipsProps {
  journey: Journey;
}

export function TravelTips({ journey }: TravelTipsProps) {
  const isBus = journey.type === "bus";
  const isOvernight = journey.stops[journey.stops.length - 1]?.day ?? 0 > 0;
  const isLong = journey.durationMins >= 240; // 4+ hours

  const depHour = parseInt(journey.departure.split(":")[0] ?? "0", 10);
  const arrivalTime = parseInt(journey.arrival.split(":")[0] ?? "0", 10);
  const isEarlyMorning = depHour < 7;
  const isLateNight = depHour >= 22;

  const tips = [
    {
      icon: Clock,
      title: "Arrive early",
      body: isEarlyMorning
        ? `Departure is at ${journey.departure} — plan to be at the ${isBus ? "bus stand" : "station"} by ${(depHour - 1).toString().padStart(2, "0")}:30.`
        : `Arrive at least 20–30 minutes before ${journey.departure} to find your ${isBus ? "bay" : "platform"} and board comfortably.`,
    },
    {
      icon: FileText,
      title: "Documents to carry",
      body: "Carry a valid government photo ID (Aadhaar, Passport, or Driving Licence). Keep your booking confirmation and PNR accessible on your phone.",
    },
    {
      icon: MapPin,
      title: "Boarding guidance",
      body: isBus
        ? `Board at ${journey.from} Central Bus Stand. Look for the ${journey.code} coach. Check the bay number on the display board inside the terminal.`
        : `Board at ${journey.from} Junction. Your train is ${journey.operator} (${journey.code}). Check the platform number on the departure board.`,
    },
    ...(isLong || isOvernight
      ? [
          {
            icon: Package,
            title: "Long journey essentials",
            body: `Your journey is ${formatDuration(journey.durationMins)}${isOvernight ? " (overnight)" : ""}. Carry water, snacks, a power bank${isOvernight ? ", a blanket, and an eye mask" : ""} for comfort.`,
          },
        ]
      : []),
    ...(isLateNight || arrivalTime < 6
      ? [
          {
            icon: AlertTriangle,
            title: "Late-night travel tip",
            body: "Arrange your onward transport from the arrival point in advance — late-night options may be limited. Share your journey details with someone you trust.",
          },
        ]
      : []),
    {
      icon: HelpCircle,
      title: "Cancellation reminder",
      body: "Cancel more than 24 hours before departure for a full refund (demo policy). Inside 4 hours — no refund applies.",
    },
  ];

  return (
    <section className="surface-panel p-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Smart Travel Tips
      </h2>
      <ul className="mt-4 space-y-3">
        {tips.map((tip) => (
          <li key={tip.title} className="flex gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/8 text-primary">
              <tip.icon className="size-3.5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{tip.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{tip.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
