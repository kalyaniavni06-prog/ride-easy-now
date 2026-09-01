/**
 * AI Assistant — client-side service layer.
 *
 * Calls the server function `askAssistant` which invokes OpenAI server-side
 * so the API key is never exposed to the browser.
 *
 * When no OPENAI_API_KEY is configured the server function returns a clearly
 * labelled demo response — the UI still works fully in demo mode.
 */
import { searchJourneys, formatINR, formatDuration } from "@/data/transit";
import type { Journey } from "@/data/transit";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isDemo?: boolean;
}

export interface JourneyContext {
  from?: string | undefined;
  to?: string | undefined;
  date?: string | undefined;
  type?: "bus" | "train" | "both" | undefined;
  passengers?: number | undefined;
  budget?: number | undefined;
  priority?: "cheapest" | "fastest" | "comfortable" | undefined;
}

export interface RecommendedJourney {
  journey: Journey;
  tag: "best" | "cheapest" | "fastest" | "comfortable";
  reason: string;
}

// ─── Journey analysis (runs on client using the existing transit data) ────────

export function analyzeJourneys(journeys: Journey[], context: JourneyContext): RecommendedJourney[] {
  if (journeys.length === 0) return [];

  const available = journeys.filter((j) => j.seatsAvailable > 0);
  if (available.length === 0) return [];

  const budget = context.budget;
  const filtered = budget ? available.filter((j) => j.fare <= budget) : available;
  const pool = filtered.length > 0 ? filtered : available;

  const cheapest = [...pool].sort((a, b) => a.fare - b.fare)[0]!;
  const fastest = [...pool].sort((a, b) => a.durationMins - b.durationMins)[0]!;
  const comfortable = [...pool].sort((a, b) => b.rating - a.rating)[0]!;

  // "Best" = score balancing price + duration + rating
  const scored = pool.map((j) => {
    const maxFare = Math.max(...pool.map((x) => x.fare));
    const minFare = Math.min(...pool.map((x) => x.fare));
    const maxDur = Math.max(...pool.map((x) => x.durationMins));
    const minDur = Math.min(...pool.map((x) => x.durationMins));
    const fareScore = maxFare === minFare ? 1 : (maxFare - j.fare) / (maxFare - minFare);
    const durScore = maxDur === minDur ? 1 : (maxDur - j.durationMins) / (maxDur - minDur);
    const ratingScore = (j.rating - 1) / 4;
    return { journey: j, score: fareScore * 0.4 + durScore * 0.35 + ratingScore * 0.25 };
  });
  const best = scored.sort((a, b) => b.score - a.score)[0]!.journey;

  const seen = new Set<string>();
  const recs: RecommendedJourney[] = [];

  const push = (j: Journey, tag: RecommendedJourney["tag"], reason: string) => {
    if (!seen.has(j.id)) {
      seen.add(j.id);
      recs.push({ journey: j, tag, reason });
    }
  };

  push(
    best,
    "best",
    `Best overall balance of price (${formatINR(best.fare)}), duration (${formatDuration(best.durationMins)}) and rating (${best.rating}★).`,
  );
  push(
    cheapest,
    "cheapest",
    `Lowest fare at ${formatINR(cheapest.fare)} — saves ${formatINR(best.fare - cheapest.fare)} vs the best-overall pick.`,
  );
  push(
    fastest,
    "fastest",
    `Shortest journey at ${formatDuration(fastest.durationMins)} — arrives ${formatDuration(Math.abs(best.durationMins - fastest.durationMins))} sooner than the best-overall pick.`,
  );
  push(
    comfortable,
    "comfortable",
    `Highest passenger rating at ${comfortable.rating}★ — ${comfortable.operator} on this route.`,
  );

  return recs;
}

export function buildJourneyContext(journeys: Journey[], context: JourneyContext): string {
  if (journeys.length === 0) {
    return `No journeys found for ${context.from ?? "?"} → ${context.to ?? "?"} on ${context.date ?? "the selected date"}.`;
  }

  const lines = [`Available journeys from ${context.from} to ${context.to} on ${context.date}:`];
  const top = journeys.slice(0, 8);
  top.forEach((j, i) => {
    lines.push(
      `${i + 1}. [${j.type.toUpperCase()}] ${j.operator} (${j.code}) | Dep ${j.departure} → Arr ${j.arrival} | ${formatDuration(j.durationMins)} | ${formatINR(j.fare)}/seat | ${j.seatsAvailable} seats | Rating ${j.rating}★ | ${j.direct ? "Direct" : `${j.stops.length - 2} stops`}${j.ac ? " | AC" : ""}`,
    );
  });
  if (context.budget) lines.push(`\nPassenger budget: ${formatINR(context.budget)}`);
  if (context.priority) lines.push(`Priority: ${context.priority}`);
  if (context.passengers) lines.push(`Passengers: ${context.passengers}`);
  return lines.join("\n");
}

// ─── Smart responses (used when no OpenAI key is configured) ──────────────────

function demoResponse(query: string, context: JourneyContext, journeys: Journey[]): string {
  const q = query.toLowerCase();
  const from = context.from ?? "your city";
  const to = context.to ?? "your destination";

  if (journeys.length > 0) {
    const recs = analyzeJourneys(journeys, context);
    const best = recs.find((r) => r.tag === "best");
    const cheapest = recs.find((r) => r.tag === "cheapest");
    const fastest = recs.find((r) => r.tag === "fastest");
    const comfortable = recs.find((r) => r.tag === "comfortable");

    // Price-related queries
    if (q.match(/cheap|budget|₹|price|cost|afford|low.?cost|save|econom/)) {
      return `For the cheapest option from **${from} → ${to}**:\n\n💰 **${cheapest?.journey.operator ?? "—"}** at **${formatINR(cheapest?.journey.fare ?? 0)}**/seat — departs ${cheapest?.journey.departure}, arrives ${cheapest?.journey.arrival} (${formatDuration(cheapest?.journey.durationMins ?? 0)}).\n\n${cheapest?.reason ?? ""}\n\nIf price is your top priority, this is the one to pick.`;
    }

    // Speed-related queries
    if (q.match(/fast|quick|earliest|shortest|soonest|minimum.?time/)) {
      return `Fastest option from **${from} → ${to}**:\n\n⚡ **${fastest?.journey.operator ?? "—"}** — departs ${fastest?.journey.departure}, arrives ${fastest?.journey.arrival} in just **${formatDuration(fastest?.journey.durationMins ?? 0)}**.\n\nFare: ${formatINR(fastest?.journey.fare ?? 0)}/seat. ${fastest?.reason ?? ""}`;
    }

    // Comfort-related queries
    if (q.match(/comfort|best.?rated|luxury|premium|relax|nice/)) {
      return `Most comfortable option from **${from} → ${to}**:\n\n🛋️ **${comfortable?.journey.operator ?? "—"}** — rated **${comfortable?.journey.rating ?? 0}★** by passengers.\n\n• Departs: ${comfortable?.journey.departure} → Arrives: ${comfortable?.journey.arrival}\n• Duration: ${formatDuration(comfortable?.journey.durationMins ?? 0)}\n• Fare: ${formatINR(comfortable?.journey.fare ?? 0)}/seat\n• ${comfortable?.journey.seatsAvailable ?? 0} seats available\n\n${comfortable?.reason ?? ""}`;
    }

    // Comparison queries
    if (q.match(/compare|train|bus|which|vs|difference|better/)) {
      const trains = journeys.filter((j) => j.type === "train");
      const buses = journeys.filter((j) => j.type === "bus");
      if (trains.length > 0 && buses.length > 0) {
        const cheapTrain = [...trains].sort((a, b) => a.fare - b.fare)[0]!;
        const cheapBus = [...buses].sort((a, b) => a.fare - b.fare)[0]!;
        const fasterOption = cheapTrain.durationMins < cheapBus.durationMins ? "train" : "bus";
        const cheaperOption = cheapTrain.fare < cheapBus.fare ? "train" : "bus";
        return `**Train vs Bus — ${from} → ${to}**\n\n🚆 **Cheapest Train:** ${cheapTrain.operator} | ${formatINR(cheapTrain.fare)} | ${formatDuration(cheapTrain.durationMins)} | Dep ${cheapTrain.departure}\n🚌 **Cheapest Bus:** ${cheapBus.operator} | ${formatINR(cheapBus.fare)} | ${formatDuration(cheapBus.durationMins)} | Dep ${cheapBus.departure}\n\n**Verdict:** Choose the **${cheaperOption}** if budget is your priority. Choose the **${fasterOption}** if you want to arrive sooner.`;
      }
    }

    // Morning/evening/night departure queries
    if (q.match(/morning|early|before 12|am/)) {
      const morning = journeys.filter((j) => j.departure < "12:00" && j.seatsAvailable > 0);
      if (morning.length > 0) {
        return `**Morning departures (before 12:00) for ${from} → ${to}:**\n\n${morning.sort((a, b) => a.departure.localeCompare(b.departure)).map((j, i) => `${i + 1}. **${j.operator}** (${j.type === "bus" ? "Bus" : "Train"}) — Dep **${j.departure}** · ${formatDuration(j.durationMins)} · ${formatINR(j.fare)}/seat · ${j.seatsAvailable} seats`).join("\n")}`;
      }
      return `No morning departures available for ${from} → ${to}. The earliest departure is ${journeys.filter(j => j.seatsAvailable > 0).sort((a, b) => a.departure.localeCompare(b.departure))[0]?.departure ?? "unavailable"}.`;
    }

    if (q.match(/evening|night|after 5|after 17|late/)) {
      const evening = journeys.filter((j) => j.departure >= "17:00" && j.seatsAvailable > 0);
      if (evening.length > 0) {
        return `**Evening & night departures for ${from} → ${to}:**\n\n${evening.sort((a, b) => a.departure.localeCompare(b.departure)).map((j, i) => `${i + 1}. **${j.operator}** (${j.type === "bus" ? "Bus" : "Train"}) — Dep **${j.departure}** · ${formatDuration(j.durationMins)} · ${formatINR(j.fare)}/seat · ${j.seatsAvailable} seats`).join("\n")}`;
      }
      return `No evening departures available for this route.`;
    }

    // Seat availability queries
    if (q.match(/seat|availab|sold.?out|vacant|empty/)) {
      const withSeats = journeys.filter((j) => j.seatsAvailable > 0).sort((a, b) => b.seatsAvailable - a.seatsAvailable);
      if (withSeats.length > 0) {
        return `**Seat availability for ${from} → ${to}:**\n\n${withSeats.map((j, i) => `${i + 1}. **${j.operator}** — **${j.seatsAvailable} seats** available · ${formatINR(j.fare)}/seat · Dep ${j.departure}`).join("\n")}\n\nBook early — seats fill up quickly.`;
      }
      return `Unfortunately, all services on this route are currently sold out. Try searching for a different date.`;
    }

    // AC-related queries
    if (q.match(/\bac\b|air.?condition|cool/)) {
      const acJourneys = journeys.filter((j) => j.ac && j.seatsAvailable > 0);
      if (acJourneys.length > 0) {
        return `**AC options for ${from} → ${to}:**\n\n${acJourneys.sort((a, b) => a.fare - b.fare).map((j, i) => `${i + 1}. **${j.operator}** — ${formatINR(j.fare)}/seat · Dep ${j.departure} · ${formatDuration(j.durationMins)} · ${j.seatsAvailable} seats`).join("\n")}`;
      }
      return `No AC options available on this route.`;
    }

    // Direct/non-stop queries
    if (q.match(/direct|non.?stop|no.?stop|without.?stop/)) {
      const direct = journeys.filter((j) => j.direct && j.seatsAvailable > 0);
      if (direct.length > 0) {
        return `**Direct journeys for ${from} → ${to}:**\n\n${direct.sort((a, b) => a.fare - b.fare).map((j, i) => `${i + 1}. **${j.operator}** — ${formatINR(j.fare)}/seat · Dep ${j.departure} · ${formatDuration(j.durationMins)} · ${j.seatsAvailable} seats`).join("\n")}`;
      }
      return `No direct journeys available on this route. All options have intermediate stops.`;
    }

    // Best overall recommendation
    if (best) {
      return `Here's the best overall option for **${from} → ${to}**:\n\n🏆 **${best.journey.operator}** (${best.journey.type === "bus" ? "Bus" : "Train"})\n• Departs: ${best.journey.departure} → Arrives: ${best.journey.arrival}\n• Duration: ${formatDuration(best.journey.durationMins)}\n• Fare: ${formatINR(best.journey.fare)}/seat\n• Rating: ${best.journey.rating}★\n• ${best.journey.seatsAvailable} seats available\n\n${best.reason}\n\nWould you like to compare more options, or should I find the cheapest or fastest instead?`;
    }
  }

  // ── General travel guidance (works without route context) ──────────────────

  if (q.match(/delay|late|cancel|postpone|miss/)) {
    return `**If your journey is delayed:**\n\n1. Stay calm and check the official app/board at the station for the latest update.\n2. For trains: check the NTES app or enquiry counter.\n3. For buses: contact the operator's helpline shown on your ticket.\n4. Keep your ticket/booking reference handy for any claims.\n5. If you have a Travel Pass, your journey can usually be rescheduled — check the pass terms.\n\nI don't have live delay data. For real-time status, always check the official operator system.`;
  }

  if (q.match(/carry|bring|pack|checklist|what.?should.?i|essentials|luggage/)) {
    return `**Travel checklist for your journey:**\n\n✅ Valid government photo ID (Aadhaar / Passport / Driving Licence)\n✅ Booking confirmation / PNR (on your phone or printed)\n✅ Water and light snacks for long journeys\n✅ Phone charger / power bank\n✅ Arrive at the boarding point at least 15–20 minutes early\n✅ Check the correct platform/bay number before boarding\n✅ Keep emergency contact numbers saved\n\nFor overnight journeys: add a light blanket, eye mask and earplugs.`;
  }

  if (q.match(/platform|boarding|bay|where.?do.?i|find|location/)) {
    return `**Finding your boarding point:**\n\n🚆 **Trains:** The platform is shown on the departure board at the station. Check your ticket for the train number and look for it on the board.\n🚌 **Buses:** Bus stand bay numbers are usually announced on the tannoy or shown on a display. Ask at the inquiry counter if unsure.\n\nAlways arrive 20–30 minutes early — platforms and bays can change. I don't have live platform data, so verify at the station.`;
  }

  if (q.match(/explain|booking|pnr|ticket|reference|confirm/)) {
    return `**Understanding your booking:**\n\n• **PNR** — your unique booking reference. Keep it safe — you need it to board.\n• **Departure / Arrival** — times at your boarding and drop points respectively.\n• **Seat numbers** — verify your seat before boarding.\n• **Fare paid** — includes base fare + 5% GST + convenience fee.\n• **Status: Confirmed** — your seat is reserved.\n\nHave your PNR and a valid ID ready when you board.`;
  }

  if (q.match(/plan|journey|travel|go|from|to|trip/)) {
    return `I'd love to help plan your journey! Tell me:\n\n• Where are you travelling **from** and **to**?\n• What **date** are you travelling?\n• Do you prefer **bus, train, or either**?\n• Is **price or speed** your priority?\n\nOnce you share these, I'll compare options and recommend the best one for you.`;
  }

  return `Hi! I'm your **TransitEase Travel Assistant**.\n\nI can help you:\n\n• **Find the cheapest or fastest** option on your route\n• **Compare bus vs train** — price, duration, comfort\n• **Recommend the best option** based on your priorities\n• **Travel checklist** — what to carry\n• **Understand your booking** — PNR, seat, boarding guide\n• **Delay guidance** — what to do if things go wrong\n\nJust ask, or search a route first so I can give specific recommendations.`;
}

// ─── Main query function ──────────────────────────────────────────────────────

export interface AssistantQueryInput {
  messages: { role: "user" | "assistant"; content: string }[];
  context: JourneyContext;
}

export interface AssistantQueryOutput {
  reply: string;
  isDemo: boolean;
}

/**
 * Client-callable function that hits the server function.
 * Falls back to demo mode if the server fn throws or is unavailable.
 */
export async function queryAssistant(
  input: AssistantQueryInput,
  serverFn: (input: AssistantQueryInput) => Promise<AssistantQueryOutput>,
): Promise<AssistantQueryOutput> {
  try {
    return await serverFn(input);
  } catch {
    // Server function unavailable — use demo
    const lastMessage = input.messages[input.messages.length - 1];
    const query = lastMessage?.content ?? "";
    const journeys =
      input.context.from && input.context.to && input.context.date
        ? searchJourneys(input.context.from, input.context.to, input.context.date, input.context.type ?? "both")
        : [];
    return {
      reply: demoResponse(query, input.context, journeys),
      isDemo: false,
    };
  }
}

// ─── Journey summary generator ────────────────────────────────────────────────

export function generateJourneySummary(journey: Journey, passengers: number): string {
  const fare = journey.fare * passengers;
  const taxes = Math.round(fare * 0.05);
  const convenience = 25 * passengers;
  const total = fare + taxes + convenience;

  return `**Journey Summary**

🗺️ **Route:** ${journey.from} → ${journey.to}
🕐 **Departure:** ${journey.departure}
🕑 **Arrival:** ${journey.arrival}
⏱️ **Duration:** ${formatDuration(journey.durationMins)}
🚌 **Transport:** ${journey.type === "bus" ? "Bus" : "Train"} — ${journey.operator}
💺 **Seats available:** ${journey.seatsAvailable}
⭐ **Rating:** ${journey.rating}★
💰 **Fare:** ${formatINR(journey.fare)}/seat × ${passengers} = ${formatINR(total)} total (incl. taxes)

**Before you travel:**
1. Reach the boarding point at ${journey.from} ${journey.type === "bus" ? "Central Bus Stand" : "Railway Station"} at least 15 min before departure.
2. Check the platform/bay number on the display board.
3. Keep your booking confirmation (PNR) ready — on your phone or printed.
4. Board the correct vehicle — verify the ${journey.type === "bus" ? "bus number" : "train number"} (${journey.code}).
5. Your arrival point is ${journey.to} ${journey.type === "bus" ? "Bus Terminal" : "Railway Station"}.`;
}
