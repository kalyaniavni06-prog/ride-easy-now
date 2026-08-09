import { Link } from "@tanstack/react-router";
import { Bus } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[oklch(0.185_0.024_256)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bus className="size-4" aria-hidden />
            </span>
            <div className="leading-none">
              <span className="block text-sm font-bold tracking-tight text-foreground">TransitEase</span>
              <span className="block text-[10px] text-muted-foreground tracking-wide mt-0.5">
                One Platform. Every Journey.
              </span>
            </div>
          </div>
          <p className="mt-3 max-w-xs text-xs text-muted-foreground leading-relaxed">
            Search, book and manage bus and train journeys in one place.
            This is a demo build — bookings and passes are simulated.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Travel</p>
            <nav aria-label="Footer travel links" className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/search" className="hover:text-foreground transition-colors">Search journeys</Link>
              <Link to="/bookings" className="hover:text-foreground transition-colors">My Bookings</Link>
              <Link to="/pass" className="hover:text-foreground transition-colors">Travel Pass</Link>
            </nav>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Account</p>
            <nav aria-label="Footer account links" className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              <Link to="/login" className="hover:text-foreground transition-colors">Log in</Link>
              <Link to="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="border-t border-white/6 px-4 py-4">
        <p className="mx-auto max-w-6xl text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} TransitEase · Demo build · No real payments processed
        </p>
      </div>
    </footer>
  );
}
