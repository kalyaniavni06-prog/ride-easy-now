/**
 * FavoriteRoutes — save and quick-search favourite city pairs.
 * Stored in localStorage. Fully client-side, no backend required.
 */
import { Heart, MapPin, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITIES } from "@/data/transit";
import { todayISO } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface FavRoute {
  from: string;
  to: string;
  savedAt: string;
}

const FAV_KEY = "transitease.fav-routes";
const MAX_FAVS = 8;

function getFavs(): FavRoute[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as FavRoute[]) : [];
  } catch { return []; }
}

function saveFavs(favs: FavRoute[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch { /* non-fatal */ }
}

interface FavoriteRoutesProps {
  className?: string;
}

export function FavoriteRoutes({ className }: FavoriteRoutesProps) {
  const navigate = useNavigate();
  const [favs, setFavs] = useState<FavRoute[]>([]);
  const [adding, setAdding] = useState(false);
  const [newFrom, setNewFrom] = useState(CITIES[0] ?? "Mumbai");
  const [newTo, setNewTo] = useState(CITIES[6] ?? "Pune");

  useEffect(() => { setFavs(getFavs()); }, []);

  const add = () => {
    if (!newFrom || !newTo || newFrom === newTo) return;
    const exists = favs.some((f) => f.from === newFrom && f.to === newTo);
    if (exists) { setAdding(false); return; }
    const next = [{ from: newFrom, to: newTo, savedAt: new Date().toISOString() }, ...favs].slice(0, MAX_FAVS);
    setFavs(next);
    saveFavs(next);
    setAdding(false);
  };

  const remove = (idx: number) => {
    const next = favs.filter((_, i) => i !== idx);
    setFavs(next);
    saveFavs(next);
  };

  const search = (f: FavRoute) => {
    void navigate({ to: "/search", search: { from: f.from, to: f.to, date: todayISO(), type: "both", passengers: 1 } });
  };

  return (
    <div className={cn("surface-panel p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Heart className="size-4 text-red-400 fill-red-400/30" aria-hidden />
          Favourite Routes
        </h2>
        {!adding && favs.length < MAX_FAVS && (
          <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" /> Add
          </Button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[120px]">
            <Select value={newFrom} onValueChange={setNewFrom}>
              <SelectTrigger className="h-8 border-white/12 bg-white/4 text-xs">
                <MapPin className="size-3 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground">→</span>
          <div className="flex-1 min-w-[120px]">
            <Select value={newTo} onValueChange={setNewTo}>
              <SelectTrigger className="h-8 border-white/12 bg-white/4 text-xs">
                <MapPin className="size-3 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="h-8 text-xs" onClick={add} disabled={newFrom === newTo}>Save</Button>
          <Button size="icon" variant="ghost" className="size-8" onClick={() => setAdding(false)}>
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Routes list */}
      {favs.length === 0 && !adding ? (
        <p className="mt-3 text-xs text-muted-foreground">No saved routes yet. Add your frequent routes for quick access.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {favs.map((f, i) => (
            <div key={i} className="group inline-flex items-center gap-0 rounded-full border border-white/10 bg-white/4 overflow-hidden">
              <button
                type="button"
                onClick={() => search(f)}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <MapPin className="size-3 shrink-0" />
                {f.from} → {f.to}
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${f.from} → ${f.to}`}
                className="flex items-center px-1.5 py-1.5 text-muted-foreground/50 opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
