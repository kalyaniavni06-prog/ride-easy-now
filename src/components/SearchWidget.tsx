import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftRight, CalendarDays, MapPin, Search, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITIES } from "@/data/transit";
import { isPastDate, todayISO, type JourneySearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "bus", label: "Bus" },
  { value: "train", label: "Train" },
  { value: "both", label: "Both" },
] as const;

export function SearchWidget({ initial, compact = false }: { initial?: Partial<JourneySearch>; compact?: boolean }) {
  const navigate = useNavigate();
  const [from, setFrom] = useState(initial?.from ?? "Mumbai");
  const [to, setTo] = useState(initial?.to ?? "Pune");
  const [date, setDate] = useState(initial?.date || todayISO());
  const [type, setType] = useState<JourneySearch["type"]>(initial?.type ?? "both");
  const [passengers, setPassengers] = useState(initial?.passengers ?? 1);
  const [error, setError] = useState<string | null>(null);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) {
      setError("Please choose both a departure and a destination city.");
      return;
    }
    if (from === to) {
      setError("Your origin and destination are the same. Pick two different cities.");
      return;
    }
    if (!date) {
      setError("Please pick a travel date.");
      return;
    }
    if (isPastDate(date)) {
      setError("That date has already passed. Choose today or a future date.");
      return;
    }
    setError(null);
    void navigate({ to: "/search", search: { from, to, date, type, passengers } });
  };

  return (
    <form
      onSubmit={submit}
      className={cn("surface-panel p-4 sm:p-5", compact ? "shadow-none" : "shadow-[var(--shadow-lift)]")}
      aria-label="Journey search"
    >
      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-3">
          <Label htmlFor="from" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            From
          </Label>
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger id="from" className="w-full">
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

        <div className="flex items-end justify-center md:col-span-1">
          <Button type="button" variant="outline" size="icon" onClick={swap} aria-label="Swap cities">
            <ArrowLeftRight className="size-4" />
          </Button>
        </div>

        <div className="md:col-span-3">
          <Label htmlFor="to" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            To
          </Label>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger id="to" className="w-full">
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

        <div className="md:col-span-3">
          <Label htmlFor="date" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
              className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-xs outline-none focus-visible:border-ring"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <Label
            htmlFor="passengers"
            className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Passengers
          </Label>
          <Select value={String(passengers)} onValueChange={(v) => setPassengers(Number(v))}>
            <SelectTrigger id="passengers" className="w-full">
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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="radiogroup"
          aria-label="Transport type"
          className="inline-flex rounded-lg border border-border bg-surface p-1"
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
                type === t.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button type="submit" size="lg" className="gap-2 sm:w-auto">
          <Search className="size-4" aria-hidden /> Search journeys
        </Button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
