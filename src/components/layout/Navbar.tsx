import { Link, useRouterState } from "@tanstack/react-router";
import { Bus, LayoutDashboard, LogOut, Menu, Search, Ticket, TrainFront, User, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useApp } from "@/context/AppStore";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: TrainFront },
  { to: "/search", label: "Search", icon: Search },
  { to: "/bookings", label: "My Bookings", icon: Ticket },
  { to: "/pass", label: "Travel Pass", icon: Wallet },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

export function Navbar() {
  const { user, signOut } = useApp();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[oklch(0.155_0.022_256/0.92)] backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4" aria-label="Main">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Bus className="size-5" aria-hidden />
          </span>
          <div className="leading-none">
            <span className="block text-base font-bold tracking-tight text-foreground">TransitEase</span>
            <span className="block text-[10px] text-muted-foreground tracking-wide">One Platform. Every Journey.</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="ml-6 hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:bg-white/6 hover:text-foreground",
                "data-[status=active]:bg-primary/15 data-[status=active]:text-primary",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/15"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline text-sm font-medium">{user.name.split(" ")[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs text-muted-foreground font-normal">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 size-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/bookings">
                    <Ticket className="mr-2 size-4" /> My Bookings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 size-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="shadow-sm">
                <Link to="/signup">Sign up</Link>
              </Button>
            </div>
          )}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden border border-white/10 bg-white/5 hover:bg-white/10"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card border-l border-white/8">
              <SheetTitle className="px-4 pt-5 text-base font-semibold">Menu</SheetTitle>
              <div className="mt-3 flex flex-col gap-1 p-3">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.to === "/" }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                      "text-muted-foreground hover:bg-white/6 hover:text-foreground",
                      "data-[status=active]:bg-primary/15 data-[status=active]:text-primary",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                ))}
                {!user && (
                  <div className="mt-4 grid gap-2 px-1">
                    <Button asChild variant="outline" className="border-white/12 bg-white/5">
                      <Link to="/login">
                        <User className="mr-2 size-4" /> Log in
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link to="/signup">Create account</Link>
                    </Button>
                  </div>
                )}
                {user && (
                  <div className="mt-4 border-t border-white/8 pt-4 px-1">
                    <button
                      onClick={signOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="size-4 shrink-0" aria-hidden />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
