/**
 * TripComparison — side-by-side comparison of up to 3 journeys.
 * Uses the top results from the current search.
 */
import { Link } from "@tanstack/react-router";
import { Bus, Check, Clock, Star, TrainFront, Users } from "lucide-react";

import type { Journey } from "@/data/transit";
import { Button } from "@/components/ui/button";
import { formatDuration, formatINR, searchJourneys } from "@/data/transit";
import type { JourneySearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface TripComparisonProps {
  search: JourneySearch;
}

export function TripComparison({ search }: TripComparisonProps) {
  const all = searchJourneys(search.from, search.to, search.date, search.type);
  if (all.length < 2) return null;

  // Pick best 3: cheapest, fastest, highest-rated (deduplicated)
  const byFare = [...all].sort((a, b) => a.fare - b.fare);
  const byDur  = [...all].sort((a, b) => a.durationMins - b.durationMins);
  const byRating = [...all].sort((a, b) => b.rating - a.rating);

  const seen = new Set<string>();
  const picks: Journey[] = [];
  for (const j of [byFare[0], byDur[0], byRating[0]]) {
    if (j && !seen.has(j.id) && picks.length < 3) {
      seen.add(j.id);
      picks.push(j);
    }
  }

  // Determine which pick wins each category
  const cheapestId = picks.reduce((a, b) => (a.fare <= b.fare ? a : b)).id;
  const fastestId  = picks.reduce((a, b) => (a.durationMins <= b.durationMins ? a : b)).id;
  const bestRatedId = picks.reduce((a, b) => (a.rating >= b.rating ? a : b)).id;

  const rows: { label: string; getValue: (j: typeof picks[0]) => string; winId?: string }[] = [
    { label: "Fare / seat",   getValue: (j) => formatINR(j.fare),               winId: cheapestId },
    { label: "Duration",      getValue: (j) => formatDuration(j.durationMins),  winId: fastestId  },
    { label: "Departure",     getValue: (j) => j.departure                                          },
    { label: "Arrival",       getValue: (j) => j.arrival                                            },
    { label: "Seats left",    getValue: (j) => j.seatsAvailable === 0 ? "Sold out" : `${j.seatsAvailable}` },
    { label: "Rating",        getValue: (j) => `${j.rating}★`,                  winId: bestRatedId },
    { label: "Type",          getValue: (j) => j.type === "bus" ? "Bus" : "Train"                   },
    { label: "Direct",        getValue: (j) => j.direct ? "Yes" : "No"                              },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold">Trip Comparison</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Comparing top {picks.length} options for your route
        </p>
      </div>

      <div className="surface-panel overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground w-28">
                Option
              </th>
              {picks.map((j, i) => {
                const isBus = j.type === "bus";
                const Icon = isBus ? Bus : TrainFront;
                const isCheapest = j.id === cheapestId;
                return (
                  <th key={j.id} className={cn("px-4 py-3 text-left", i === 0 && "bg-primary/5")}>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "flex size-6 items-center justify-center rounded-full text-[11px] font-bold",
                        isBus ? "bg-cyan-400/15 text-cyan-300" : "bg-indigo-400/15 text-indigo-300",
                      )}>
                        <Icon className="size-3" />
                      </span>
                      <span className="font-semibold text-foreground truncate max-w-[100px]">{j.operator}</span>
                    </div>
                    {isCheapest && (
                      <span className="mt-1 inline-flex items-center gap-0.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                        <Check className="size-2.5" /> Cheapest
                      </span>
                    )}
                    {j.id === fastestId && j.id !== cheapestId && (
                      <span className="mt-1 inline-flex items-center gap-0.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                        <Check className="size-2.5" /> Fastest
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-white/6 last:border-0">
                <td className="px-4 py-2.5 text-xs text-muted-foreground font-medium">{row.label}</td>
                {picks.map((j, i) => {
                  const isWinner = row.winId === j.id;
                  return (
                    <td key={j.id} className={cn("px-4 py-2.5", i === 0 && "bg-primary/3")}>
                      <span className={cn(
                        "text-sm",
                        isWinner ? "font-bold text-primary" : "text-foreground",
                      )}>
                        {row.getValue(j)}
                        {isWinner && <span className="ml-1 text-[10px] text-primary/70">✓</span>}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* CTA row */}
            <tr>
              <td className="px-4 py-3 text-xs text-muted-foreground">Book</td>
              {picks.map((j, i) => {
                const linkSearch = { ...search, from: j.from, to: j.to };
                return (
                  <td key={j.id} className={cn("px-4 py-3", i === 0 && "bg-primary/3")}>
                    <Button
                      asChild
                      size="sm"
                      variant={i === 0 ? "default" : "outline"}
                      className={cn("text-xs", i !== 0 && "border-white/12 bg-white/4")}
                      disabled={j.seatsAvailable === 0}
                    >
                      <Link to="/seats/$journeyId" params={{ journeyId: j.id }} search={linkSearch}>
                        <Users className="mr-1 size-3" /> Select
                      </Link>
                    </Button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
