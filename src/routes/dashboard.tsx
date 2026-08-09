import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Bus, Search, Ticket, TrainFront, Wallet } from "lucide-react";

import { RequireAuth } from "@/components/RequireAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isPassActive, useApp } from "@/context/AppStore";
import { formatINR } from "@/data/transit";
import { formatLongDate, todayISO } from "@/lib/search-params";

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
  const next = upcoming[upcoming.length - 1];
  const activePass = passes.find(isPassActive);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            {user?.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-bold">Hi, {user?.name.split(" ")[0]}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="outline" onClick={signOut}>
          Log out
        </Button>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <section className="surface-panel p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upcoming journey</h2>
          {next ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  {next.type === "bus" ? <Bus className="size-3.5" /> : <TrainFront className="size-3.5" />}
                  {next.operator}
                </Badge>
                <span className="text-xs text-muted-foreground">PNR {next.id}</span>
              </div>
              <p className="mt-2 text-xl font-bold">
                {next.from} → {next.to}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatLongDate(next.date)} · {next.departure} · Seats {next.seats.join(", ")}
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link to="/confirmation/$pnr" params={{ pnr: next.id }}>
                  View ticket
                </Link>
              </Button>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No trips planned. Search a route to get moving.
            </p>
          )}
        </section>

        <section className="surface-panel p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Active pass</h2>
          {activePass ? (
            <>
              <p className="mt-3 text-lg font-semibold">{activePass.name}</p>
              <p className="text-sm text-muted-foreground">
                Valid till {new Date(activePass.endDate).toLocaleDateString("en-IN")}
              </p>
              <Badge className="mt-3">Active</Badge>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground">No active pass right now.</p>
              <Button asChild size="sm" variant="outline" className="mt-4">
                <Link to="/pass">Get a pass</Link>
              </Button>
            </>
          )}
        </section>

        <section className="surface-panel p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent bookings</h2>
          {bookings.length ? (
            <ul className="mt-3 divide-y divide-border">
              {bookings.slice(0, 4).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {b.from} → {b.to}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatLongDate(b.date)} · {b.status === "confirmed" ? "Confirmed" : "Cancelled"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatINR(b.fareBreakdown.total)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Your bookings will show up here.</p>
          )}
        </section>

        <section className="surface-panel p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Bell className="size-4" aria-hidden /> Notifications
          </h2>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="rounded-lg bg-surface px-3 py-2">Boarding points are confirmed 2 hours before departure.</li>
            <li className="rounded-lg bg-surface px-3 py-2">Weekly passes now cover suburban trains.</li>
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <QuickAction to="/search" icon={Search} label="Search journeys" />
        <QuickAction to="/bookings" icon={Ticket} label="My bookings" />
        <QuickAction to="/pass" icon={Wallet} label="Travel pass" />
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof Search; label: string }) {
  return (
    <Button asChild variant="outline" size="lg" className="justify-start">
      <Link to={to}>
        <Icon className="mr-2 size-4" aria-hidden />
        {label}
      </Link>
    </Button>
  );
}
