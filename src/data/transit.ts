// Demo data layer. Everything here is intentionally isolated so it can be
// swapped for Supabase queries later without touching UI components.

export type TransportType = "bus" | "train";

export interface Stop {
  name: string;
  time: string; // HH:mm
  day: number; // 0 = departure day
}

export interface Journey {
  id: string;
  type: TransportType;
  operator: string;
  code: string;
  from: string;
  to: string;
  departure: string; // HH:mm
  arrival: string; // HH:mm
  durationMins: number;
  fare: number;
  seatsTotal: number;
  seatsAvailable: number;
  ac: boolean;
  direct: boolean;
  amenities: string[];
  stops: Stop[];
  rating: number;
}

export const CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Kochi",
  "Nagpur",
  "Indore",
  "Goa",
];

export const POPULAR_ROUTES = [
  { from: "Mumbai", to: "Pune", type: "bus" as TransportType, fromFare: 349, duration: "3h 30m" },
  { from: "Delhi", to: "Jaipur", type: "train" as TransportType, fromFare: 505, duration: "4h 45m" },
  { from: "Bengaluru", to: "Chennai", type: "bus" as TransportType, fromFare: 699, duration: "6h 15m" },
  { from: "Hyderabad", to: "Bengaluru", type: "train" as TransportType, fromFare: 815, duration: "10h 20m" },
  { from: "Mumbai", to: "Goa", type: "bus" as TransportType, fromFare: 1199, duration: "11h 05m" },
  { from: "Kolkata", to: "Lucknow", type: "train" as TransportType, fromFare: 940, duration: "16h 40m" },
];

const BUS_OPERATORS = [
  "Sharma Travels",
  "GreenLine Express",
  "VRL Coaches",
  "Neeta Tours",
  "Orange Roadways",
  "SRS Travels",
];

const TRAIN_NAMES = [
  ["Vande Bharat Express", "22119"],
  ["Shatabdi Express", "12009"],
  ["Duronto Express", "12283"],
  ["Rajdhani Express", "12951"],
  ["Garib Rath", "12203"],
  ["Intercity Express", "12127"],
];

const BUS_AMENITIES = ["Water Bottle", "Charging Point", "Blanket", "Live Tracking", "Reading Light"];
const TRAIN_AMENITIES = ["Pantry Car", "Bedroll", "Charging Point", "Wi-Fi", "Catering"];

// Deterministic pseudo-random so the same search always yields the same results.
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return { time: `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`, day: Math.floor(total / 1440) };
}

export function formatDuration(mins: number) {
  return `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;
}

export function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function baseDistance(from: string, to: string) {
  const d = hash(`${from}|${to}`) % 900;
  return 180 + d;
}

function buildStops(from: string, to: string, dep: string, durationMins: number, count: number, r: () => number) {
  const stops: Stop[] = [{ name: from, time: dep, day: 0 }];
  const midCities = CITIES.filter((c) => c !== from && c !== to);
  for (let i = 1; i <= count; i++) {
    const offset = Math.round((durationMins * i) / (count + 1) + r() * 12);
    const t = addMinutes(dep, offset);
    stops.push({ name: midCities[Math.floor(r() * midCities.length)], time: t.time, day: t.day });
  }
  const end = addMinutes(dep, durationMins);
  stops.push({ name: to, time: end.time, day: end.day });
  return stops;
}

export function searchJourneys(from: string, to: string, date: string, type: "bus" | "train" | "both"): Journey[] {
  if (!from || !to || from === to) return [];
  const seed = hash(`${from}>${to}>${date}`);
  const r = rng(seed);
  const distance = baseDistance(from, to);
  const journeys: Journey[] = [];

  const makeBus = (i: number): Journey => {
    const depH = (5 + i * 3 + Math.floor(r() * 2)) % 24;
    const dep = `${pad(depH)}:${pad(Math.floor(r() * 4) * 15)}`;
    const durationMins = Math.round((distance / (48 + r() * 14)) * 60);
    const arr = addMinutes(dep, durationMins);
    const ac = r() > 0.35;
    const fare = Math.round(((distance * (ac ? 1.9 : 1.25) + 120) / 10) * 10);
    const total = 40;
    const available = Math.max(0, Math.round(r() * 32) + 2);
    const direct = r() > 0.35;
    return {
      id: `B-${seed}-${i}`,
      type: "bus",
      operator: BUS_OPERATORS[Math.floor(r() * BUS_OPERATORS.length)],
      code: `${ac ? "AC Sleeper" : "Non-AC Seater"} (2+1)`,
      from,
      to,
      departure: dep,
      arrival: arr.time,
      durationMins,
      fare,
      seatsTotal: total,
      seatsAvailable: available,
      ac,
      direct,
      amenities: BUS_AMENITIES.filter(() => r() > 0.4),
      stops: buildStops(from, to, dep, durationMins, direct ? 1 : 3, r),
      rating: Math.round((3.6 + r() * 1.3) * 10) / 10,
    };
  };

  const makeTrain = (i: number): Journey => {
    const [name, code] = TRAIN_NAMES[i % TRAIN_NAMES.length];
    const depH = (6 + i * 4 + Math.floor(r() * 2)) % 24;
    const dep = `${pad(depH)}:${pad(Math.floor(r() * 6) * 10)}`;
    const durationMins = Math.round((distance / (62 + r() * 20)) * 60);
    const arr = addMinutes(dep, durationMins);
    const fare = Math.round(((distance * 1.55 + 180) / 5) * 5);
    const available = Math.max(0, Math.round(r() * 60));
    const direct = r() > 0.25;
    return {
      id: `T-${seed}-${i}`,
      type: "train",
      operator: name,
      code,
      from,
      to,
      departure: dep,
      arrival: arr.time,
      durationMins,
      fare,
      seatsTotal: 72,
      seatsAvailable: available,
      ac: true,
      direct,
      amenities: TRAIN_AMENITIES.filter(() => r() > 0.4),
      stops: buildStops(from, to, dep, durationMins, direct ? 2 : 4, r),
      rating: Math.round((3.9 + r() * 1.0) * 10) / 10,
    };
  };

  if (type === "bus" || type === "both") for (let i = 0; i < 6; i++) journeys.push(makeBus(i));
  if (type === "train" || type === "both") for (let i = 0; i < 5; i++) journeys.push(makeTrain(i));

  return journeys.sort((a, b) => a.departure.localeCompare(b.departure));
}

export function getJourneyById(id: string, from: string, to: string, date: string): Journey | undefined {
  return searchJourneys(from, to, date, "both").find((j) => j.id === id);
}

/** Deterministic unavailable seats for a journey. */
export function unavailableSeats(journey: Journey, seatIds: string[]): Set<string> {
  const r = rng(hash(journey.id));
  const blocked = new Set<string>();
  const targetBlocked = Math.max(0, seatIds.length - journey.seatsAvailable);
  let guard = 0;
  while (blocked.size < targetBlocked && guard < 5000) {
    blocked.add(seatIds[Math.floor(r() * seatIds.length)]);
    guard++;
  }
  return blocked;
}

export function seatLayout(journey: Journey) {
  // Buses: 2+1 layout. Trains: 3+3 layout.
  const rows = journey.type === "bus" ? 10 : 12;
  const left = journey.type === "bus" ? 2 : 3;
  const right = journey.type === "bus" ? 1 : 3;
  const seats: { id: string; row: number; side: "left" | "right" }[] = [];
  for (let row = 1; row <= rows; row++) {
    for (let i = 0; i < left; i++) seats.push({ id: `${row}${String.fromCharCode(65 + i)}`, row, side: "left" });
    for (let i = 0; i < right; i++)
      seats.push({ id: `${row}${String.fromCharCode(65 + left + i)}`, row, side: "right" });
  }
  return { rows, left, right, seats };
}

export interface PassPlan {
  id: string;
  name: string;
  days: number;
  price: number;
  coverage: string;
  perks: string[];
}

export const PASS_PLANS: PassPlan[] = [
  {
    id: "daily",
    name: "Daily Pass",
    days: 1,
    price: 99,
    coverage: "Unlimited city buses + local trains for one day",
    perks: ["Unlimited rides for 24h", "Works across all city zones", "Instant digital activation"],
  },
  {
    id: "weekly",
    name: "Weekly Pass",
    days: 7,
    price: 549,
    coverage: "Unlimited city + suburban travel for 7 days",
    perks: ["7 days unlimited travel", "10% off intercity bookings", "Priority boarding lane"],
  },
  {
    id: "monthly",
    name: "Monthly Pass",
    days: 30,
    price: 1799,
    coverage: "All city, suburban and select intercity routes for 30 days",
    perks: ["30 days unlimited travel", "15% off intercity bookings", "Free seat upgrades (subject to availability)"],
  },
];
