import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bus,
  IndianRupee,
  LayoutDashboard,
  ShieldCheck,
  Ticket,
  TrainFront,
  Wallet,
} from "lucide-react";

import { SearchWidget } from "@/components/SearchWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { POPULAR_ROUTES, formatINR } from "@/data/transit";
import { todayISO } from "@/lib/search-params";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TransitEase — One Platform. Every Journey." },
      {
        name: "description",
        content: "Search, book and manage your bus and train journeys in one place across major Indian cities.",
      },
      { property: "og:title", content: "TransitEase — One Platform. Every Journey." },
      {
        property: "og:description",
        content: "Search buses and trains, pick seats, book instantly and carry digital travel passes.",
      },
    ],
  }),
  component: Home,
});

const QUICK_ACTIONS = [
  { label: "Search Buses", description: "Sleeper, AC & seater", icon: Bus, to: "/search", type: "bus" as const },
  { label: "Search Trains", description: "Express & superfast", icon: TrainFront, to: "/search", type: "train" as const },
  { label: "My Bookings", description: "Tickets & PNR status", icon: Ticket, to: "/bookings", type: null },
  { label: "Travel Pass", description: "Daily, weekly, monthly", icon: Wallet, to: "/pass", type: null },
];

const WHY = [
  { icon: Ticket, title: "Easy booking", body: "Search, pick a seat and confirm in under a minute — bus or train." },
  { icon: IndianRupee, title: "Transparent fares", body: "Full fare breakdown before you pay. No surprise charges." },
  { icon: Wallet, title: "Digital passes", body: "Daily, weekly and monthly passes live in your pocket." },
  {
    icon: LayoutDashboard,
    title: "Centralized journeys",
    body: "Every ticket, pass and upcoming trip in a single dashboard.",
  },
];

function Home() {
  const date = todayISO();

  return (
    <>
      <section className="hero-band border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="gap-1.5">
              <ShieldCheck className="size-3.5" aria-hidden /> Buses & trains, one account
            </Badge>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">One Platform. Every Journey.</h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Search, book and manage your bus and train journeys in one place.
            </p>
          </div>

          <div className="mt-8">
            <SearchWidget />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                search={
                  action.type
                    ? { from: "Mumbai", to: "Pune", date, type: action.type, passengers: 1 }
                    : undefined
                }
                className="surface-panel group flex items-center gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <action.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{action.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{action.description}</span>
                </span>
                <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Popular routes</h2>
            <p className="mt-1 text-sm text-muted-foreground">Frequently travelled connections this week.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_ROUTES.map((route) => (
            <Link
              key={`${route.from}-${route.to}`}
              to="/search"
              search={{ from: route.from, to: route.to, date, type: route.type, passengers: 1 }}
              className="surface-panel group p-5 transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                {route.from}
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                {route.to}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {route.type === "bus" ? <Bus className="size-3.5" /> : <TrainFront className="size-3.5" />}
                  {route.duration}
                </span>
                <span className="text-sm">
                  from <span className="font-semibold">{formatINR(route.fromFare)}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold">Why TransitEase</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((item) => (
              <div key={item.title} className="surface-panel p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/search" search={{ from: "Delhi", to: "Jaipur", date, type: "both", passengers: 1 }}>
                Start searching
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pass">Explore travel passes</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
