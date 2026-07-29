import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, MapPin, Package, CreditCard, Sparkles, ShieldCheck, Zap, Leaf, ArrowRight, Copy } from "lucide-react";

export const Route = createFileRoute("/customer/book")({
  head: () => ({
    meta: [
      { title: "Book a shipment — ShipLync" },
      { name: "description", content: "Book a shipment with AI-optimized routing and instant cost estimation." },
    ],
  }),
  component: BookShipment,
});

const steps = ["Addresses", "Parcel", "Cost", "Confirm"];

function BookShipment() {
  const [step, setStep] = useState(0);
  const [pkg, setPkg] = useState<"standard" | "express" | "medical" | "fragile">("express");
  const [insurance, setInsurance] = useState(true);
  const [weight, setWeight] = useState(2.4);
  const base = pkg === "express" ? 220 : pkg === "medical" ? 480 : pkg === "fragile" ? 180 : 120;
  const cost = Math.round(base + weight * 60 + (insurance ? 45 : 0));
  const tracking = "SLX-" + Math.floor(70000 + Math.random() * 9000) + "-IN";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">New shipment</div>
        <h1 className="font-display text-3xl font-semibold mt-1">Send anything, anywhere.</h1>
      </div>

      <div className="card-elevated p-5">
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-semibold shrink-0 ${
                i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/15 text-primary border border-primary/40" : "bg-muted text-muted-foreground"
              }`}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</div>
              <div className="hidden sm:block text-xs font-medium">{s}</div>
              {i < steps.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-6 space-y-6">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-success" /> Pickup address</div>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <div><Label>Full name</Label><Input defaultValue="Aditi Kapoor" /></div>
                  <div><Label>Phone</Label><Input defaultValue="+91 98••• ••210" /></div>
                  <div className="sm:col-span-2"><Label>Address</Label><Input defaultValue="88 Marine Drive, Mumbai 400002" /></div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-primary" /> Delivery address</div>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <div><Label>Full name</Label><Input placeholder="Recipient name" /></div>
                  <div><Label>Phone</Label><Input placeholder="Recipient phone" /></div>
                  <div className="sm:col-span-2"><Label>Address</Label><Input placeholder="Street, city, PIN" defaultValue="402, Prestige Skyline, Bengaluru 560095" /></div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label>Package type</Label>
                <RadioGroup value={pkg} onValueChange={(v) => setPkg(v as typeof pkg)} className="grid sm:grid-cols-2 gap-3 mt-3">
                  {[
                    { v: "standard", t: "Standard", d: "1–3 day delivery", i: Package },
                    { v: "express", t: "Express", d: "Same/next-day", i: Zap },
                    { v: "medical", t: "Medical / Critical", d: "Priority lane, dedicated rider", i: ShieldCheck },
                    { v: "fragile", t: "Fragile", d: "Handled with care", i: Package },
                  ].map((o) => (
                    <label key={o.v} className={`rounded-xl border p-4 cursor-pointer flex items-start gap-3 transition-colors ${pkg === o.v ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                      <RadioGroupItem value={o.v} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium"><o.i className="h-4 w-4" /> {o.t}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{o.d}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><Label>Weight (kg)</Label><Input type="number" value={weight} onChange={(e) => setWeight(+e.target.value || 0)} step="0.1" /></div>
                <div><Label>Length (cm)</Label><Input placeholder="30" /></div>
                <div><Label>Width × Height</Label><Input placeholder="20 × 15" /></div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Insurance coverage</div>
                  <div className="text-xs text-muted-foreground">Up to ₹50,000 replacement · ₹45</div>
                </div>
                <Switch checked={insurance} onCheckedChange={setInsurance} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border p-5 bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">AI cost estimation</div>
                <div className="mt-1 font-display text-4xl font-semibold">₹{cost}</div>
                <div className="text-xs text-muted-foreground mt-1">Includes AI-optimized routing and CO₂-neutral offset.</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Line l="Base fare" v={`₹${base}`} />
                <Line l={`Weight × ${weight} kg`} v={`₹${Math.round(weight * 60)}`} />
                <Line l="Insurance" v={insurance ? "₹45" : "—"} />
                <Line l="Fuel surcharge" v="Included" muted />
                <Line l="AI route savings" v="− ₹32" pos />
                <Line l="Estimated delivery" v={pkg === "express" ? "Today, 8:15 PM" : "Tomorrow"} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-success/15 grid place-items-center text-success"><Check className="h-6 w-6" /></div>
                <div className="flex-1">
                  <div className="font-display text-xl font-semibold">Shipment booked!</div>
                  <div className="text-sm text-muted-foreground">Driver assignment in progress · notification sent to recipient.</div>
                </div>
              </div>
              <div className="rounded-xl border p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Tracking ID</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="font-mono text-xl font-semibold">{tracking}</div>
                  <Button size="icon" variant="ghost" className="h-8 w-8"><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/customer/track/$id" params={{ id: "SL-8842013" }}>
                  <Button className="gap-1.5">Track live <ArrowRight className="h-4 w-4" /></Button>
                </Link>
                <Link to="/customer"><Button variant="outline">Back to dashboard</Button></Link>
              </div>
            </div>
          )}

          {step < 3 && (
            <div className="flex justify-between pt-2 border-t">
              <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
              <Button onClick={() => setStep(step + 1)} className="gap-1.5">
                {step === 2 ? "Confirm & pay" : "Continue"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" /> AI recommendations</div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>· Best pickup window: <span className="text-foreground font-medium">2:00 – 4:00 PM</span> (low traffic)</li>
              <li>· EV vehicle available for this route (+8% eco score)</li>
              <li>· ETA confidence: <span className="text-foreground font-medium">96%</span></li>
              <li>· Nearest hub: <span className="text-foreground font-medium">BOM-Main (2.1 km)</span></li>
            </ul>
          </div>
          <div className="card-elevated p-5">
            <div className="text-sm font-medium flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment</div>
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                <input type="radio" defaultChecked name="pay" /> UPI · aditi@okhdfc
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                <input type="radio" name="pay" /> Card ending 4242
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                <input type="radio" name="pay" /> Cash on pickup
              </label>
            </div>
          </div>
          <div className="rounded-xl border p-4 bg-success/5">
            <div className="text-xs font-medium text-success flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5" /> Carbon-neutral</div>
            <div className="text-xs text-muted-foreground mt-1">Every ShipLync delivery is offset via verified reforestation partners.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({ l, v, pos, muted }: { l: string; v: string; pos?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-muted-foreground">{l}</span>
      <span className={`font-medium ${pos ? "text-success" : muted ? "text-muted-foreground" : ""}`}>{v}</span>
    </div>
  );
}
