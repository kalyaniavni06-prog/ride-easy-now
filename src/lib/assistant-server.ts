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
  const note = "⚠️ *Demo mode — OPENAI_API_KEY not configured. Connect your OpenAI key in Vercel to enable live AI.*\n\n";

  if (q.includes("delay") || q.includes("late")) {
    return `${note}**If your journey is delayed:**\n\n1. Stay at the boarding point and check the official display board.\n2. For trains: use the NTES app or ask at the enquiry counter.\n3. For buses: call the operator helpline on your ticket.\n4. Keep your booking reference (PNR) ready.\n5. If delayed by more than 2 hours, ask staff about refund/rescheduling options.\n\n⚠️ I don't have live delay data. Always verify with the official operator.`;
  }
  if (q.includes("carry") || q.includes("checklist") || q.includes("pack")) {
    return `${note}**Travel checklist:**\n\n✅ Photo ID (Aadhaar/Passport/Driving Licence)\n✅ Booking confirmation / PNR\n✅ Water and snacks for long journeys\n✅ Phone charger / power bank\n✅ Arrive 15–20 minutes before departure\n✅ Verify platform/bay number at the station\n✅ Emergency contacts saved on your phone`;
  }
  return `${note}Hello! I'm your TransitEase AI Travel Assistant.\n\nI can help you:\n• **Plan a journey** — tell me where you want to go\n• **Compare train vs bus** options\n• **Find cheapest or fastest** route\n• **Travel checklist** for your trip\n• **What to do if delayed**\n\n${journeyContext ? `\nHere's what I found for your route:\n\n${journeyContext}` : ""}\n\nTry: *"Which is cheaper, train or bus?"* or *"What should I carry?"*`;
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
