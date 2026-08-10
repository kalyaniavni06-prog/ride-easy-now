import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BookOpen, Bus, Clock, MapPin, Search, Ticket, TrainFront, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { isPassActive, useApp } from "@/context/AppStore";
import { formatINR } from "@/data/transit";
import { formatLongDate, todayISO } from "@/lib/search-params";
import { recentSearches, type RecentSearch } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TransitEase" },
      { name: "description", content: "Your upcoming journey, active pass, recent bookings and quick actions." },
      { property: "og:title", content: "Dashboard — TransitEase" },
      { property: "og:description", content: "Manage every journey from a single travel dashboard." },
    ],
  }),
  component: () => (
    <RequireAuth redirectTo="/dashboard">
      <Dashboard />
    </RequireAuth>
  ),
});

function Dashboard() {
  const { user, bookings, passes, signOut } = useApp();
  const today = todayISO();
  const upcoming = bookings.filter((b) => b.date >= today && b.status === "confirmed");
  const cancelled = bookings.filter((b) => b.status === "cancelled");
  const completed = bookings.filter((b) => b.date < today && b.status === "confirmed");
  const next = upcoming[upcoming.length - 1];
  const activePass = passes.find(isPassActive);
  const totalSpend = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + b.fareBreakdown.total, 0);

  const [recent, setRecent] = useState<RecentSearch[]>([]);
  useEffect(() => {
    setRecent(recentSearches.get());
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Profile header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
            {user?.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-bold">Hi, {user?.name.split(" ")[0]}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => void signOut()}
          className="border-white/12 bg-white/4 hover:bg-white/8"
        >
          Log out
        </Button>
      </div>

      {/* Stats row */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total bookings" value={String(bookings.length)} sub="all time" icon={Ticket} accent="cyan" />
        <StatCard label="Upcoming trips" value={String(upcoming.length)} sub="confirmed" icon={TrendingUp} accent="indigo" />
        <StatCard label="Total spent" value={formatINR(totalSpend)} sub="demo only" icon={Wallet} accent="emerald" />
        <StatCard label="Completed trips" value={String(completed.length)} sub="past journeys" icon={BookOpen} accent="amber" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Upcoming journey */}
        <section className="surface-panel p-5 lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Upcoming journey
          </h2>
          {next ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    next.type === "bus"
                      ? "border border-cyan-400/25 bg-cyan-400/10 text-cyan-300"
                      : "border border-indigo-400/25 bg-indigo-400/10 text-indigo-300",
                  )}
                >
                  {next.type === "bus" ? <Bus className="size-3" /> : <TrainFront className="size-3" />}
                  {next.operator}
                </span>
                <span className="text-xs text-muted-foreground">PNR {next.id}</span>
              </div>
              <p className="mt-3 text-2xl font-bold">
                {next.from} <span className="text-primary">→</span> {next.to}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatLongDate(next.date)} · {next.departure} · Seats{" "}
                <span className="font-medium text-foreground">{next.seats.join(", ")}</span>
              </p>
              <Button asChild size="sm" className="mt-4 shadow-sm">
                <Link to="/confirmation/$pnr" params={{ pnr: next.id }}>
                  View ticket
                </Link>
              </Button>
            </>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">No upcoming trips. Search a route to get moving.</p>
              <Button asChild size="sm" variant="outline" className="mt-4 border-white/12 bg-white/4">
                <Link to="/search" search={{}}>Search journeys</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Active pass */}
        <section className="surface-panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Active pass
          </h2>
          {activePass ? (
            <>
              <p className="mt-3 text-lg font-semibold">{activePass.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{activePass.coverage}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Valid till{" "}
                <span className="font-medium text-foreground">
                  {new Date(activePass.endDate).toLocaleDateString("en-IN")}
                </span>
              </p>
              <span className="mt-3 inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Active
              </span>
              <div className="mt-3">
                <Button asChild size="sm" variant="outline" className="border-white/12 bg-white/4">
                  <Link to="/pass">View pass</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">No active pass right now.</p>
              <Button asChild size="sm" variant="outline" className="mt-4 border-white/12 bg-white/4">
                <Link to="/pass">Get a pass</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Recent bookings */}
        <section className="surface-panel p-5 lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Recent bookings
          </h2>
          {bookings.length ? (
            <>
              <ul className="mt-3 divide-y divide-white/8">
                {bookings.slice(0, 4).map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {b.from} <span className="text-primary">→</span> {b.to}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatLongDate(b.date)} ·{" "}
                        <span
                          className={
                            b.status === "confirmed" ? "text-emerald-400" : "text-muted-foreground"
                          }
                        >
                          {b.status === "confirmed" ? "Confirmed" : "Cancelled"}
                        </span>
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      {formatINR(b.fareBreakdown.total)}
                    </p>
                  </li>
                ))}
              </ul>
              <Button asChild variant="ghost" size="sm" className="mt-3 text-primary hover:text-primary/80">
                <Link to="/bookings">View all bookings</Link>
              </Button>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No bookings yet. Your tickets will appear here.</p>
          )}
        </section>

        {/* Notifications */}
        <section className="surface-panel p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Bell className="size-3.5" aria-hidden />
            Notifications
          </h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {upcoming.length > 0 && (
              <li className="rounded-lg border border-primary/20 bg-primary/8 px-3 py-2.5 text-sm font-medium text-primary">
                You have {upcoming.length} upcoming {upcoming.length === 1 ? "trip" : "trips"}.
              </li>
            )}
            {cancelled.length > 0 && (
              <li className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5 text-muted-foreground leading-snug">
                {cancelled.length} booking{cancelled.length === 1 ? "" : "s"} cancelled — check for refund eligibility.
              </li>
            )}
            <li className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5 text-muted-foreground leading-snug">
              Boarding points are confirmed 2 hours before departure.
            </li>
            <li className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5 text-muted-foreground leading-snug">
              Weekly passes now cover suburban trains.
            </li>
          </ul>
        </section>

        {/* Saved / recent routes */}
        {recent.length > 0 && (
          <section className="surface-panel p-5 lg:col-span-3">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Clock className="size-3.5" aria-hidden />
              Recent searches
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {recent.map((r, i) => (
                <Link
                  key={i}
                  to="/search"
                  search={{ from: r.from, to: r.to, date: todayISO(), type: r.type, passengers: r.passengers }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm text-muted-foreground transition-all hover:border-primary/25 hover:bg-primary/8 hover:text-primary"
                >
                  <MapPin className="size-3.5 shrink-0" />
                  {r.from} → {r.to}
                  <span className="text-xs capitalize text-muted-foreground/60">{r.type}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <QuickAction to="/search" icon={Search} label="Search journeys" />
        <QuickAction to="/bookings" icon={Ticket} label="My bookings" />
        <QuickAction to="/pass" icon={Wallet} label="Travel pass" />
      </div>

      {/* Trip Summary */}
      <section className="mt-6 surface-panel p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">📊 Trip Summary</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 text-sm">
          <SummaryItem label="Trips planned" value={String(bookings.length)} />
          <SummaryItem label="Completed" value={String(completed.length)} />
          <SummaryItem label="Upcoming" value={String(upcoming.length)} />
          <SummaryItem
            label="Favourite route"
            value={bookings.length > 0 ? `${bookings[0]!.from} → ${bookings[0]!.to}` : "—"}
          />
          <SummaryItem
            label="Most used"
            value={
              bookings.filter(b => b.type === "bus").length >= bookings.filter(b => b.type === "train").length
                ? "Bus"
                : "Train"
            }
          />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">Based on your bookings in this browser · Demo data</p>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold text-foreground truncate">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Ticket;
  accent: "cyan" | "indigo" | "emerald" | "amber";
}) {
  const colours = {
    cyan: "border-cyan-400/20 bg-cyan-400/8 text-cyan-300",
    indigo: "border-indigo-400/20 bg-indigo-400/8 text-indigo-300",
    emerald: "border-emerald-400/20 bg-emerald-400/8 text-emerald-300",
    amber: "border-amber-400/20 bg-amber-400/8 text-amber-300",
  };
  return (
    <div className="surface-panel flex items-center gap-4 p-5">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl border", colours[accent])}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof Search; label: string }) {
  return (
    <Button
      asChild
      variant="outline"
      size="lg"
      className="justify-start border-white/12 bg-white/4 hover:border-primary/25 hover:bg-primary/8 hover:text-primary"
    >
      <Link to={to}>
        <Icon className="mr-2 size-4" aria-hidden />
        {label}
      </Link>
    </Button>
  );
}
