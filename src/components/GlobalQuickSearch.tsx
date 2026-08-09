/**
 * GlobalQuickSearch — Cmd/Ctrl+K command palette for fast navigation.
 * Simple keyboard-accessible interface. No external deps.
 */
import { useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Search, Sparkles, Ticket, Wallet, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Search journeys",  desc: "Find buses and trains",       icon: Search,        to: "/search",    key: "s" },
  { label: "My Bookings",      desc: "View your tickets",           icon: Ticket,        to: "/bookings",  key: "b" },
  { label: "Travel Pass",      desc: "Daily, weekly, monthly",      icon: Wallet,        to: "/pass",      key: "p" },
  { label: "Dashboard",        desc: "Your travel overview",        icon: LayoutDashboard,to: "/dashboard",key: "d" },
  { label: "AI Assistant",     desc: "Plan and compare journeys",   icon: Sparkles,      to: "/assistant", key: "a" },
];

export function GlobalQuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Open on Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => { if (open) { setQuery(""); setActive(0); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

  const filtered = ITEMS.filter(
    (item) => !query || item.label.toLowerCase().includes(query.toLowerCase()) || item.desc.toLowerCase().includes(query.toLowerCase()),
  );

  const go = (to: string) => { setOpen(false); void navigate({ to }); };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && filtered[active]) go(filtered[active].to);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground md:flex"
        aria-label="Quick search (Ctrl+K)"
      >
        <Search className="size-3.5" aria-hidden />
        Quick navigate
        <kbd className="ml-1 rounded bg-white/8 px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4" role="dialog" aria-modal aria-label="Quick navigation">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/12 bg-card shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={handleKey}
            placeholder="Go to…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        {/* Results */}
        <ul className="p-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</li>
          ) : (
            filtered.map((item, i) => (
              <li key={item.to}>
                <button
                  type="button"
                  onClick={() => go(item.to)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    active === i ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/5",
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  <div>
                    <p className={cn("text-sm font-medium", active === i ? "text-primary" : "text-foreground")}>{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <kbd className="ml-auto rounded bg-white/8 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{item.key}</kbd>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
