import { createFileRoute, Link } from "@tanstack/react-router";
import { Package2, User, Bike, Warehouse, LayoutDashboard, ArrowRight, Sparkles, Zap, ShieldCheck, MapPinned } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShipLync — AI Logistics Operating System" },
      { name: "description", content: "ShipLync is an AI-powered courier and logistics platform for customers, drivers, hubs and operators. Real-time tracking, smart routing, medical priority, and predictive ETAs." },
      { property: "og:title", content: "ShipLync — AI Logistics Operating System" },
      { property: "og:description", content: "Real-time tracking, smart routing, and AI-powered logistics for the modern supply chain." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const portals = [
  {
    to: "/customer",
    title: "Customer",
    tag: "Book & Track",
    desc: "Book shipments, live-track parcels on the map, and manage returns.",
    icon: User,
    grad: "from-indigo-500 to-blue-500",
  },
  {
    to: "/driver",
    title: "Delivery Partner",
    tag: "Deliver Faster",
    desc: "Optimized routes, one-tap POD, OTP verification and earnings.",
    icon: Bike,
    grad: "from-teal-500 to-emerald-500",
  },
  {
    to: "/hub",
    title: "Hub Operations",
    tag: "Sort & Dispatch",
    desc: "Intake scanning, dispatch center, exception queue and load balancing.",
    icon: Warehouse,
    grad: "from-amber-500 to-orange-500",
  },
  {
    to: "/admin",
    title: "Administrator",
    tag: "Command Center",
    desc: "Nationwide fleet, hub heatmaps, revenue and AI recommendations.",
    icon: LayoutDashboard,
    grad: "from-fuchsia-500 to-rose-500",
  },
] as const;

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="h-16 border-b bg-background/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center text-white">
              <Package2 className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold tracking-tight">ShipLync</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground border rounded-full px-2 py-0.5 ml-1">
              v3.2 · Live
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a className="hover:text-foreground">Platform</a>
            <a className="hover:text-foreground">Fleet AI</a>
            <a className="hover:text-foreground">Enterprise</a>
            <a className="hover:text-foreground">Pricing</a>
          </nav>
          <Link
            to="/customer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3.5 py-2 text-sm font-medium hover:opacity-90"
          >
            Launch app <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 pt-16 pb-10 relative">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Coordinator online · optimizing 1,284 shipments
          </div>
          <h1 className="mt-5 font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            The intelligent operating system for modern logistics.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            ShipLync coordinates every parcel across customers, drivers, hubs and operators — with
            hyper-accurate ETAs, autonomous route planning, and medical-grade priority handling.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90"
            >
              Open command center <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/customer/book"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Book a shipment
            </Link>
          </div>
        </div>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {portals.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="group card-elevated p-6 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${p.grad} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${p.grad} grid place-items-center text-white shadow-sm`}>
                <p.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">{p.tag}</div>
              <div className="mt-1 font-display text-xl font-semibold">{p.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{p.desc}</div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
                Enter portal <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-4">
          {[
            { i: Zap, t: "Hyper-accurate ETA", d: "Blends traffic, weather, elevator delays and hub congestion into a continuously-updating prediction." },
            { i: MapPinned, t: "Autonomous routing", d: "Say what to deliver by when — AI clusters, sequences and assigns drivers automatically." },
            { i: ShieldCheck, t: "Medical priority lane", d: "Blood, organs, meds — locked routes, dedicated riders, real-time chain-of-custody." },
          ].map((f) => (
            <div key={f.t} className="card-elevated p-5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <f.i className="h-4 w-4" />
              </div>
              <div className="mt-3 font-display font-semibold">{f.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 text-xs text-muted-foreground flex flex-wrap justify-between gap-3">
          <div>© {new Date().getFullYear()} ShipLync Logistics Systems · Enterprise Edition</div>
          <div className="flex gap-5">
            <a>Security</a><a>Status</a><a>API</a><a>Careers</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
