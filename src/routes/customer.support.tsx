import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LifeBuoy, Phone, Mail, MessageSquare, Package, CreditCard, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/support")({
  head: () => ({
    meta: [
      { title: "Support — ShipLync" },
      { name: "description", content: "Get help with your ShipLync shipments." },
    ],
  }),
  component: SupportPage,
});

const FAQS = [
  {
    icon: Package,
    q: "Where is my shipment right now?",
    a: "Open Track shipment and enter your tracking ID, or find it under History for a live status and event timeline.",
  },
  {
    icon: RotateCcw,
    q: "A delivery attempt failed — what happens next?",
    a: "The delivery agent logs the outcome and the shipment moves to \"delivery attempted\". It's automatically queued for another attempt, or returned to sender if the issue can't be resolved — check the Returns page for status.",
  },
  {
    icon: CreditCard,
    q: "How is my shipment cost calculated?",
    a: "Cost = base fare + weight-based rate + package-type surcharge, scaled by priority, plus insurance if selected. See your Invoices page for a per-shipment breakdown.",
  },
];

function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // No ticketing backend is wired up yet — this is an honest placeholder,
    // not a fake "sent" confirmation with nowhere for the message to go.
    setTimeout(() => {
      setSubmitting(false);
      toast.info("Support ticketing isn't connected yet — please use email or phone below for now.");
    }, 400);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Support</div>
        <h1 className="font-display text-3xl font-semibold mt-1">How can we help?</h1>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <a href="tel:+911234567890" className="card-elevated p-5 flex items-center gap-3 hover:bg-muted/30">
          <Phone className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-medium">Call us</div>
            <div className="text-xs text-muted-foreground">+91 12345 67890</div>
          </div>
        </a>
        <a href="mailto:support@shiplync.example" className="card-elevated p-5 flex items-center gap-3 hover:bg-muted/30">
          <Mail className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-medium">Email us</div>
            <div className="text-xs text-muted-foreground">support@shiplync.example</div>
          </div>
        </a>
        <div className="card-elevated p-5 flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-medium">Live chat</div>
            <div className="text-xs text-muted-foreground">Not yet available</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LifeBuoy className="h-4 w-4" /> Send us a message
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="text-xs">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs">Message</Label>
              <Textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send message"}
            </Button>
          </form>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Frequently asked</div>
          {FAQS.map((f) => (
            <div key={f.q} className="card-elevated p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <f.icon className="h-4 w-4 text-primary shrink-0" /> {f.q}
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
