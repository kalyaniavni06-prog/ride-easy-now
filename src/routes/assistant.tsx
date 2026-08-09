import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";

import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import type { JourneyContext } from "@/lib/ai-assistant";

const assistantSearchSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().optional(),
  type: z.enum(["bus", "train", "both"]).optional(),
  passengers: z.number().int().min(1).max(6).optional(),
  budget: z.number().optional(),
});

export const Route = createFileRoute("/assistant")({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = assistantSearchSchema.safeParse({
      ...search,
      passengers: search["passengers"] ? Number(search["passengers"]) : undefined,
      budget: search["budget"] ? Number(search["budget"]) : undefined,
    });
    return parsed.success ? parsed.data : {};
  },
  head: () => ({
    meta: [
      { title: "AI Travel Assistant — TransitEase" },
      {
        name: "description",
        content:
          "Plan journeys, compare train and bus options, find the best fare and get travel help from your AI assistant.",
      },
      { property: "og:title", content: "AI Travel Assistant — TransitEase" },
      {
        property: "og:description",
        content: "Ask anything about your journey. Powered by TransitEase + OpenAI.",
      },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  const search = useSearch({ from: "/assistant" });

  const initialContext: JourneyContext = {
    from: search.from,
    to: search.to,
    date: search.date,
    type: search.type,
    passengers: search.passengers,
    budget: search.budget,
  };

  return <AssistantPanel initialContext={initialContext} />;
}
