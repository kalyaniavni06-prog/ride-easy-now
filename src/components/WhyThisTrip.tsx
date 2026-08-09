/**
 * WhyThisTrip — expandable "Why TransitEase recommends this" section.
 * Generates 2–3 transparent reasons based ONLY on available journey data.
 * Never invents information.
 */
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";
import type { ScoredJourney } from "@/lib/journey-score";
import { formatDuration, formatINR } from "@/data/transit";
import { cn } from "@/lib/utils";

interface WhyThisTripProps {
  scored: ScoredJourney;
  allScored: ScoredJourney[];
}

function buildReasons(scored: ScoredJourney, allScored: ScoredJourney[]): string[] {
  const { journey: j, score, isBestOverall } = scored;
  const reasons: string[] = [];

  const others = allScored.filter((s) => s.journey.id !== j.id && s.journey.seatsAvailable > 0);
  if (others.length === 0) return [`Only available option — ${j.seatsAvailable} seats left.`];

  // Fare comparison
  const cheaperThan = others.filter((s) => s.journey.fare > j.fare);
  if (cheaperThan.length > 0) {
    const maxSaving = Math.max(...cheaperThan.map((s) => s.journey.fare - j.fare));
    reasons.push(`${formatINR(maxSaving)} cheaper than the next option`);
  }

  // Duration comparison
  const fasterThan = others.filter((s) => s.journey.durationMins > j.durationMins);
  if (fasterThan.length > 0) {
    const maxSaved = Math.max(...fasterThan.map((s) => s.journey.durationMins - j.durationMins));
    reasons.push(`Arrives ${formatDuration(maxSaved)} earlier`);
  }

  // Rating
  const avgRating = others.reduce((sum, s) => sum + s.journey.rating, 0) / others.length;
  if (j.rating > avgRating + 0.2) {
    reasons.push(`Higher passenger rating (${j.rating}★ vs avg ${avgRating.toFixed(1)}★)`);
  }

  // Availability
  const avgSeats = others.reduce((sum, s) => sum + s.journey.seatsAvailable, 0) / others.length;
  if (j.seatsAvailable > avgSeats * 1.3) {
    reasons.push(`Better seat availability (${j.seatsAvailable} seats)`);
  }

  // Direct
  if (j.direct && others.some((s) => !s.journey.direct)) {
    reasons.push("Direct journey — no intermediate stops");
  }

  // Best overall score
  if (isBestOverall) {
    reasons.push(`Highest TransitEase Score: ${score}/100`);
  }

  // Return top 3 reasons
  return reasons.slice(0, 3);
}

export function WhyThisTrip({ scored, allScored }: WhyThisTripProps) {
  const [open, setOpen] = useState(false);
  const reasons = buildReasons(scored, allScored);
  if (reasons.length === 0) return null;

  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium transition-colors",
          "text-primary/70 hover:text-primary",
        )}
        aria-expanded={open}
      >
        <Info className="size-3.5 shrink-0" aria-hidden />
        Why TransitEase recommends this
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {open && (
        <ul className="mt-2 space-y-1.5 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5">
          {reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
