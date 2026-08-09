/**
 * SmartChoice — "Help me choose" panel.
 * Analyses visible results and surfaces a single clear recommendation.
 * Uses buildSmartChoice() which is deterministic and based only on visible data.
 */
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatINR, searchJourneys } from "@/data/transit";
import { buildSmartChoice, scoreJourneys } from "@/lib/journey-score";
import type { JourneySearch } from "@/lib/search-params";
import { cn } from "@/lib/utils";

// Inline tiny markdown renderer for the recommendation text
function SimpleMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>,
      )}
    </span>
  );
}

interface SmartChoiceProps {
  search: JourneySearch;
  /** Pass only the currently filtered/visible journeys */
  visibleCount: number;
}

export function SmartChoice({ search, visibleCount }: SmartChoiceProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const allJourneys = searchJourneys(search.from, search.to, search.date, search.type);
  const scored = scoreJourneys(allJourneys.filter((j) => j.seatsAvailable > 0));
  const best = [...scored].sort((a, b) => b.score - a.score)[0];
  const recommendation = buildSmartChoice(allJourneys);

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/6 overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/8"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="text-sm font-semibold text-primary">✨ Help me choose</span>
          <span className="text-xs text-muted-foreground">
            — analysing {visibleCount} option{visibleCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {open
            ? <ChevronUp className="size-4 text-primary" />
            : <ChevronDown className="size-4 text-primary" />
          }
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="ml-1 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </button>

      {/* Recommendation panel */}
      {open && (
        <div className="border-t border-primary/15 px-4 py-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <SimpleMarkdown text={recommendation} />
          </p>

          {/* Score breakdown of top 3 */}
          {scored.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Top options by TransitEase Score
              </p>
              {scored
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map(({ journey: j, score, isBestOverall }) => {
                  const linkSearch = { ...search, from: j.from, to: j.to };
                  return (
                    <div
                      key={j.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                        isBestOverall
                          ? "border-yellow-400/25 bg-yellow-400/6"
                          : "border-white/8 bg-white/3",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{j.operator}</p>
                        <p className="text-xs text-muted-foreground">
                          {j.departure} → {j.arrival} · {formatINR(j.fare)}/seat
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-bold tabular-nums",
                            score >= 75 ? "text-emerald-400" : score >= 50 ? "text-primary" : "text-amber-400",
                          )}>
                            {score}/100
                          </p>
                          {isBestOverall && (
                            <p className="text-[10px] font-semibold text-yellow-300">Best</p>
                          )}
                        </div>
                        <Button asChild size="sm" variant={isBestOverall ? "default" : "outline"}
                          className={cn("text-xs", !isBestOverall && "border-white/12 bg-white/4")}>
                          <Link to="/seats/$journeyId" params={{ journeyId: j.id }} search={linkSearch}>
                            Book
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            Score based on fare, duration, rating and seat availability · Demo data only
          </p>

          {/* Deep-link to AI for more nuanced help */}
          <Link
            to="/assistant"
            search={{ from: search.from, to: search.to, date: search.date, type: search.type, passengers: search.passengers }}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-2"
          >
            <Sparkles className="size-3" />
            Ask AI for a more detailed recommendation
          </Link>
        </div>
      )}
    </div>
  );
}
