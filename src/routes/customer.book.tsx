import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, MapPin, Package, CreditCard, Lightbulb, ShieldCheck, Zap, Leaf, ArrowRight, Copy, Route as RouteIcon, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { calculateShipmentCost, estimateDeliveryHours } from "@/lib/pricing";
import { calculateDistance, getRouteDistanceDetails } from "@/lib/distance";
import { getShipmentRecommendations } from "@/lib/recommendations";
import { partySchema, packageSchema, validateToFieldErrors } from "@/lib/validation";
import { useAddresses } from "@/lib/api-hooks";
import { lookupPincode } from "@/lib/pincode";

export const Route = createFileRoute("/customer/book")({
  head: () => ({
    meta: [
      { title: "Book a shipment — ShipLync" },
      { name: "description", content: "Book a shipment with real distance-based delivery estimates." },
    ],
  }),
  component: BookShipment,
});

const steps = ["Addresses", "Package", "Service", "Review"];

type Party = {
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
};

const EMPTY_PARTY: Party = { name: "", phone: "", addressLine: "", city: "", state: "", pincode: "" };

function BookShipment() {
  const { user, isAuthenticated } = useAuth();
  const { data: savedAddresses = [] } = useAddresses();
  const [step, setStep] = useState(0);

  const [sender, setSender] = useState<Party>(EMPTY_PARTY);
  const [receiver, setReceiver] = useState<Party>(EMPTY_PARTY);
  const [senderErrors, setSenderErrors] = useState<Record<string, string>>({});
  const [receiverErrors, setReceiverErrors] = useState<Record<string, string>>({});

  const [pkg, setPkg] = useState<"standard" | "express" | "medical" | "fragile">("standard");
  const [insurance, setInsurance] = useState(false);
  const [elderlyCare, setElderlyCare] = useState(false);
  const [pickupDate, setPickupDate] = useState("");
  const [floorCount, setFloorCount] = useState("");
  const [hasSecurityCheckpoint, setHasSecurityCheckpoint] = useState(false);
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [packageErrors, setPackageErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [booked, setBooked] = useState<{ trackingId: string; cost: number; id: string } | null>(null);

  // Priority is auto-escalated for medical packages and elderly-care
  // recipients (REQ-2.4), same rule the server enforces — the preview
  // always matches what actually gets booked.
  const priority = pkg === "medical" || elderlyCare ? "high" : "normal";

  const weightNum = parseFloat(weight) || 0;
  const lengthNum = parseFloat(length) || 0;
  const widthNum = parseFloat(width) || 0;
  const heightNum = parseFloat(height) || 0;

  const cost = calculateShipmentCost({
    weightKg: weightNum,
    packageType: pkg,
    priority,
    insured: insurance,
    declaredValue: insurance ? 50000 : undefined,
  });

  // Real distance + ETA — same functions the server uses at booking time,
  // recalculated live as the sender/receiver/package fields change.
  const routeDetails = useMemo(() => {
    if (!sender.city || !receiver.city) {
      return {
        distanceKm: 0,
        directDistanceKm: 0,
        routingOverheadKm: 0,
        routingOverheadPct: 0,
        isLocal: false,
      };
    }
    return getRouteDistanceDetails(
      {
        city: sender.city,
        state: sender.state,
        pincode: sender.pincode,
        addressLine: sender.addressLine,
      },
      {
        city: receiver.city,
        state: receiver.state,
        pincode: receiver.pincode,
        addressLine: receiver.addressLine,
      },
    );
  }, [
    sender.city,
    sender.state,
    sender.pincode,
    sender.addressLine,
    receiver.city,
    receiver.state,
    receiver.pincode,
    receiver.addressLine,
  ]);

  const distanceKm = routeDetails.distanceKm;
  const directDistanceKm = routeDetails.directDistanceKm;
  const routeSavingsKm = routeDetails.routingOverheadKm;
  const routeSavingsPct = routeDetails.routingOverheadPct;

  const floorCountNum = Math.max(parseInt(floorCount, 10) || 0, 0);
  const etaHours = estimateDeliveryHours({
    priority,
    packageType: pkg,
    distanceKm,
    receiverFloorCount: floorCountNum,
    receiverHasSecurityCheckpoint: hasSecurityCheckpoint,
  });
  const etaDays = Math.round((etaHours / 24) * 10) / 10;

  const formatKm = (km: number) => {
    if (km <= 0) return "0 Km";
    if (km < 10) return `${km.toFixed(1)} Km`;
    return `${Math.round(km)} Km`;
  };

  const recommendations = useMemo(
    () =>
      getShipmentRecommendations({
        packageType: pkg,
        priority,
        weightKg: weightNum,
        lengthCm: lengthNum,
        widthCm: widthNum,
        heightCm: heightNum,
        distanceKm,
        estimatedHours: etaHours,
      }),
    [pkg, priority, weightNum, lengthNum, widthNum, heightNum, distanceKm, etaHours],
  );

  function applySavedAddress(target: "sender" | "receiver", addressId: string) {
    const addr = savedAddresses.find((a: any) => a.id === addressId);
    if (!addr) return;
    const party: Party = {
      name: addr.contactName,
      phone: addr.contactPhone,
      addressLine: addr.line2 ? `${addr.line1}, ${addr.line2}` : addr.line1,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    };
    if (target === "sender") setSender(party);
    else setReceiver(party);
  }

  function validateStep0(): boolean {
    const sErr = validateToFieldErrors(partySchema, sender);
    const rErr = validateToFieldErrors(partySchema, receiver);
    setSenderErrors(sErr);
    setReceiverErrors(rErr);
    return Object.keys(sErr).length === 0 && Object.keys(rErr).length === 0;
  }

  function validateStep1(): boolean {
    const data = { packageType: pkg, weightKg: weightNum, lengthCm: lengthNum, widthCm: widthNum, heightCm: heightNum };
    const errs = validateToFieldErrors(packageSchema, data);
    setPackageErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleContinue() {
    if (step === 0) {
      if (!validateStep0()) return;
    }
    if (step === 1) {
      if (!validateStep1()) return;
    }
    if (step === 2) {
      confirmAndPay();
      return;
    }
    setStep(step + 1);
  }

  async function confirmAndPay() {
    if (!validateStep0() || !validateStep1()) {
      setStep(0);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          senderName: sender.name,
          senderPhone: sender.phone,
          senderAddressLine: sender.addressLine,
          senderCity: sender.city,
          senderState: sender.state,
          senderPincode: sender.pincode,
          receiverName: receiver.name,
          receiverPhone: receiver.phone,
          receiverAddressLine: receiver.addressLine,
          receiverCity: receiver.city,
          receiverState: receiver.state,
          receiverPincode: receiver.pincode,
          weightKg: weightNum,
          lengthCm: lengthNum,
          widthCm: widthNum,
          heightCm: heightNum,
          packageType: pkg,
          priority,
          insured: insurance,
          declaredValue: insurance ? 50000 : undefined,
          elderlyCare,
          pickupDate: pickupDate ? new Date(pickupDate).toISOString() : undefined,
          receiverFloorCount: floorCountNum,
          receiverHasSecurityCheckpoint: hasSecurityCheckpoint,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Could not create shipment.");
        setSubmitting(false);
        return;
      }
      setBooked({
        trackingId: data.shipment.trackingId,
        cost: data.shipment.cost,
        id: data.shipment.id,
      });
      setStep(3);
    } catch {
      setSubmitError("Network error — is the server running?");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-6 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">New shipment</div>
          <h1 className="font-display text-3xl font-semibold mt-1">Book a Shipment</h1>
        </div>
        <div className="card-elevated p-6 sm:p-8">
          <LoginForm
            title="Sign in to continue"
            subtitle="Please sign in or create an account to book your shipment and track deliveries."
            compact
          />
        </div>
      </div>
    );
  }

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

      <div className={step === 3 ? "max-w-2xl mx-auto" : "grid lg:grid-cols-3 gap-6"}>
        <div className={step === 3 ? "card-elevated p-6 space-y-6" : "lg:col-span-2 card-elevated p-6 space-y-6"}>
          {step === 0 && (
            <div className="space-y-6">
              <PartyForm
                icon={<MapPin className="h-4 w-4 text-success" />}
                title="Pickup address"
                value={sender}
                onChange={setSender}
                errors={senderErrors}
                savedAddresses={savedAddresses}
                onSelectSaved={(id) => applySavedAddress("sender", id)}
              />
              <PartyForm
                icon={<MapPin className="h-4 w-4 text-primary" />}
                title="Delivery address"
                value={receiver}
                onChange={setReceiver}
                errors={receiverErrors}
                savedAddresses={savedAddresses}
                onSelectSaved={(id) => applySavedAddress("receiver", id)}
              />
              <div className="rounded-xl border p-4 space-y-3">
                <div className="text-sm font-medium">Delivery access details</div>
                <div className="text-xs text-muted-foreground -mt-2">
                  These change the ETA — real last-mile time, not a rough guess.
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field
                    label="Floors to climb (no lift)"
                    value={floorCount}
                    onChange={setFloorCount}
                    type="number"
                    placeholder="0"
                  />
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="text-xs font-medium">Building has a security checkpoint</div>
                    <Switch checked={hasSecurityCheckpoint} onCheckedChange={setHasSecurityCheckpoint} />
                  </div>
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
                    { v: "standard", t: "Standard", d: "Normal handling", i: Package },
                    { v: "express", t: "Express", d: "Faster network tier", i: Zap },
                    { v: "medical", t: "Medical / Critical", d: "Priority lane, fastest routing", i: ShieldCheck },
                    { v: "fragile", t: "Fragile", d: "Extra careful handling", i: Package },
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
              <div className="grid sm:grid-cols-4 gap-3">
                <Field label="Weight (kg)" value={weight} onChange={setWeight} error={packageErrors.weightKg} type="number" placeholder="2.5" />
                <Field label="Length (cm)" value={length} onChange={setLength} error={packageErrors.lengthCm} type="number" placeholder="30" />
                <Field label="Width (cm)" value={width} onChange={setWidth} error={packageErrors.widthCm} type="number" placeholder="20" />
                <Field label="Height (cm)" value={height} onChange={setHeight} error={packageErrors.heightCm} type="number" placeholder="15" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Insurance coverage</div>
                  <div className="text-xs text-muted-foreground">Up to ₹50,000 replacement · 1.5% of declared value</div>
                </div>
                <Switch checked={insurance} onCheckedChange={setInsurance} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Elderly care recipient</div>
                  <div className="text-xs text-muted-foreground">Recipient is elderly or needs priority delivery — gets the same fast-lane routing as medical shipments</div>
                </div>
                <Switch checked={elderlyCare} onCheckedChange={setElderlyCare} />
              </div>
              <div className="rounded-lg border p-3">
                <Label htmlFor="pickup-date" className="text-sm font-medium">Requested pickup date (optional)</Label>
                <Input
                  id="pickup-date"
                  type="date"
                  className="mt-2"
                  min={new Date().toISOString().slice(0, 10)}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border p-5 bg-muted/40">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Cost estimate</div>
                <div className="mt-1 font-display text-4xl font-semibold">₹{cost}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Computed by the same deterministic pricing engine used at booking — this is the real amount you'll be charged.
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Line l="Route" v={`${sender.city} → ${receiver.city}`} />
                <Line l="Distance (est.)" v={formatKm(distanceKm)} />
                <Line l="Package type" v={pkg} />
                <Line l="Weight" v={`${weightNum} kg`} />
                <Line l="Dimensions" v={`${lengthNum} × ${widthNum} × ${heightNum} cm`} />
                <Line l="Insurance" v={insurance ? "Included" : "Not selected"} />
                <Line
                  l="Estimated delivery"
                  v={
                    etaHours <= 12
                      ? `~${etaHours}h (Same day)`
                      : etaDays >= 1
                      ? `~${etaDays} day${etaDays === 1 ? "" : "s"}`
                      : `~${etaHours}h`
                  }
                  pos
                />
              </div>

              <div className="rounded-xl border p-5">
                <div className="flex items-center gap-2 text-sm font-medium"><RouteIcon className="h-4 w-4 text-primary" /> Route optimization</div>
                <div className="mt-3 grid sm:grid-cols-3 gap-3 text-xs">
                  <Line l="Direct distance" v={formatKm(directDistanceKm)} muted />
                  <Line l="Road-network route" v={formatKm(distanceKm)} muted />
                  <Line l="Routing overhead" v={`+${formatKm(routeSavingsKm)} (${routeSavingsPct}%)`} muted />
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  {routeDetails.isLocal
                    ? "Hyper-local / intra-city route calculated with neighborhood road navigation and direct door-to-door dispatch."
                    : "Calculated from real origin/destination coordinates, not a placeholder figure — the road-network estimate above (used for your delivery ETA) always includes realistic routing overhead over the straight-line distance."}
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-success/15 grid place-items-center text-success"><Check className="h-6 w-6" /></div>
                <div className="flex-1">
                  <div className="font-display text-xl font-semibold">Shipment booked!</div>
                  <div className="text-sm text-muted-foreground">Your shipment is booked and will be processed at the origin hub next.</div>
                </div>
              </div>
              <div className="rounded-xl border p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Tracking ID</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="font-mono text-xl font-semibold">{booked?.trackingId}</div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      if (booked?.trackingId) navigator.clipboard?.writeText(booked.trackingId);
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/customer/track/$id" params={{ id: booked?.trackingId ?? "" }}>
                  <Button className="gap-1.5">Track live <ArrowRight className="h-4 w-4" /></Button>
                </Link>
                <Link to="/customer"><Button variant="outline">Back to dashboard</Button></Link>
              </div>
            </div>
          )}

          {submitError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
              {submitError}
            </div>
          )}

          {step < 3 && (
            <div className="flex justify-between pt-2 border-t">
              <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
              <Button onClick={handleContinue} disabled={submitting} className="gap-1.5">
                {step === 2 ? (submitting ? "Booking..." : "Confirm & pay") : "Continue"}{" "}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {step !== 3 && (
          <div className="space-y-4">
            <div className="card-elevated p-5">
              <div className="flex items-center gap-2 text-sm font-medium"><Lightbulb className="h-4 w-4 text-primary" /> Recommendations</div>
              <ul className="mt-3 space-y-3 text-xs">
                {recommendations.map((r) => (
                  <li key={r.title}>
                    <div className="text-foreground font-medium">{r.title}</div>
                    <div className="text-muted-foreground mt-0.5">{r.detail}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-elevated p-5">
              <div className="text-sm font-medium flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment</div>
              <div className="mt-3 space-y-2 text-sm">
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <input type="radio" defaultChecked name="pay" /> UPI
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <input type="radio" name="pay" /> Card
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <input type="radio" name="pay" /> Cash on pickup
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                No payment gateway is connected in this build — the shipment is recorded as paid without an actual charge.
              </p>
            </div>
            <div className="rounded-xl border p-4 bg-success/5">
              <div className="text-xs font-medium text-success flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5" /> Carbon-neutral</div>
              <div className="text-xs text-muted-foreground mt-1">Every ShipLync delivery is offset via verified reforestation partners.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PartyForm({
  icon,
  title,
  value,
  onChange,
  errors,
  savedAddresses,
  onSelectSaved,
}: {
  icon: React.ReactNode;
  title: string;
  value: Party;
  onChange: (p: Party) => void;
  errors: Record<string, string>;
  savedAddresses: any[];
  onSelectSaved: (id: string) => void;
}) {
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [pincodeFeedback, setPincodeFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [localities, setLocalities] = useState<string[]>([]);

  function set<K extends keyof Party>(key: K, v: string) {
    onChange({ ...value, [key]: v });
  }

  async function handlePincodeChange(raw: string) {
    const formatted = raw.replace(/\D/g, "").slice(0, 6);
    const updated = { ...value, pincode: formatted };

    if (formatted.length === 6 && /^[1-9]\d{5}$/.test(formatted)) {
      setIsLookingUpPincode(true);
      setPincodeFeedback(null);
      try {
        const result = await lookupPincode(formatted);
        if (result && result.city && result.state) {
          updated.city = result.city;
          updated.state = result.state;
          setPincodeFeedback({
            type: "success",
            message: `Auto-filled: ${result.city}, ${result.state}`,
          });
          if (result.places && result.places.length > 1) {
            setLocalities(result.places.slice(0, 8));
          } else {
            setLocalities([]);
          }
        } else {
          setPincodeFeedback({
            type: "info",
            message: "PIN code not found in postal directory. Please enter city & state manually.",
          });
          setLocalities([]);
        }
      } catch {
        setPincodeFeedback(null);
      } finally {
        setIsLookingUpPincode(false);
      }
    } else {
      setPincodeFeedback(null);
      setLocalities([]);
    }

    onChange(updated);
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">{icon} {title}</div>
        {savedAddresses.length > 0 && (
          <Select onValueChange={onSelectSaved}>
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue placeholder="Use saved address" />
            </SelectTrigger>
            <SelectContent>
              {savedAddresses.map((a: any) => (
                <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <Field label="Full name" value={value.name} onChange={(v) => set("name", v)} error={errors.name} />
        <Field label="Phone" value={value.phone} onChange={(v) => set("phone", v)} error={errors.phone} placeholder="9876543210" />
        <div className="sm:col-span-2">
          <Field label="Address" value={value.addressLine} onChange={(v) => set("addressLine", v)} error={errors.addressLine} />
        </div>
        <Field label="City" value={value.city} onChange={(v) => set("city", v)} error={errors.city} />
        <Field label="State" value={value.state} onChange={(v) => set("state", v)} error={errors.state} />
        <Field
          label="PIN code"
          value={value.pincode}
          onChange={handlePincodeChange}
          error={errors.pincode}
          placeholder="400002"
          maxLength={6}
          rightElement={
            isLookingUpPincode ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : pincodeFeedback?.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : null
          }
          helperText={
            pincodeFeedback ? (
              <div
                className={`text-[11px] mt-1 flex items-center gap-1 ${
                  pincodeFeedback.type === "success"
                    ? "text-emerald-600 font-medium"
                    : pincodeFeedback.type === "error"
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {pincodeFeedback.type === "success" && <Sparkles className="h-3 w-3 shrink-0" />}
                <span>{pincodeFeedback.message}</span>
              </div>
            ) : isLookingUpPincode ? (
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                <span>Fetching City & State from postal directory...</span>
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Enter 6-digit PIN to auto-fetch City & State
              </span>
            )
          }
        />
      </div>

      {localities.length > 0 && (
        <div className="mt-3 text-xs bg-muted/40 rounded-lg p-2.5 border space-y-1.5 animate-in fade-in-50 duration-200">
          <span className="text-[11px] text-muted-foreground font-medium">
            Localities under PIN {value.pincode} (click to set City):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {localities.map((place) => (
              <button
                key={place}
                type="button"
                onClick={() => set("city", place)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                  value.city.toLowerCase() === place.toLowerCase()
                    ? "bg-primary text-primary-foreground border-primary font-medium"
                    : "bg-background hover:bg-muted text-foreground"
                }`}
              >
                {place}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  rightElement,
  helperText,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  rightElement?: React.ReactNode;
  helperText?: React.ReactNode;
  maxLength?: number;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="relative mt-1">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`${error ? "border-destructive focus-visible:ring-destructive" : ""} ${rightElement ? "pr-9" : ""}`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            {rightElement}
          </div>
        )}
      </div>
      {error && <div className="text-[11px] text-destructive mt-1">{error}</div>}
      {helperText}
    </div>
  );
}

function Line({ l, v, pos, muted }: { l: string; v: string; pos?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-muted-foreground">{l}</span>
      <span className={`font-medium capitalize ${pos ? "text-success" : muted ? "text-muted-foreground" : ""}`}>{v}</span>
    </div>
  );
}
