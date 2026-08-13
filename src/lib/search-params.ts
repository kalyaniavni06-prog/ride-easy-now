import { z } from "zod";

export const journeySearchSchema = z.object({
  from: z.string().default(""),
  to: z.string().default(""),
  date: z.string().default(""),
  type: z.enum(["bus", "train", "both"]).default("both"),
  passengers: z.number().int().min(1).max(6).default(1),
});

export type JourneySearch = z.infer<typeof journeySearchSchema>;

/** Safe default search params for links that point at /search without a query. */
export const defaultJourneySearch: JourneySearch = journeySearchSchema.parse({});

export const bookingSearchSchema = journeySearchSchema.extend({
  seats: z.string().default(""),
});

export type BookingSearch = z.infer<typeof bookingSearchSchema>;

function coerce(search: Record<string, unknown>) {
  return { ...search, passengers: search["passengers"] ? Number(search["passengers"]) : undefined };
}

export const validateJourneySearch = (search: Record<string, unknown>): JourneySearch => {
  const parsed = journeySearchSchema.safeParse(coerce(search));
  return parsed.success ? parsed.data : journeySearchSchema.parse({});
};

export const validateBookingSearch = (search: Record<string, unknown>): BookingSearch => {
  const parsed = bookingSearchSchema.safeParse(coerce(search));
  return parsed.success ? parsed.data : bookingSearchSchema.parse({});
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

export function fareBreakdown(baseFarePerSeat: number, seats: number) {
  const baseFare = baseFarePerSeat * seats;
  const taxes = Math.round(baseFare * 0.05);
  const convenience = 25 * seats;
  return { baseFare, taxes, convenience, total: baseFare + taxes + convenience };
}
