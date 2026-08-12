/**
 * TravelStatus — demo travel status component.
 * Status is derived deterministically from the journey ID + current time.
 * Clearly labelled as simulated — never claims to be live data.
 */
import { AlertTriangle, CheckCircle2, Clock, Navigation, Radio } from "lucide-react";
import type { Journey } from "@/data/transit";
import { cn } from "@/lib/utils";

type StatusType = "on-time" | "boarding" | "delayed" | "departed" | "arrived";

interface TravelStatusProps {
  journey: Journey;
  date: string;
}

function getDemoStatus(journey: Journey, date: string): StatusType {
  // Use a deterministic hash of journey id + date to pick a status for demo
  let h = 0;
  const key = `${journey.id}-${date}`;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) & 0xffffffff;
  }
  const val = Math.abs(h) % 5;
  const statuses: StatusType[] = ["on-time", "boarding", "delayed", "departed", "arrived"];
  return statuses[val] ?? "on-time";
}

const STATUS_CONFIG: Record<StatusType, {
  icon: typeof Clock;
  label: string;
  colour: string;
  bg: string;
  border: string;
  description: string;
}> = {
  "on-time": {
    icon: CheckCircle2,
    label: "On Time",
    colour: "text-emerald-400",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/25",
    description: "Running as scheduled. No delays reported.",
  },
  "boarding": {
    icon: Navigation,
    label: "Boarding Soon",
    colour: "text-primary",
    bg: "bg-primary/8",
    border: "border-primary/25",
    description: "Boarding will begin shortly at your assigned bay / platform.",
  },
  "delayed": {
    icon: AlertTriangle,
    label: "Delayed",
    colour: "text-amber-400",
    bg: "bg-amber-400/8",
    border: "border-amber-400/25",
    description: "Running behind schedule. Check the display board at the station for updates.",
  },
  "departed": {
    icon: Radio,
    label: "Departed",
    colour: "text-cyan-400",
    bg: "bg-cyan-400/8",
    border: "border-cyan-400/25",
    description: "Service has departed from the origin. En route to destination.",
  },
  "arrived": {
    icon: CheckCircle2,
    label: "Arrived",
    colour: "text-emerald-400",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/25",
    description: "Service has arrived at the destination.",
  },
};

export function TravelStatus({ journey, date }: TravelStatusProps) {
  const status = getDemoStatus(journey, date);
  const cfg = STATUS_CONFIG[status];

  return (
    <div className={cn("flex items-center gap-4 rounded-xl border p-4", cfg.border, cfg.bg)}>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl border", cfg.border, cfg.bg)}>
        <cfg.icon className={cn("size-5", cfg.colour)} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-bold", cfg.colour)}>{cfg.label}</p>
          <span className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[10px] text-muted-foreground">
            Simulated
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{cfg.description}</p>
      </div>
    </div>
  );
}
