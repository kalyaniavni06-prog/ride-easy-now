/**
 * Server-side AI assistant function.
 *
 * Uses TanStack Start's createServerFn so it only ever runs on the server.
 * The OPENAI_API_KEY environment variable is read server-side and NEVER
 * sent to the browser.
 *
 * Required server environment variable (set in Vercel dashboard):
 *   OPENAI_API_KEY — your OpenAI API key
 *
 * Falls back to demo mode when no key is configured.
 */
import { createServerFn } from "@tanstack/react-start";
import { searchJourneys, formatINR, formatDuration } from "@/data/transit";
import type { AssistantQueryInput, AssistantQueryOutput } from "@/lib/ai-assistant";

const SYSTEM_PROMPT = `You are a helpful AI Travel Assistant for TransitEase, an Indian bus and train booking platform.

Your job is to help passengers:
- Plan journeys between Indian cities
- Compare bus vs train options
- Find the cheapest, fastest, or most comfortable option
- Understand their journey step by step
- Know what to carry and what to do if delayed

RULES:
1. Only use the journey data provided to you. Do NOT invent fares, schedules, seat availability, or platform numbers.
2. When data is unavailable, say so clearly: "I don't have live information for this."
3. Be friendly, concise, and use simple language — passengers may not be tech-savvy.
4. Format responses with markdown (bold, lists) for readability.
5. Prices are in Indian Rupees (₹). Distances are between major Indian cities.
6. Never claim a booking is confirmed unless the booking system confirms it.
7. Never share one user's information with another.
8. If asked about delays or platform numbers, always note that live data is not available.`;

function buildDemoResponse(query: string, journeyContext: string): string {
  const q = query.toLowerCase();

  // Journey-context-aware responses when we have route data
  if (journeyContext) {
    if (q.includes("cheap") || q.includes("budget") || q.includes("price") || q.includes("₹")) {
      return `Here are the available options sorted by price:\n\n${journeyContext}\n\nThe **first option** above has the lowest fare. If budget is your priority, that's the one to go with.\n\n*Using demo schedule data · Add OPENAI_API_KEY for live AI*`;
    }
    if (q.includes("fast") || q.includes("quick") || q.includes("time")) {
      return `Looking at journey durations for your route:\n\n${journeyContext}\n\nPick the option with the shortest travel time listed above.\n\n*Using demo schedule data · Add OPENAI_API_KEY for live AI*`;
    }
    if (q.includes("compare") || q.includes("train") || q.includes("bus") || q.includes("vs") || q.includes("which")) {
      return `Here's what's available for your route:\n\n${journeyContext}\n\n**Quick comparison:** Trains are generally faster and more comfortable; buses are often cheaper and have more departure times. Look at the fares and durations above to decide which suits you.\n\n*Using demo schedule data · Add OPENAI_API_KEY for live AI*`;
    }
    if (q.includes("best") || q.includes("recommend") || q.includes("suggest")) {
      return `Based on your route data:\n\n${journeyContext}\n\nFor the **best overall value**, weigh the fare against the duration. The option with the highest rating (★) and a reasonable departure time is usually a safe bet.\n\n*Using demo schedule data · Add OPENAI_API_KEY for live AI*`;
    }
    if (q.includes("morning") || q.includes("early")) {
      return `Here are all options on your route — look for departures before 12:00:\n\n${journeyContext}\n\n*Using demo schedule data · Add OPENAI_API_KEY for live AI*`;
    }
  }

  // General responses without route context
  if (q.includes("delay") || q.includes("late") || q.includes("cancel")) {
    return `**If your journey is delayed:**\n\n1. Stay at the boarding point and watch the official display board.\n2. **Trains:** Check the NTES app or ask at the enquiry counter.\n3. **Buses:** Call the operator helpline shown on your ticket.\n4. Keep your PNR/booking reference ready — you may need it for a refund claim.\n5. If delayed more than 2 hours, ask staff about rescheduling options.\n\nI don't have live delay data — always verify with the official operator.\n\n*Demo response · Add OPENAI_API_KEY for live AI*`;
  }

  if (q.includes("carry") || q.includes("checklist") || q.includes("pack") || q.includes("bring")) {
    return `**Your travel checklist:**\n\n✅ Government photo ID (Aadhaar / Passport / Driving Licence)\n✅ Booking confirmation / PNR (screenshot it — saves data)\n✅ Water bottle and light snacks for longer journeys\n✅ Phone charger + power bank\n✅ Arrive 20–30 minutes before departure\n✅ Confirm your platform / bay number before boarding\n✅ Save an emergency contact on your phone\n\nFor overnight trips: add a blanket, eye mask and earplugs.\n\n*Demo response · Add OPENAI_API_KEY for live AI*`;
  }

  if (q.includes("platform") || q.includes("boarding") || q.includes("where")) {
    return `**Finding your boarding point:**\n\n🚆 **Trains:** Your platform is shown on the departure board at the station. Match your train number (e.g. 22119) on the board.\n🚌 **Buses:** The bay number is on the display inside the bus terminal, or ask at the enquiry counter.\n\nArrive early — platforms and bays can change. I don't have live platform data.\n\n*Demo response · Add OPENAI_API_KEY for live AI*`;
  }

  if (q.includes("explain") || q.includes("booking") || q.includes("ticket")) {
    return `**Understanding your booking:**\n\n• **PNR** — your unique booking reference. Keep it safe — you'll need it to board.\n• **Departure / Arrival** — times shown are at your boarding and drop points.\n• **Seat numbers** — verify before boarding that you're in the right seat.\n• **Fare paid** — includes base fare + 5% taxes + convenience fee.\n• **Status** — "Confirmed" means your seat is reserved.\n\nHave your PNR and ID ready when you board.\n\n*Demo response · Add OPENAI_API_KEY for live AI*`;
  }

  if (q.includes("plan") || q.includes("help") || q.includes("journey") || q.includes("travel")) {
    return `I'd be happy to help plan your journey! To give you the best recommendation, tell me:\n\n• Where are you travelling **from** and **to**?\n• What **date** are you travelling?\n• Do you prefer **bus, train, or both**?\n• Is **price or speed** your priority?\n\nOnce you share these, I can compare options and recommend the best one for you.\n\n*Demo response · Add OPENAI_API_KEY for live AI*`;
  }

  // Fallback welcome
  return `Hi! I'm your **TransitEase Travel Assistant**. I can help you:\n\n• **Plan a journey** — tell me your route and date\n• **Compare bus vs train** — price, duration, comfort\n• **Find cheapest / fastest** options\n• **Travel checklist** — what to carry\n• **Booking help** — understand your PNR and ticket\n• **Delay guidance** — what to do if things go wrong\n\nJust ask, or pick a quick prompt below.\n\n*Demo mode · Add OPENAI_API_KEY in Vercel for live AI responses*`;
}

export const askAssistant = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as AssistantQueryInput)
  .handler(async ({ data }): Promise<AssistantQueryOutput> => {
    const { messages, context } = data;

    // Build journey context string from available demo data
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

    // ── Try OpenAI ────────────────────────────────────────────────────────────
    const apiKey = process.env["OPENAI_API_KEY"];

    if (!apiKey) {
      const lastMsg = messages[messages.length - 1]?.content ?? "";
      return { reply: buildDemoResponse(lastMsg, journeyContext), isDemo: true };
    }

    try {
      const systemContent = journeyContext
        ? `${SYSTEM_PROMPT}\n\n--- AVAILABLE JOURNEY DATA (use this, do not invent) ---\n${journeyContext}\n---`
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
          temperature: 0.7,
          messages: [
            { role: "system", content: systemContent },
            ...messages.slice(-8), // Keep last 8 messages for context window
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI API error:", response.status, errText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = (await response.json()) as {
        choices: { message: { content: string } }[];
      };
      const reply = result.choices[0]?.message?.content ?? "I couldn't generate a response. Please try again.";
      return { reply, isDemo: false };
    } catch (err) {
      console.error("AI assistant error:", err);
      const lastMsg = messages[messages.length - 1]?.content ?? "";
      return {
        reply:
          "I'm having trouble connecting to the AI service right now. " +
          buildDemoResponse(lastMsg, journeyContext).replace("⚠️ *Demo mode — OPENAI_API_KEY not configured. Connect your OpenAI key in Vercel to enable live AI.*\n\n", ""),
        isDemo: true,
      };
    }
  });
