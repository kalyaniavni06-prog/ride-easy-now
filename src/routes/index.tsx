import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bus,
  IndianRupee,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrainFront,
  Wallet,
  Zap,
} from "lucide-react";

import { SearchWidget } from "@/components/SearchWidget";
import { FavoriteRoutes } from "@/components/FavoriteRoutes";
import { QuickTripMode } from "@/components/QuickTripMode";
import { TravelPreferences } from "@/components/TravelPreferences";
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
  { icon: Zap, title: "Book in seconds", body: "Search, pick a seat and confirm in under a minute — bus or train." },
  { icon: IndianRupee, title: "Transparent fares", body: "Full fare breakdown before you pay. No surprise charges." },
  { icon: Wallet, title: "Digital passes", body: "Daily, weekly and monthly passes live right in your pocket." },
  {
    icon: LayoutDashboard,
    title: "One dashboard",
    body: "Every ticket, pass and upcoming trip in a single travel hub.",
  },
];

function Home() {
  const date = todayISO();

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="hero-band border-b border-white/8">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="gap-1.5 border-primary/25 bg-primary/10 text-primary"
            >
              <ShieldCheck className="size-3.5" aria-hidden />
              Buses &amp; trains, one account
            </Badge>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              One Platform.{" "}
              <span className="text-primary">Every Journey.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              Search, compare and book bus and train journeys across India. Manage everything from a single account.
            </p>
          </div>

          <div className="mt-10">
            <SearchWidget />
          </div>

          {/* AI Assistant CTA */}
          <div className="mt-5">
            <Link
              to="/assistant"
              className="inline-flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-all hover:border-primary/50 hover:bg-primary/15"
            >
              <Sparkles className="size-4" aria-hidden />
              Try the AI Travel Assistant — plan, compare and decide in seconds
              <ArrowRight className="size-3.5 opacity-70" aria-hidden />
            </Link>
          </div>

          {/* Favourite routes */}
          <div className="mt-6">
            <FavoriteRoutes />
          </div>

          {/* Quick Trip Mode */}
          <div className="mt-6 surface-panel p-5">
            <QuickTripMode from="Mumbai" to="Pune" />
          </div>

          {/* Quick action tiles */}
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
                className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 p-4 transition-all hover:border-primary/30 hover:bg-white/7"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <action.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{action.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{action.description}</span>
                </span>
                <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular routes ────────────────────────────────────────── */}
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
              className="group surface-panel p-5 transition-all hover:border-primary/25 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="text-foreground">{route.from}</span>
                <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                <span className="text-foreground">{route.to}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-xs text-muted-foreground">
                  {route.type === "bus" ? <Bus className="size-3" /> : <TrainFront className="size-3" />}
                  {route.duration}
                </span>
                <span className="text-sm text-muted-foreground">
                  from{" "}
                  <span className="font-bold text-foreground">{formatINR(route.fromFare)}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Why TransitEase ───────────────────────────────────────── */}
      <section className="border-t border-white/8 bg-[oklch(0.185_0.024_256)]">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold">Why TransitEase</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need for smarter travel, in one place.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/8 bg-white/3 p-5 transition-colors hover:border-primary/20 hover:bg-white/5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-sm">
              <Link to="/search" search={{ from: "Delhi", to: "Jaipur", date, type: "both", passengers: 1 }}>
                Start searching
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/12 bg-white/4 hover:bg-white/8">
              <Link to="/pass">Explore travel passes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Travel Preferences */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <TravelPreferences onChange={() => {/* preference saved to localStorage, picked up on next search */}} />
      </section>
    </>
  );
}
