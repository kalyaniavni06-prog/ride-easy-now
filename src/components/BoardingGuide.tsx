/**
 * BoardingGuide — polished boarding timeline with simulated status indicator.
 * Uses journey data only. Clearly labelled as simulated.
 */
import { CheckCircle2, Clock, MapPin, Navigation, Train } from "lucide-react";
import type { Journey } from "@/data/transit";
import { cn } from "@/lib/utils";

interface BoardingGuideProps {
  journey: Journey;
  date: string;
}

function pad2(n: number) { return String(n).padStart(2, "0"); }

function getArrivalTime(dep: string): string {
  const [h, m] = dep.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) - 20;
  const hh = Math.floor(((total % 1440) + 1440) % 1440 / 60);
  const mm = ((total % 60) + 60) % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

type BoardingStatus = "on-time" | "boarding" | "approaching";

function getDemoStatus(journey: Journey, date: string): BoardingStatus {
  let h = 0;
  const key = `${journey.id}-${date}-boarding`;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) & 0xffffffff;
  const statuses: BoardingStatus[] = ["on-time", "boarding", "approaching"];
  return statuses[Math.abs(h) % 3] ?? "on-time";
}

const STATUS_CFG = {
  "on-time":    { label: "You're on time",          colour: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/25" },
  "boarding":   { label: "Boarding soon",            colour: "text-primary",    bg: "bg-primary/10 border-primary/25" },
  "approaching":{ label: "Departure approaching",   colour: "text-amber-400",  bg: "bg-amber-400/10 border-amber-400/25" },
};

export function BoardingGuide({ journey, date }: BoardingGuideProps) {
  const isBus = journey.type === "bus";
  const arrivalTime = getArrivalTime(journey.departure);
  const status = getDemoStatus(journey, date);
  const cfg = STATUS_CFG[status];

  const steps = [
    {
      icon: MapPin,
      label: "Boarding point",
      detail: `${journey.from} ${isBus ? "Central Bus Stand" : "Junction"}`,
      time: null,
      done: true,
    },
    {
      icon: Clock,
      label: "Recommended arrival",
      detail: `Be here by ${arrivalTime}`,
      time: arrivalTime,
      done: false,
    },
    {
      icon: Navigation,
      label: isBus ? "Find your bay" : "Find your platform",
      detail: isBus ? "Check bay number on display board inside terminal" : "Check platform on departure board",
      time: null,
      done: false,
    },
    {
      icon: CheckCircle2,
      label: "Departure",
      detail: `${journey.operator} departs at ${journey.departure}`,
      time: journey.departure,
      done: false,
    },
    {
      icon: Train,
      label: "Arrival",
      detail: `${journey.to} ${isBus ? "Bus Terminal" : "Junction"} at ${journey.arrival}`,
      time: journey.arrival,
      done: false,
    },
  ];

  return (
    <section className="surface-panel p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          📍 Boarding Guide
        </h2>
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", cfg.bg, cfg.colour)}>
          {cfg.label}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">Simulated status · Always verify at the station</p>

      <ol className="mt-5 space-y-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <li key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border",
                  step.done
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                    : "border-primary/25 bg-primary/8 text-primary",
                )}>
                  <step.icon className="size-4" aria-hidden />
                </span>
                {!isLast && <span className="mt-1 w-px flex-1 border-l-2 border-dashed border-white/10 pb-1" />}
              </div>
              <div className={cn("pb-5 min-w-0", isLast && "pb-0")}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{step.label}</p>
                  {step.time && (
                    <span className="rounded bg-white/8 px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                      {step.time}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
