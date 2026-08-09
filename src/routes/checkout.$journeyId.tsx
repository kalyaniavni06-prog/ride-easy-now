import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, Loader2, MapPinOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDuration, formatINR, searchJourneys } from "@/data/transit";
import { useApp } from "@/context/AppStore";
import { fareBreakdown, formatLongDate, validateBookingSearch } from "@/lib/search-params";
import { draftStore, generatePNR, type Booking, type Passenger } from "@/lib/storage";

export const Route = createFileRoute("/checkout/$journeyId")({
  validateSearch: validateBookingSearch,
  head: () => ({
    meta: [
      { title: "Checkout — TransitEase" },
      { name: "description", content: "Add passenger details and confirm your journey with a demo payment." },
      { property: "og:title", content: "Checkout — TransitEase" },
      { property: "og:description", content: "Review your fare breakdown and complete a simulated booking." },
    ],
  }),
  component: Checkout,
});

const passengerSchema = z.object({
  name: z.string().trim().min(2, "Enter the full name as on ID").max(60),
  age: z.number().int().min(1, "Enter a valid age").max(120, "Enter a valid age"),
  gender: z.enum(["male", "female", "other"]),
});

const contactSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Enter a 10-digit mobile number"),
});

function Checkout() {
  const { journeyId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, addBooking } = useApp();

  const journey = searchJourneys(search.from, search.to, search.date, "both").find((j) => j.id === journeyId);
  const draft = draftStore.get();
  const seats = (search.seats ? search.seats.split(",") : (draft?.seats ?? [])).filter(Boolean);

  type PersonForm = { name: string; age: string; gender: Passenger["gender"] };
  const [people, setPeople] = useState<PersonForm[]>(
    seats.map((): PersonForm => ({ name: "", age: "", gender: "male" })),
  );
  const [contact, setContact] = useState({ email: user?.email ?? "", phone: user?.phone ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  if (!journey || seats.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={MapPinOff}
          title="Your seat selection expired"
          description="We couldn't find the seats you picked. Choose your journey and seats again — it only takes a moment."
          action={{ label: "Search journeys", to: "/search" }}
          tone="danger"
        />
      </div>
    );
  }

  const fare = fareBreakdown(journey.fare, seats.length);

  const updatePerson = (index: number, patch: Partial<PersonForm>) =>
    setPeople((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    people.forEach((p, i) => {
      const result = passengerSchema.safeParse({ name: p.name, age: Number(p.age), gender: p.gender });
      if (!result.success) {
        const issue = result.error.issues[0];
        nextErrors[`p${i}`] = issue?.message ?? "Please check these details";
      }
    });

    const contactResult = contactSchema.safeParse(contact);
    if (!contactResult.success) {
      for (const issue of contactResult.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));

    try {
      const pnr = generatePNR(journey.type);
      const booking: Booking = {
        id: pnr,
        createdAt: new Date().toISOString(),
        userEmail: user?.email ?? contact.email.toLowerCase(),
        type: journey.type,
        operator: journey.operator,
        code: journey.code,
        from: journey.from,
        to: journey.to,
        date: search.date,
        departure: journey.departure,
        arrival: journey.arrival,
        durationMins: journey.durationMins,
        seats,
        passengers: people.map((p, i) => ({
          name: p.name.trim(),
          age: Number(p.age),
          gender: p.gender,
          seat: seats[i] ?? "",
        })),
        contactEmail: contact.email.trim().toLowerCase(),
        contactPhone: contact.phone.trim(),
        fareBreakdown: fare,
        status: "confirmed",
      };
      addBooking(booking);
      draftStore.clear();
      toast.success("Booking confirmed");
      void navigate({ to: "/confirmation/$pnr", params: { pnr } });
    } catch {
      setProcessing(false);
      toast.error("We couldn't complete your booking", {
        description: "No money was taken. Please try again in a moment.",
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link
          to="/seats/$journeyId"
          params={{ journeyId: journey.id }}
          search={{
            from: search.from,
            to: search.to,
            date: search.date,
            type: search.type,
            passengers: search.passengers,
          }}
        >
          <ArrowLeft className="mr-2 size-4" /> Change seats
        </Link>
      </Button>

      <h1 className="text-2xl font-bold">Passenger details</h1>
      <p className="mt-1 text-sm text-muted-foreground">Names must match a valid government ID carried during travel.</p>

      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {people.map((person, index) => (
            <section key={index} className="surface-panel p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Passenger {index + 1}</h2>
                <Badge variant="secondary">Seat {seats[index]}</Badge>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_100px_140px]">
                <div>
                  <Label htmlFor={`name-${index}`}>Full name</Label>
                  <Input
                    id={`name-${index}`}
                    value={person.name}
                    maxLength={60}
                    onChange={(e) => updatePerson(index, { name: e.target.value })}
                    placeholder="e.g. Ananya Sharma"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor={`age-${index}`}>Age</Label>
                  <Input
                    id={`age-${index}`}
                    inputMode="numeric"
                    value={person.age}
                    onChange={(e) => updatePerson(index, { age: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                    placeholder="28"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor={`gender-${index}`}>Gender</Label>
                  <Select
                    value={person.gender}
                    onValueChange={(v) => updatePerson(index, { gender: v as Passenger["gender"] })}
                  >
                    <SelectTrigger id={`gender-${index}`} className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {errors[`p${index}`] ? (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {errors[`p${index}`]}
                </p>
              ) : null}
            </section>
          ))}

          <section className="surface-panel p-5">
            <h2 className="text-sm font-semibold">Contact details</h2>
            <p className="mt-1 text-xs text-muted-foreground">Your ticket and updates are sent here.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  placeholder="you@example.com"
                  className="mt-1.5"
                />
                {errors["email"] ? (
                  <p role="alert" className="mt-1.5 text-sm text-destructive">
                    {errors["email"]}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="phone">Mobile number</Label>
                <Input
                  id="phone"
                  inputMode="numeric"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="9876543210"
                  className="mt-1.5"
                />
                {errors["phone"] ? (
                  <p role="alert" className="mt-1.5 text-sm text-destructive">
                    {errors["phone"]}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="surface-panel p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" aria-hidden />
              <h2 className="text-sm font-semibold">Demo Payment</h2>
              <Badge variant="outline" className="ml-auto">
                No real charge
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This is a demo build. Confirming simply generates a ticket — no card details are collected and no payment
              is processed.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface px-3 py-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success" aria-hidden />
              Payments will be handled by a secure provider in production.
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="surface-panel p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Journey summary</h2>
            <p className="mt-3 font-semibold">
              {journey.from} → {journey.to}
            </p>
            <p className="text-sm text-muted-foreground">
              {journey.operator} · {journey.type === "bus" ? "Bus" : "Train"}
            </p>
            <p className="mt-2 text-sm">
              {formatLongDate(search.date)} · {journey.departure} – {journey.arrival} (
              {formatDuration(journey.durationMins)})
            </p>
            <p className="mt-3 text-sm">
              <span className="text-muted-foreground">Seats: </span>
              <span className="font-semibold">{seats.join(", ")}</span>
            </p>

            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Base fare × {seats.length}</dt>
                <dd className="tabular-nums">{formatINR(fare.baseFare)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Taxes (5%)</dt>
                <dd className="tabular-nums">{formatINR(fare.taxes)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Convenience fee</dt>
                <dd className="tabular-nums">{formatINR(fare.convenience)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-semibold">Total</dt>
                <dd className="text-lg font-bold">{formatINR(fare.total)}</dd>
              </div>
            </dl>

            <Button type="submit" size="lg" className="mt-4 w-full" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Processing demo payment…
                </>
              ) : (
                `Pay ${formatINR(fare.total)} (Demo)`
              )}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}
