import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarX2, MapPinOff, SearchX, SlidersHorizontal, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { JourneyCard } from "@/components/JourneyCard";
import { SearchWidget } from "@/components/SearchWidget";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatINR, searchJourneys } from "@/data/transit";
import { formatLongDate, isPastDate, validateJourneySearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
  validateSearch: validateJourneySearch,
  head: () => ({
    meta: [
      { title: "Search buses & trains — TransitEase" },
      { name: "description", content: "Compare bus and train options by price, duration and departure time." },
      { property: "og:title", content: "Search buses & trains — TransitEase" },
      { property: "og:description", content: "Filter and sort live demo schedules across major Indian cities." },
    ],
  }),
  component: SearchResults,
});

type SortKey = "cheapest" | "fastest" | "earliest";

const TIME_BUCKETS = [
  { id: "morning", label: "Before 12:00", test: (t: string) => t < "12:00" },
  { id: "afternoon", label: "12:00 – 17:00", test: (t: string) => t >= "12:00" && t < "17:00" },
  { id: "evening", label: "17:00 – 21:00", test: (t: string) => t >= "17:00" && t < "21:00" },
  { id: "night", label: "After 21:00", test: (t: string) => t >= "21:00" },
];

function SearchResults() {
  const search = Route.useSearch();
  const { from, to, date, type, passengers } = search;

  const [sort, setSort] = useState<SortKey>("cheapest");
  const [types, setTypes] = useState<string[]>([]);
  const [depBuckets, setDepBuckets] = useState<string[]>([]);
  const [arrBuckets, setArrBuckets] = useState<string[]>([]);
  const [acOnly, setAcOnly] = useState(false);
  const [directOnly, setDirectOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const all = useMemo(() => searchJourneys(from, to, date, type), [from, to, date, type]);
  const priceCeiling = useMemo(() => (all.length ? Math.max(...all.map((j) => j.fare)) : 3000), [all]);
  const priceLimit = maxPrice ?? priceCeiling;

  const results = useMemo(() => {
    const filtered = all.filter((j) => {
      if (types.length && !types.includes(j.type)) return false;
      if (depBuckets.length && !TIME_BUCKETS.filter((b) => depBuckets.includes(b.id)).some((b) => b.test(j.departure)))
        return false;
      if (arrBuckets.length && !TIME_BUCKETS.filter((b) => arrBuckets.includes(b.id)).some((b) => b.test(j.arrival)))
        return false;
      if (acOnly && !j.ac) return false;
      if (directOnly && !j.direct) return false;
      if (availableOnly && j.seatsAvailable < passengers) return false;
      if (j.fare > priceLimit) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "cheapest") return a.fare - b.fare;
      if (sort === "fastest") return a.durationMins - b.durationMins;
      return a.departure.localeCompare(b.departure);
    });
  }, [all, types, depBuckets, arrBuckets, acOnly, directOnly, availableOnly, priceLimit, sort, passengers]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const resetFilters = () => {
    setTypes([]);
    setDepBuckets([]);
    setArrBuckets([]);
    setAcOnly(false);
    setDirectOnly(false);
    setAvailableOnly(true);
    setMaxPrice(null);
  };

  const invalidRoute = !from || !to || from === to;
  const invalidDate = !date || isPastDate(date);

  const filters = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground">
          Reset all
        </Button>
      </div>

      <FilterGroup label="Transport type">
        {[
          { id: "bus", label: "Bus" },
          { id: "train", label: "Train" },
        ].map((opt) => (
          <CheckRow
            key={opt.id}
            id={`type-${opt.id}`}
            label={opt.label}
            checked={types.includes(opt.id)}
            onChange={() => toggle(types, setTypes, opt.id)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Departure time">
        {TIME_BUCKETS.map((b) => (
          <CheckRow
            key={b.id}
            id={`dep-${b.id}`}
            label={b.label}
            checked={depBuckets.includes(b.id)}
            onChange={() => toggle(depBuckets, setDepBuckets, b.id)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Arrival time">
        {TIME_BUCKETS.map((b) => (
          <CheckRow
            key={b.id}
            id={`arr-${b.id}`}
            label={b.label}
            checked={arrBuckets.includes(b.id)}
            onChange={() => toggle(arrBuckets, setArrBuckets, b.id)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={`Max fare — ${formatINR(priceLimit)}`}>
        <Slider
          value={[priceLimit]}
          min={100}
          max={priceCeiling}
          step={50}
          onValueChange={(v) => setMaxPrice(v[0] ?? priceCeiling)}
          aria-label="Maximum fare"
          className="mt-2"
        />
      </FilterGroup>

      <FilterGroup label="Preferences">
        <CheckRow id="ac" label="AC buses only" checked={acOnly} onChange={() => setAcOnly(!acOnly)} />
        <CheckRow id="direct" label="Direct journeys" checked={directOnly} onChange={() => setDirectOnly(!directOnly)} />
        <CheckRow
          id="avail"
          label={`Seats for ${passengers}`}
          checked={availableOnly}
          onChange={() => setAvailableOnly(!availableOnly)}
        />
      </FilterGroup>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SearchWidget initial={search} compact />

      {invalidRoute ? (
        <div className="mt-8">
          <EmptyState
            icon={MapPinOff}
            title="That route doesn't look right"
            description="Pick two different cities to see available buses and trains."
            tone="danger"
          />
        </div>
      ) : invalidDate ? (
        <div className="mt-8">
          <EmptyState
            icon={CalendarX2}
            title="Choose a valid travel date"
            description="You can only search for journeys departing today or later. Update the date above and search again."
            tone="danger"
          />
        </div>
      ) : (
        <>
          {/* Results header */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">
                {from}{" "}
                <span className="text-primary">→</span>{" "}
                {to}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatLongDate(date)} · {results.length} of {all.length} options ·{" "}
                {passengers === 1 ? "1 passenger" : `${passengers} passengers`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile filter sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden border-white/12 bg-white/4"
                  >
                    <SlidersHorizontal className="mr-2 size-4" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto border-r border-white/8 bg-card">
                  <SheetTitle className="px-4 pt-5 text-base">Filters</SheetTitle>
                  <div className="p-4">{filters}</div>
                </SheetContent>
              </Sheet>

              {/* Sort pills */}
              <div className="inline-flex rounded-lg border border-white/10 bg-white/4 p-1">
                {(
                  [
                    { id: "cheapest", label: "Cheapest" },
                    { id: "fastest", label: "Fastest" },
                    { id: "earliest", label: "Earliest" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={sort === option.id}
                    onClick={() => setSort(option.id)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      sort === option.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Layout: sidebar + results */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="surface-panel hidden h-fit p-5 lg:block">{filters}</aside>

            <div className="space-y-4">
              {all.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="No services on this route yet"
                  description="We couldn't find buses or trains between these cities for the selected date. Try a nearby city or another date."
                  action={{ label: "Back to home", to: "/" }}
                />
              ) : results.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="No results match your filters"
                  description="Your filters are a little too tight. Loosen them to see more buses and trains."
                  secondary={
                    <Button variant="outline" onClick={resetFilters} className="border-white/12 bg-white/4">
                      Reset filters
                    </Button>
                  }
                />
              ) : (
                results.map((journey) => <JourneyCard key={journey.id} journey={journey} search={search} />)
              )}
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Demo schedules only.{" "}
            <Link to="/pass" className="text-primary underline underline-offset-2 hover:no-underline">
              Frequent traveller? Get a pass
            </Link>
            .
          </p>

          {/* AI Assistant deep link */}
          <div className="mt-4 flex justify-center">
            <Link
              to="/assistant"
              search={{ from, to, date, type, passengers }}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-all hover:border-primary/50 hover:bg-primary/15"
            >
              <Sparkles className="size-4" aria-hidden />
              Ask AI — compare options, get recommendations
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function CheckRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-sm font-normal text-muted-foreground cursor-pointer">
        {label}
      </Label>
    </div>
  );
}
