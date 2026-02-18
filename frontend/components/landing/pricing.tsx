import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Free",
    price: "₦0",
    period: "forever",
    description: "Perfect for getting started with wishlists.",
    features: [
      "Up to 3 wishlists",
      "50 items per list",
      "Shareable links",
      "Basic view count",
      "Item claiming",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₦2,500",
    period: "/month",
    description: "For serious wishlisters and families.",
    features: [
      "Unlimited wishlists",
      "Unlimited items",
      "Detailed view analytics",
      "Custom list themes",
      "Priority support",
      "Password protection",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Family",
    price: "₦4,500",
    period: "/month",
    description: "Share the joy with your whole family.",
    features: [
      "Everything in Pro",
      "Up to 6 family members",
      "Shared family dashboard",
      "Event reminders",
      "Gift coordination",
      "Early access to features",
    ],
    cta: "Try Family Plan",
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium uppercase tracking-widest text-accent mb-4">Pricing</p>
          <h2 className="font-serif text-4xl lg:text-5xl tracking-tight text-foreground text-balance">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Start free and upgrade when you need more. No hidden fees, ever.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? "border-accent bg-foreground text-background shadow-xl scale-[1.02]"
                  : "border-border bg-card text-card-foreground"
              }`}
            >
              <div className="mb-6">
                <h3 className={`text-lg font-semibold ${plan.highlighted ? "text-background" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className={`text-4xl font-bold ${plan.highlighted ? "text-background" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? "text-background/70" : "text-muted-foreground"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-2 ${plan.highlighted ? "text-background/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <Check className={`h-4 w-4 flex-shrink-0 ${plan.highlighted ? "text-accent" : "text-accent"}`} />
                    <span className={`text-sm ${plan.highlighted ? "text-background/90" : "text-muted-foreground"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full py-5 ${
                  plan.highlighted
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-foreground text-background hover:bg-foreground/90"
                }`}
                asChild
              >
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
