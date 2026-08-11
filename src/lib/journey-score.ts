/**
 * TransitEase Score — transparent scoring of journey options.
 * Score 0–100 based on fare, duration, rating, and seat availability.
 * Calculation is deterministic and based only on available demo data.
 */
import type { Journey } from "@/data/transit";
import { formatINR } from "@/data/transit";

export interface ScoredJourney {
  journey: Journey;
  score: number;          // 0–100
  fareScore: number;      // 0–25
  durationScore: number;  // 0–30
  ratingScore: number;    // 0–25
  availScore: number;     // 0–20
  isBestOverall: boolean;
  isEco: boolean;         // trains + direct routes = lower estimated impact
}

export function scoreJourneys(journeys: Journey[]): ScoredJourney[] {
  if (journeys.length === 0) return [];
  const avail = journeys.filter((j) => j.seatsAvailable > 0);
  const pool = avail.length > 0 ? avail : journeys;

  const maxFare = Math.max(...pool.map((j) => j.fare));
  const minFare = Math.min(...pool.map((j) => j.fare));
  const maxDur  = Math.max(...pool.map((j) => j.durationMins));
  const minDur  = Math.min(...pool.map((j) => j.durationMins));

  const scored = journeys.map((j) => {
    const fareRange = maxFare - minFare || 1;
    const durRange  = maxDur  - minDur  || 1;

    // Lower fare = higher score (0–25)
    const fareScore = Math.round(((maxFare - j.fare) / fareRange) * 25);
    // Shorter duration = higher score (0–30)
    const durationScore = Math.round(((maxDur - j.durationMins) / durRange) * 30);
    // Rating 1–5 → 0–25
    const ratingScore = Math.round(((j.rating - 1) / 4) * 25);
    // Seats: 0 = 0, 20+ = 20
    const availScore = j.seatsAvailable === 0 ? 0 : Math.min(20, Math.round((j.seatsAvailable / 20) * 20));

    const score = Math.min(100, fareScore + durationScore + ratingScore + availScore);
    // Eco: trains and direct routes have lower estimated footprint
    const isEco = j.type === "train" || (j.direct && j.type === "bus");

    return { journey: j, score, fareScore, durationScore, ratingScore, availScore, isBestOverall: false, isEco };
  });

  // Mark highest-scorer as best overall
  const best = [...scored].sort((a, b) => b.score - a.score)[0];
  if (best) best.isBestOverall = true;

  return scored;
}

export function buildSmartChoice(journeys: Journey[]): string {
  const scored = scoreJourneys(journeys.filter((j) => j.seatsAvailable > 0));
  if (scored.length === 0) return "No available options found for this route.";

  const top = scored.sort((a, b) => b.score - a.score)[0]!;
  const j = top.journey;

  const cheapest = [...scored].sort((a, b) => a.journey.fare - b.journey.fare)[0]!.journey;
  const fastest  = [...scored].sort((a, b) => a.journey.durationMins - b.journey.durationMins)[0]!.journey;

  const reasons: string[] = [];
  if (j.id === cheapest.id) reasons.push("lowest fare");
  if (j.id === fastest.id)  reasons.push("shortest journey time");
  if (j.rating >= 4.5)      reasons.push(`top-rated (${j.rating}★)`);
  if (j.direct)             reasons.push("direct — no stops");
  if (j.seatsAvailable > 10) reasons.push("good seat availability");

  const reasonStr = reasons.length > 0 ? reasons.join(", ") : "best overall balance of price, speed and rating";

  return `✨ I recommend **${j.operator}** (${j.type === "bus" ? "Bus" : "Train"}, ${j.departure}–${j.arrival}) with a TransitEase Score of **${top.score}/100** — ${reasonStr}. ${j.seatsAvailable} seats available at ${formatINR(j.fare)}/seat.`;
}
