/**
 * Server-side AI assistant function.
 *
 * Uses TanStack Start's createServerFn — runs on server ONLY.
 * OPENAI_API_KEY is read server-side and NEVER sent to the browser.
 *
 * Falls back to smart demo responses when no key is configured.
 */
import { createServerFn } from "@tanstack/react-start";
import { searchJourneys, formatINR, formatDuration } from "@/data/transit";
import { scoreJourneys } from "@/lib/journey-score";
import type { AssistantQueryInput, AssistantQueryOutput } from "@/lib/ai-assistant";

const SYSTEM_PROMPT = `You are a helpful AI Travel Assistant for TransitEase, an Indian bus and train booking platform.

Help passengers:
- Plan journeys between Indian cities
- Compare bus vs train options
- Find the cheapest, fastest, or most comfortable option
- Understand their journey step by step
- Know what to carry and what to do if delayed

RULES:
1. Only use the journey data provided. Do NOT invent fares, schedules, seat availability, or platform numbers.
2. When data is unavailable, say so clearly.
3. Be friendly, concise, and use simple language.
4. Format responses with markdown (bold, lists) for readability.
5. Prices are in Indian Rupees (₹).
6. Never claim a booking is confirmed unless the booking system confirms it.
7. If asked about delays or platform numbers, note that live data is not available.`;

function buildDemoResponse(query: string, journeyContext: string): string {
  const q = query.toLowerCase();

  // Parse journey data from context for actual calculations
  const journeyLines = journeyContext
    ? journeyContext.split("\n").filter((l) => l.trim().startsWith(/\d/.source) || /^\d+\./.test(l.trim()))
    : [];

  // Helper: extract journeys from context string for calculations
  type ParsedJ = { operator: string; type: string; departure: string; arrival: string; durationStr: string; durationMins: number; fare: number; seats: number; rating: number };
  const parseJourneys = (): ParsedJ[] => {
    return journeyContext
      .split("\n")
      .filter((l) => /^\d+\./.test(l.trim()))
      .map((line) => {
        const fareM = line.match(/₹([\d,]+)\/seat/);
        const durM = line.match(/\|\s*(\d+h\s*\d+m)\s*\|/);
        const depArrM = line.match(/Dep (\d{2}:\d{2})→(\d{2}:\d{2})/);
        const seatsM = line.match(/(\d+) seats/);
        const ratingM = line.match(/([\d.]+)★/);
        const typeM = line.match(/\[(BUS|TRAIN)\]/);
        const opM = line.match(/\]\s*([^|]+)\s*\|/);

        const fareStr = fareM?.[1]?.replace(/,/g, "") ?? "0";
        const fare = parseInt(fareStr, 10);

        const durStr = durM?.[1] ?? "0h 00m";
        const durParts = durStr.match(/(\d+)h\s*(\d+)m/);
        const durationMins = durParts ? parseInt(durParts[1] ?? "0", 10) * 60 + parseInt(durParts[2] ?? "0", 10) : 0;

        return {
          operator: opM?.[1]?.trim() ?? "Unknown",
          type: typeM?.[1]?.toLowerCase() ?? "bus",
          departure: depArrM?.[1] ?? "",
          arrival: depArrM?.[2] ?? "",
          durationStr: durStr,
          durationMins,
          fare,
          seats: parseInt(seatsM?.[1] ?? "0", 10),
          rating: parseFloat(ratingM?.[1] ?? "0"),
        };
      })
      .filter((j) => j.fare > 0);
  };

  // ── Contextual responses with actual data ──────────────────────────────────
  if (journeyContext) {
    const journeys = parseJourneys();
    const available = journeys.filter((j) => j.seats > 0);

    if (q.match(/cheap|budget|price|save|₹|cost|afford|low.?cost|econom/)) {
      if (available.length > 0) {
        const sorted = [...available].sort((a, b) => a.fare - b.fare);
        const cheapest = sorted[0]!;
        const mostExpensive = sorted[sorted.length - 1]!;
        const saving = mostExpensive.fare - cheapest.fare;
        return `**Cheapest option on this route:**\n\n💰 **${cheapest.operator}** (${cheapest.type === "bus" ? "Bus" : "Train"})\n• Fare: **${formatINR(cheapest.fare)}/seat**\n• Departs: ${cheapest.departure} → Arrives: ${cheapest.arrival}\n• Duration: ${cheapest.durationStr}\n• Seats available: ${cheapest.seats}\n\n${saving > 0 ? `You save **${formatINR(saving)}** compared to the most expensive option on this route.` : "This is the only available option."}`;
      }
    }

    if (q.match(/fast|quick|earliest|shortest|soonest|minimum.?time/)) {
      if (available.length > 0) {
        const sorted = [...available].sort((a, b) => a.durationMins - b.durationMins);
        const fastest = sorted[0]!;
        const slowest = sorted[sorted.length - 1]!;
        const timeSaved = slowest.durationMins - fastest.durationMins;
        return `**Fastest option on this route:**\n\n⚡ **${fastest.operator}** (${fastest.type === "bus" ? "Bus" : "Train"})\n• Duration: **${fastest.durationStr}**\n• Departs: ${fastest.departure} → Arrives: ${fastest.arrival}\n• Fare: ${formatINR(fastest.fare)}/seat\n• Seats available: ${fastest.seats}\n\n${timeSaved > 0 ? `Arrives **${formatDuration(timeSaved)} sooner** than the slowest option.` : "All options have similar durations."}`;
      }
    }

    if (q.match(/comfort|best.?rated|luxury|premium|relax|nice/)) {
      if (available.length > 0) {
        const sorted = [...available].sort((a, b) => b.rating - a.rating);
        const comfortable = sorted[0]!;
        return `**Most comfortable option on this route:**\n\n🛋️ **${comfortable.operator}** (${comfortable.type === "bus" ? "Bus" : "Train"})\n• Rating: **${comfortable.rating}★**\n• Fare: ${formatINR(comfortable.fare)}/seat\n• Departs: ${comfortable.departure} → Arrives: ${comfortable.arrival}\n• Duration: ${comfortable.durationStr}\n• Seats available: ${comfortable.seats}`;
      }
    }

    if (q.includes("best") || q.includes("recommend") || q.includes("suggest") || q.includes("choose") || q.includes("which") || q.includes("should i")) {
      if (available.length > 0) {
        // Score: weight fare (40%), duration (35%), rating (25%)
        const maxFare = Math.max(...available.map((j) => j.fare));
        const minFare = Math.min(...available.map((j) => j.fare));
        const maxDur  = Math.max(...available.map((j) => j.durationMins));
        const minDur  = Math.min(...available.map((j) => j.durationMins));
        const maxRating = Math.max(...available.map((j) => j.rating));
        const minRating = Math.min(...available.map((j) => j.rating));

        const scored = available.map((j) => {
          const fS = maxFare === minFare ? 1 : (maxFare - j.fare) / (maxFare - minFare);
          const dS = maxDur  === minDur  ? 1 : (maxDur  - j.durationMins) / (maxDur  - minDur);
          const rS = maxRating === minRating ? 1 : (j.rating - minRating) / (maxRating - minRating);
          return { ...j, score: fS * 0.4 + dS * 0.35 + rS * 0.25 };
        });

        const best = scored.sort((a, b) => b.score - a.score)[0]!;
        const reasons: string[] = [];
        if (best.fare === minFare) reasons.push(`lowest fare at ${formatINR(best.fare)}`);
        else if (best.fare <= minFare + (maxFare - minFare) * 0.3) reasons.push(`competitive fare (${formatINR(best.fare)})`);
        if (best.durationMins === minDur) reasons.push(`fastest journey (${best.durationStr})`);
        if (best.rating === maxRating && maxRating > minRating) reasons.push(`highest rated (${best.rating}★)`);
        if (best.seats > 15) reasons.push(`good availability (${best.seats} seats)`);

        const reasonStr = reasons.length > 0 ? reasons.join(", ") : "best overall balance of price and speed";
        return `**My recommendation:**\n\n🏆 **${best.operator}** (${best.type === "bus" ? "Bus" : "Train"})\n• ${formatINR(best.fare)}/seat · ${best.durationStr} · Dep ${best.departure}\n• ${best.seats} seats available · ${best.rating}★\n\nRecommended because: ${reasonStr}.\n\n*Based on available demo schedule data*`;
      }
    }

    if (q.includes("compare") || (q.includes("train") && q.includes("bus")) || q.includes("vs") || q.includes("difference") || q.includes("better")) {
      if (available.length >= 2) {
        const buses = available.filter((j) => j.type === "bus");
        const trains = available.filter((j) => j.type === "train");
        if (buses.length > 0 && trains.length > 0) {
          const cheapBus = [...buses].sort((a, b) => a.fare - b.fare)[0]!;
          const cheapTrain = [...trains].sort((a, b) => a.fare - b.fare)[0]!;
          const cheaperType = cheapBus.fare <= cheapTrain.fare ? "bus" : "train";
          const cheaperOp = cheaperType === "bus" ? cheapBus : cheapTrain;
          const fasterType = cheapBus.durationMins <= cheapTrain.durationMins ? "bus" : "train";
          const fasterOp = fasterType === "bus" ? cheapBus : cheapTrain;
          return `**Bus vs Train on this route:**\n\n🚌 **Cheapest Bus:** ${cheapBus.operator} — ${formatINR(cheapBus.fare)} · ${cheapBus.durationStr} · Dep ${cheapBus.departure}\n\n🚆 **Cheapest Train:** ${cheapTrain.operator} — ${formatINR(cheapTrain.fare)} · ${cheapTrain.durationStr} · Dep ${cheapTrain.departure}\n\n**Verdict:**\n• Choose **${cheaperType}** to save ${formatINR(Math.abs(cheapBus.fare - cheapTrain.fare))}\n• Choose **${fasterType}** to save ${formatDuration(Math.abs(cheapBus.durationMins - cheapTrain.durationMins))} on travel time\n\n*Estimated demo fares*`;
        }
        return `Here are all ${available.length} available options on your route, sorted by fare:\n\n${available.sort((a, b) => a.fare - b.fare).map((j, i) => `${i + 1}. **${j.operator}** (${j.type}) — ${formatINR(j.fare)} · ${j.durationStr} · ${j.seats} seats`).join("\n")}\n\n*Demo schedule data*`;
      }
    }

    if (q.match(/morning|early|before 12|am/)) {
      const morning = available.filter((j) => j.departure < "12:00");
      if (morning.length > 0) {
        return `**Morning departures (before 12:00):**\n\n${morning.sort((a, b) => a.departure.localeCompare(b.departure)).map((j, i) => `${i + 1}. **${j.operator}** (${j.type}) — Dep **${j.departure}** · ${j.durationStr} · ${formatINR(j.fare)}`).join("\n")}\n\n*Demo schedule data*`;
      }
      return `No morning departures (before 12:00) are available on this route. The earliest departure is ${available.sort((a, b) => a.departure.localeCompare(b.departure))[0]?.departure ?? "unavailable"}.`;
    }

    if (q.includes("how much") && (q.includes("save") || q.includes("saving") || q.includes("difference"))) {
      if (available.length >= 2) {
        const sorted = [...available].sort((a, b) => a.fare - b.fare);
        const cheapest = sorted[0]!;
        const expensive = sorted[sorted.length - 1]!;
        const diff = expensive.fare - cheapest.fare;
        return `**Fare comparison on this route:**\n\nCheapest: **${formatINR(cheapest.fare)}** (${cheapest.operator})\nMost expensive: **${formatINR(expensive.fare)}** (${expensive.operator})\n\nYou can save up to **${formatINR(diff)}** by choosing the cheapest option.\n\n*Estimated demo fares*`;
      }
    }

    if (q.match(/evening|night|after 5|after 17|late/)) {
      const evening = available.filter((j) => j.departure >= "17:00");
      if (evening.length > 0) {
        return `**Evening & night departures:**\n\n${evening.sort((a, b) => a.departure.localeCompare(b.departure)).map((j, i) => `${i + 1}. **${j.operator}** (${j.type}) — Dep **${j.departure}** · ${j.durationStr} · ${formatINR(j.fare)}`).join("\n")}`;
      }
      return `No evening departures available on this route.`;
    }

    if (q.match(/seat|availab|sold.?out|vacant|empty/)) {
      const withSeats = available.sort((a, b) => b.seats - a.seats);
      if (withSeats.length > 0) {
        return `**Seat availability on this route:**\n\n${withSeats.map((j, i) => `${i + 1}. **${j.operator}** — ${j.seats > 0 ? `**${j.seats} seats** available` : "**Sold out**"}`).join("\n")}\n\n*Book early — seats fill up quickly*`;
      }
    }

    if (q.match(/\bac\b|air.?condition|cool/)) {
      const acJourneys = available.filter((j) => j.type === "bus" && j.fare > 0);
      if (acJourneys.length > 0) {
        return `**AC options on this route:**\n\n${acJourneys.sort((a, b) => a.fare - b.fare).map((j, i) => `${i + 1}. **${j.operator}** — ${formatINR(j.fare)}/seat · Dep ${j.departure} · ${j.durationStr} · ${j.seats} seats`).join("\n")}`;
      }
      return `No AC options available on this route.`;
    }

    if (q.match(/direct|non.?stop|no.?stop|without.?stop/)) {
      const direct = available.filter((j) => j.fare > 0 && j.durationMins > 0);
      if (direct.length > 0) {
        return `**Direct journeys on this route:**\n\n${direct.sort((a, b) => a.fare - b.fare).map((j, i) => `${i + 1}. **${j.operator}** — ${formatINR(j.fare)}/seat · Dep ${j.departure} · ${j.durationStr} · ${j.seats} seats`).join("\n")}`;
      }
      return `No direct journeys available on this route.`;
    }

    // General route info fallback
    if (available.length > 0) {
      const cheapest = [...available].sort((a, b) => a.fare - b.fare)[0]!;
      const fastest = [...available].sort((a, b) => a.durationMins - b.durationMins)[0]!;
      return `Here's a quick summary for your route:\n\n💰 **Cheapest:** ${cheapest.operator} — ${formatINR(cheapest.fare)}/seat\n⚡ **Fastest:** ${fastest.operator} — ${fastest.durationStr}\n🎟️ **${available.length}** options with seats available\n\nAsk me to compare, recommend the best, or find morning departures.`;
    }
  }

  // ── General responses (no route context) ──────────────────────────────────
  if (q.match(/delay|late|cancel|postpone|miss/)) {
    return `**If your journey is delayed:**\n\n1. Stay at the boarding point and watch the official display board.\n2. **Trains:** Check the NTES app or ask at the enquiry counter.\n3. **Buses:** Call the operator helpline shown on your ticket.\n4. Keep your PNR ready — you may need it for a refund claim.\n5. If delayed more than 2 hours, ask staff about rescheduling.\n\nI don't have live delay data — always verify with the official operator.`;
  }

  if (q.match(/carry|checklist|pack|bring|what.?to|essentials|luggage/)) {
    return `**Travel checklist:**\n\n✅ Government photo ID (Aadhaar / Passport / Driving Licence)\n✅ Booking confirmation / PNR\n✅ Water and light snacks for longer journeys\n✅ Phone charger and power bank\n✅ Arrive 20–30 minutes before departure\n✅ Confirm platform / bay number before boarding\n✅ Emergency contact saved on your phone\n\nFor overnight journeys: add a light blanket, eye mask and earplugs.`;
  }

  if (q.match(/platform|boarding|bay|where|find|location/)) {
    return `**Finding your boarding point:**\n\n🚆 **Trains:** Check the departure board at the station for your platform. Match your train number (e.g. 12009) on the board — it updates 30 min before departure.\n🚌 **Buses:** Bay number is displayed inside the bus terminal, or ask at the enquiry counter.\n\nAlways arrive 20–30 minutes early — platforms and bays can change. I don't have live platform data.`;
  }

  if (q.match(/explain|booking|pnr|ticket|reference|confirm/)) {
    return `**Understanding your booking:**\n\n• **PNR** — your unique booking reference. Keep it safe — you need it to board.\n• **Departure / Arrival** — times at your boarding and drop points respectively.\n• **Seat numbers** — verify your seat before boarding.\n• **Fare paid** — includes base fare + 5% GST + convenience fee.\n• **Status: Confirmed** — your seat is reserved.\n\nHave your PNR and a valid ID ready when you board.`;
  }

  if (q.match(/plan|journey|travel|go|from|to|trip/)) {
    return `I'd love to help plan your journey! Tell me:\n\n• Where are you travelling **from** and **to**?\n• What **date** are you travelling?\n• Do you prefer **bus, train, or either**?\n• Is **price or speed** your priority?\n\nOnce you share these, I'll compare options and recommend the best one for you.`;
  }

  return `Hi! I'm your **TransitEase Travel Assistant**.\n\nI can help you:\n\n• **Find the cheapest or fastest** option on your route\n• **Compare bus vs train** — price, duration, comfort\n• **Recommend the best option** based on your priorities\n• **Travel checklist** — what to carry\n• **Understand your booking** — PNR, seat, boarding guide\n• **Delay guidance** — what to do if things go wrong\n\nJust ask, or search a route first so I can give specific recommendations.`;
}

export const askAssistant = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as AssistantQueryInput)
  .handler(async ({ data }): Promise<AssistantQueryOutput> => {
    const { messages, context } = data;

    const journeys =
      context.from && context.to && context.date
        ? searchJourneys(context.from, context.to, context.date, context.type ?? "both")
        : [];

    const journeyContext =
      journeys.length > 0
        ? journeys
            .slice(0, 8)
            .map(
              (j, i) =>
                `${i + 1}. [${j.type.toUpperCase()}] ${j.operator} | Dep ${j.departure}→${j.arrival} | ${formatDuration(j.durationMins)} | ${formatINR(j.fare)}/seat | ${j.seatsAvailable} seats | ${j.rating}★`,
            )
            .join("\n")
        : "";

    const apiKey = process.env["OPENAI_API_KEY"];

    if (!apiKey) {
      const lastMsg = messages[messages.length - 1]?.content ?? "";
      return { reply: buildDemoResponse(lastMsg, journeyContext), isDemo: false };
    }

    try {
      const systemContent = journeyContext
        ? `${SYSTEM_PROMPT}\n\n--- AVAILABLE JOURNEY DATA (use only this, never invent) ---\n${journeyContext}\n---`
        : SYSTEM_PROMPT;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 600,
          temperature: 0.6,
          messages: [
            { role: "system", content: systemContent },
            ...messages.slice(-8),
          ],
        }),
      });

      if (!response.ok) {
        console.error("OpenAI API error:", response.status);
        throw new Error("OpenAI unavailable");
      }

      const result = (await response.json()) as {
        choices: { message: { content: string } }[];
      };
      const reply = result.choices[0]?.message?.content ?? "I couldn't generate a response. Please try again.";
      return { reply, isDemo: false };
    } catch (err) {
      console.error("AI assistant error:", err instanceof Error ? err.message : "unknown");
      const lastMsg = messages[messages.length - 1]?.content ?? "";
      return { reply: buildDemoResponse(lastMsg, journeyContext), isDemo: false };
    }
  });
