import { Plus, Share2, Eye } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Plus,
    title: "Create your wishlist",
    description: "Sign up for free and start adding items you love. Paste links, add notes, set prices, or let us auto-fill details from any URL.",
  },
  {
    number: "02",
    icon: Share2,
    title: "Share with anyone",
    description: "Copy your unique wishlist link and share it with friends, family, or your social media followers. It works everywhere.",
  },
  {
    number: "03",
    icon: Eye,
    title: "Track & celebrate",
    description: "Watch your view count grow. See when people visit your list and get notified when items are claimed. No more surprise duplicates.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-card">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium uppercase tracking-widest text-accent mb-4">How It Works</p>
          <h2 className="font-serif text-4xl lg:text-5xl tracking-tight text-foreground text-balance">
            Three steps to the perfect gift
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-border" />
              )}

              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background border-2 border-border">
                  <step.icon className="h-7 w-7 text-accent" />
                </div>
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">
                  {step.number}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
