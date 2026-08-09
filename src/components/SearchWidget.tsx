import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftRight, CalendarDays, Clock, MapPin, Search, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITIES } from "@/data/transit";
import { isPastDate, todayISO, type JourneySearch } from "@/lib/search-params";
import { recentSearches, type RecentSearch } from "@/lib/storage";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "bus", label: "Bus" },
  { value: "train", label: "Train" },
  { value: "both", label: "Both" },
] as const;

export function SearchWidget({
  initial,
  compact = false,
}: {
  initial?: Partial<JourneySearch>;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const [from, setFrom] = useState(initial?.from ?? "Mumbai");
  const [to, setTo] = useState(initial?.to ?? "Pune");
  const [date, setDate] = useState(initial?.date || todayISO());
  const [type, setType] = useState<JourneySearch["type"]>(initial?.type ?? "both");
  const [passengers, setPassengers] = useState(initial?.passengers ?? 1);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setRecent(recentSearches.get());
  }, []);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const doSearch = (f: string, t: string, d: string, tp: JourneySearch["type"], p: number) => {
    setError(null);
    recentSearches.add({ from: f, to: t, date: d, type: tp, passengers: p });
    setRecent(recentSearches.get());
    void navigate({ to: "/search", search: { from: f, to: t, date: d, type: tp, passengers: p } });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) {
      setError("Please choose both a departure and destination city.");
      return;
    }
    if (from === to) {
      setError("Origin and destination are the same. Pick two different cities.");
      return;
    }
    if (!date) {
      setError("Please pick a travel date.");
      return;
    }
    if (isPastDate(date)) {
      setError("That date has passed. Choose today or a future date.");
      return;
    }
    doSearch(from, to, date, type, passengers);
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={submit}
        className={cn("surface-panel p-4 sm:p-5", compact ? "shadow-none" : "shadow-[var(--shadow-lift)]")}
        aria-label="Journey search"
      >
        <div className="grid gap-4 md:grid-cols-12">
          {/* From */}
          <div className="md:col-span-3">
            <Label
              htmlFor="from"
              className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              From
            </Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger
                id="from"
                className="w-full border-white/12 bg-white/4 hover:border-white/20 focus:border-primary"
              >
                <MapPin className="size-4 text-muted-foreground" aria-hidden />
                <SelectValue placeholder="Departure city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Swap */}
          <div className="flex items-end justify-center md:col-span-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={swap}
              aria-label="Swap cities"
              className="border-white/12 bg-white/4 hover:bg-primary/15 hover:border-primary/30 hover:text-primary"
            >
              <ArrowLeftRight className="size-4" />
            </Button>
          </div>

          {/* To */}
          <div className="md:col-span-3">
            <Label
              htmlFor="to"
              className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              To
            </Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger
                id="to"
                className="w-full border-white/12 bg-white/4 hover:border-white/20 focus:border-primary"
              >
                <MapPin className="size-4 text-muted-foreground" aria-hidden />
                <SelectValue placeholder="Destination city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="md:col-span-3">
            <Label
              htmlFor="date"
              className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Travel date
            </Label>
            <div className="relative">
              <CalendarDays
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="date"
                type="date"
                value={date}
                min={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className={cn(
                  "h-9 w-full rounded-md border pl-9 pr-3 text-sm",
                  "border-white/12 bg-white/4 text-foreground",
                  "[color-scheme:dark]",
                  "hover:border-white/20 focus:border-primary focus:outline-none transition-colors",
                )}
              />
            </div>
          </div>

          {/* Passengers */}
          <div className="md:col-span-2">
            <Label
              htmlFor="passengers"
              className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Passengers
            </Label>
            <Select
              value={String(passengers)}
              onValueChange={(v) => setPassengers(Number(v))}
            >
              <SelectTrigger
                id="passengers"
                className="w-full border-white/12 bg-white/4 hover:border-white/20 focus:border-primary"
              >
                <Users className="size-4 text-muted-foreground" aria-hidden />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? "passenger" : "passengers"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="radiogroup"
            aria-label="Transport type"
            className="inline-flex rounded-lg border border-white/10 bg-white/4 p-1"
          >
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={type === t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  type === t.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Button type="submit" size="lg" className="gap-2 shadow-sm sm:w-auto">
            <Search className="size-4" aria-hidden />
            Search journeys
          </Button>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
      </form>

      {/* Recent searches */}
      {!compact && recent.length > 0 && (
        <div className="surface-panel p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Clock className="size-3.5" aria-hidden />
              Recent searches
            </p>
            <button
              type="button"
              onClick={() => {
                recentSearches.clear();
                setRecent([]);
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Clear recent searches"
            >
              <Trash2 className="size-3" />
              Clear
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recent.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => doSearch(r.from, r.to, todayISO(), r.type, r.passengers)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
              >
                {r.from} → {r.to}
                <span className="text-muted-foreground/60">·</span>
                <span className="capitalize">{r.type}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
