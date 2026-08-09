import { Link } from "@tanstack/react-router";
import { Bus } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bus className="size-4" aria-hidden />
            </span>
            TransitEase
          </div>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            One platform for bus and train travel. This is a demo build — bookings and passes are simulated.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/search" className="hover:text-foreground">
            Search
          </Link>
          <Link to="/bookings" className="hover:text-foreground">
            My Bookings
          </Link>
          <Link to="/pass" className="hover:text-foreground">
            Travel Pass
          </Link>
          <Link to="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
        </nav>
      </div>
    </footer>
  );
}
