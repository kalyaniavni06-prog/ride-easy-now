import { z } from "zod";

export const journeySearchSchema = z.object({
  from: z.string().default(""),
  to: z.string().default(""),
  date: z.string().default(""),
  type: z.enum(["bus", "train", "both"]).default("both"),
  passengers: z.number().int().min(1).max(6).default(1),
});

export type JourneySearch = z.infer<typeof journeySearchSchema>;

export const validateJourneySearch = (search: Record<string, unknown>): JourneySearch => {
  const parsed = journeySearchSchema.safeParse({
    ...search,
    passengers: search["passengers"] ? Number(search["passengers"]) : undefined,
  });
  return parsed.success ? parsed.data : journeySearchSchema.parse({});
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function isPastDate(date: string) {
  if (!date) return false;
  return date < todayISO();
}

export function formatLongDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
