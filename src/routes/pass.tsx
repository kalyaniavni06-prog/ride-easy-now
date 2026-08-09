import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Download, WalletCards, Zap } from "lucide-react";
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

const PLAN_ACCENTS = [
  { border: "border-cyan-400/20", iconBg: "bg-cyan-400/8 border-cyan-400/20", iconText: "text-cyan-300", hover: "hover:border-cyan-400/35 hover:shadow-[var(--shadow-lift)]" },
  { border: "border-primary/25", iconBg: "bg-primary/8 border-primary/20", iconText: "text-primary", hover: "hover:border-primary/45 hover:shadow-[var(--shadow-lift)]" },
  { border: "border-indigo-400/20", iconBg: "bg-indigo-400/8 border-indigo-400/20", iconText: "text-indigo-300", hover: "hover:border-indigo-400/35 hover:shadow-[var(--shadow-lift)]" },
];

function PassPage() {
  const { passes, buyPass, user } = useApp();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Travel Pass</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unlimited city and suburban travel. Demo purchase — no real payment processed.
        </p>
      </div>

      {/* Choose a plan */}
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
                  accent.hover,
                )}
              >
                <div className={cn("inline-flex size-10 items-center justify-center rounded-xl border", accent.iconBg)}>
                  <Zap className={cn("size-5", accent.iconText)} aria-hidden />
                </div>
                <h3 className="mt-4 text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.coverage}</p>
                <div className="mt-5">
                  <p className="text-3xl font-extrabold tracking-tight">{formatINR(plan.price)}</p>
                  <p className="text-xs text-muted-foreground">
                    Valid for {plan.days} {plan.days === 1 ? "day" : "days"}
                  </p>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex gap-2.5">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
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
        <div className="mt-5 space-y-5">
          {passes.length === 0 ? (
            <EmptyState
              icon={WalletCards}
              title="No travel pass yet"
              description="Pick a daily, weekly or monthly pass above to unlock unlimited rides across the network."
            />
          ) : (
            passes.map((pass) => {
              const active = isPassActive(pass);
              const start = new Date(pass.startDate);
              const end = new Date(pass.endDate);
              const daysLeft = active
                ? Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : 0;

              return (
                <article
                  key={pass.id}
                  className={cn(
                    "surface-panel overflow-hidden transition-all print:shadow-none",
                    active ? "border-primary/20" : "opacity-75",
                  )}
                >
                  {/* Header band */}
                  <div
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-6 py-4",
                      active ? "bg-primary/8" : "bg-white/3",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-3">
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
                      {active && (
                        <span className="text-xs text-muted-foreground">
                          {daysLeft} {daysLeft === 1 ? "day" : "days"} left
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold">{formatINR(pass.price)}</p>
                  </div>

                  {/* Body */}
                  <div className="grid gap-6 px-6 py-5 sm:grid-cols-[auto_1fr]">
                    {/* QR code on white bg for scan contrast */}
                    <div className="flex flex-col items-center gap-2 print:items-start">
                      <div className="rounded-xl border border-white/10 bg-white p-2">
                        <QrPlaceholder value={pass.id} size={110} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">Show at entry</p>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                        <PassDetail label="Pass holder" value={user?.name ?? "—"} />
                        <PassDetail label="Pass ID" value={pass.id} mono />
                        <PassDetail label="Coverage" value={pass.coverage} />
                        <PassDetail
                          label="Valid from"
                          value={start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        />
                        <PassDetail
                          label="Valid until"
                          value={end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        />
                        <PassDetail label="Status" value={active ? "Active" : "Expired"} highlight={active} />
                      </dl>

                      <div className="flex flex-wrap gap-2 pt-1 print:hidden">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-white/12 bg-white/4 hover:bg-white/8"
                          onClick={() => window.print()}
                        >
                          <Download className="size-3.5" aria-hidden />
                          Download / Print
                        </Button>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        Demo pass — not valid for real travel. Pass ID: {pass.id}
                      </p>
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

function PassDetail({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 text-sm font-medium",
          mono && "font-mono text-xs",
          highlight ? "text-emerald-400" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
