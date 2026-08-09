import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, WalletCards, Zap } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { QrPlaceholder } from "@/components/QrPlaceholder";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { isPassActive, useApp } from "@/context/AppStore";
import { PASS_PLANS, formatINR } from "@/data/transit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pass")({
  head: () => ({
    meta: [
      { title: "Travel Pass — TransitEase" },
      { name: "description", content: "Daily, weekly and monthly digital travel passes with instant activation." },
      { property: "og:title", content: "Travel Pass — TransitEase" },
      { property: "og:description", content: "Unlimited city and suburban travel on one digital pass." },
    ],
  }),
  component: () => (
    <RequireAuth redirectTo="/pass">
      <PassPage />
    </RequireAuth>
  ),
});

// Colour accents per plan index
const PLAN_ACCENTS = [
  { border: "border-cyan-400/20", bg: "bg-cyan-400/8", text: "text-cyan-300", glow: "hover:border-cyan-400/35" },
  { border: "border-primary/20", bg: "bg-primary/8", text: "text-primary", glow: "hover:border-primary/40" },
  { border: "border-indigo-400/20", bg: "bg-indigo-400/8", text: "text-indigo-300", glow: "hover:border-indigo-400/35" },
];

function PassPage() {
  const { passes, buyPass } = useApp();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Travel Pass</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Unlimited city and suburban travel. Demo purchase — no payment is processed.
      </p>

      {/* Plans */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Choose a pass
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {PASS_PLANS.map((plan, idx) => {
            const accent = PLAN_ACCENTS[idx % PLAN_ACCENTS.length]!;
            return (
              <div
                key={plan.id}
                className={cn(
                  "surface-panel flex flex-col p-6 transition-all",
                  accent.glow,
                )}
              >
                <div className={cn("inline-flex size-10 items-center justify-center rounded-xl border", accent.border, accent.bg)}>
                  <Zap className={cn("size-5", accent.text)} aria-hidden />
                </div>
                <h3 className="mt-4 text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.coverage}</p>
                <div className="mt-5">
                  <p className="text-3xl font-extrabold tracking-tight">{formatINR(plan.price)}</p>
                  <p className="text-xs text-muted-foreground">
                    Valid for {plan.days} {plan.days === 1 ? "day" : "days"}
                  </p>
                </div>
                <ul className="mt-5 space-y-2.5 text-sm">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex gap-2.5">
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-emerald-400"
                        aria-hidden
                      />
                      <span className="text-muted-foreground">{perk}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full shadow-sm"
                  onClick={() => {
                    buyPass(plan.id);
                    toast.success(`${plan.name} activated`, {
                      description: "Your digital pass is ready below.",
                    });
                  }}
                >
                  Get pass (Demo)
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Your passes */}
      <section className="mt-12">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your passes
        </h2>
        <div className="mt-5 space-y-4">
          {passes.length === 0 ? (
            <EmptyState
              icon={WalletCards}
              title="No travel pass yet"
              description="Pick a daily, weekly or monthly pass above to unlock unlimited rides across the network."
            />
          ) : (
            passes.map((pass) => {
              const active = isPassActive(pass);
              return (
                <article
                  key={pass.id}
                  className={cn(
                    "surface-panel overflow-hidden transition-all",
                    active && "border-primary/20",
                  )}
                >
                  {/* Pass header band */}
                  <div className={cn(
                    "flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-6 py-4",
                    active ? "bg-primary/8" : "bg-white/3",
                  )}>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold">{pass.name}</h3>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          active
                            ? "border border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                            : "border border-white/10 bg-white/4 text-muted-foreground",
                        )}
                      >
                        {active ? "Active" : "Expired"}
                      </span>
                    </div>
                    <p className="text-lg font-bold">{formatINR(pass.price)}</p>
                  </div>

                  {/* Pass body */}
                  <div className="flex flex-wrap items-center gap-6 px-6 py-5">
                    <div className="rounded-xl border border-white/10 bg-white p-2 shrink-0">
                      <QrPlaceholder value={pass.id} size={100} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">{pass.coverage}</p>
                      <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">Valid: </span>
                        <span className="font-medium text-foreground">
                          {new Date(pass.startDate).toLocaleDateString("en-IN")}
                        </span>
                        <span className="text-muted-foreground"> – </span>
                        <span className="font-medium text-foreground">
                          {new Date(pass.endDate).toLocaleDateString("en-IN")}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Pass ID: {pass.id}</p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
