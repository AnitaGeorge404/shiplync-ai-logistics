import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { shipments, timeline, type Shipment } from "@/lib/mock-data";
import { StatusBadge } from "@/components/shiplync/StatusBadge";
import { RouteMap } from "@/components/shiplync/RouteMap";
import { Timeline } from "@/components/shiplync/Timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MapPin,
  Sparkles,
  ShieldCheck,
  Phone,
  MessageSquare,
  Share2,
  BellRing,
  Truck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Navigation,
  Check,
  SlidersHorizontal,
  Package,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/track/")({
  head: () => ({
    meta: [
      { title: "Track Shipment — ShipLync AI Logistics" },
      { name: "description", content: "Real-time parcel tracking with live map updates, driver location, and AI ETAs." },
    ],
  }),
  component: TrackIndexPage,
});

function TrackIndexPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<Shipment>(shipments[0]);
  const [activeTab, setActiveTab] = useState<"tracking" | "phone">("tracking");
  const [instructions, setInstructions] = useState<{ [key: string]: boolean }>({
    doorstep: false,
    call: true,
    gate: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const match = shipments.find(
      (s) =>
        s.tracking.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    if (match) {
      setSelectedShipment(match);
      toast.success(`Found shipment ${match.tracking}`);
    } else {
      toast.error("No shipment found matching that ID. Showing demo parcel.");
    }
  };

  const selectParcel = (s: Shipment) => {
    setSelectedShipment(s);
    setSearchQuery(s.tracking);
  };

  const toggleInstruction = (key: string) => {
    setInstructions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      toast.success(
        next[key] ? "Delivery instruction updated!" : "Instruction removed."
      );
      return next;
    });
  };

  const events = timeline(selectedShipment);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Live Tracking Hub
        </div>
        <h1 className="font-display text-3xl font-semibold mt-1">
          Track Your Deliveries
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Real-time GPS coordinates, AI-calculated ETA, hub checkpoints, and direct courier communication.
        </p>
      </div>

      {/* Search Bar & Quick Chips */}
      <div className="card-elevated p-6 space-y-4 bg-card">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 max-w-xs mb-4">
            <TabsTrigger value="tracking" className="text-xs">
              Tracking ID / Code
            </TabsTrigger>
            <TabsTrigger value="phone" className="text-xs">
              Mobile Number
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracking">
            <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter Tracking ID (e.g. SLX-77420-IN or SL-8842013)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-background font-mono text-sm"
                />
              </div>
              <Button type="submit" className="h-11 px-6 gap-2">
                Track Parcel <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone">
            <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
              <div className="relative flex-1">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter 10-digit mobile number (+91 98765 43210)"
                  defaultValue="+91 98765 43210"
                  className="pl-10 h-11 bg-background text-sm"
                />
              </div>
              <Button type="submit" className="h-11 px-6 gap-2">
                Find Shipments <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-muted-foreground font-medium">Quick select:</span>
          {shipments.map((s) => (
            <button
              key={s.id}
              onClick={() => selectParcel(s)}
              className={`px-3 py-1 rounded-full border text-xs font-mono transition-all ${
                selectedShipment.id === s.id
                  ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm"
                  : "bg-background hover:bg-muted text-muted-foreground"
              }`}
            >
              {s.tracking} ({s.fromCity} → {s.toCity})
            </button>
          ))}
        </div>
      </div>

      {/* Active Parcel Carousel / Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Active Deliveries ({shipments.length})
          </h2>
          <span className="text-xs text-muted-foreground">Select any parcel to view live map</span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {shipments.slice(0, 3).map((s) => (
            <div
              key={s.id}
              onClick={() => selectParcel(s)}
              className={`card-elevated p-4 cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden ${
                selectedShipment.id === s.id
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-muted-foreground">{s.tracking}</span>
                <StatusBadge status={s.status} />
              </div>
              <div className="font-display font-semibold text-base">
                {s.fromCity} → {s.toCity}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>{s.packageType}</span>
                <span>·</span>
                <span>{s.weight} kg</span>
                {s.medical && (
                  <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
                    Medical
                  </Badge>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-4 space-y-1">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                  <span>Progress: {s.progress}%</span>
                  <span className="font-medium text-foreground">{s.eta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Selected Parcel Tracking Dashboard */}
      <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {selectedShipment.tracking}
              </span>
              <StatusBadge status={selectedShipment.status} />
              {selectedShipment.medical && (
                <span className="inline-flex items-center gap-1 rounded-full bg-medical/10 text-medical border border-medical/20 text-[11px] font-medium px-2.5 py-0.5">
                  <ShieldCheck className="h-3 w-3" /> Medical Priority
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl font-semibold mt-1">
              {selectedShipment.from} → {selectedShipment.to}
            </h2>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success("Tracking link copied to clipboard!");
              }}
            >
              <Share2 className="h-3.5 w-3.5" /> Share Track Link
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() =>
                navigate({
                  to: "/customer/track/$id",
                  params: { id: selectedShipment.id },
                })
              }
            >
              Full Screen Map <Navigation className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Live Map & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Live GPS Route Map
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
                </span>
              </div>
              <RouteMap
                from={selectedShipment.fromCity}
                to={selectedShipment.toCity}
                progress={selectedShipment.progress}
                className="h-96 rounded-xl border shadow-sm"
              />
            </div>

            {/* Fact Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="card-elevated p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Estimated Arrival
                </div>
                <div className="text-sm font-semibold mt-1 text-primary">
                  {selectedShipment.eta}
                </div>
              </div>
              <div className="card-elevated p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Current Hub
                </div>
                <div className="text-sm font-semibold mt-1">
                  {selectedShipment.hub || "In Transit"}
                </div>
              </div>
              <div className="card-elevated p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Package Weight
                </div>
                <div className="text-sm font-semibold mt-1">
                  {selectedShipment.weight} kg ({selectedShipment.packageType})
                </div>
              </div>
              <div className="card-elevated p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Eco Score
                </div>
                <div className="text-sm font-semibold mt-1 text-emerald-600">
                  {selectedShipment.sustainability}% CO₂ Offset
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card-elevated p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-display font-semibold text-base">
                    Shipment Journey Timeline
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Real-time status events logged by AI Coordinator
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Auto-Verified
                </Badge>
              </div>
              <Timeline events={events} />
            </div>
          </div>

          {/* Right Column: Driver, Instructions, AI Insights */}
          <div className="space-y-5">
            {/* Courier / Driver Card */}
            {selectedShipment.driver ? (
              <div className="card-elevated p-5 space-y-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Assigned Courier Partner
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-semibold text-base shadow-sm">
                    {selectedShipment.driver
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="font-medium text-base">
                      {selectedShipment.driver}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ★ 4.92 Rating · 1,240 deliveries completed
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg border font-mono">
                  {selectedShipment.vehicle}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => toast.info(`Calling driver at ${selectedShipment.driverPhone}`)}
                  >
                    <Phone className="h-3.5 w-3.5" /> Call Rider
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => toast.info("Opening direct live chat with driver...")}
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </Button>
                </div>
              </div>
            ) : (
              <div className="card-elevated p-5 text-center space-y-2">
                <Truck className="h-8 w-8 text-primary mx-auto opacity-80" />
                <div className="font-medium text-sm">Assigning Courier Partner</div>
                <p className="text-xs text-muted-foreground">
                  AI dispatching nearest driver from {selectedShipment.hub || selectedShipment.fromCity}.
                </p>
              </div>
            )}

            {/* Delivery Instructions Preferences */}
            <div className="card-elevated p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Delivery Preferences
                </div>
                <span className="text-[10px] text-muted-foreground">Live Sync</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Set custom instructions for the driver before arrival:
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => toggleInstruction("call")}
                  className={`w-full p-3 rounded-lg border text-left text-xs flex items-center justify-between transition-colors ${
                    instructions.call
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span>Call 10 minutes before reaching</span>
                  {instructions.call ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="text-[10px] border px-1.5 py-0.5 rounded">Off</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toggleInstruction("doorstep")}
                  className={`w-full p-3 rounded-lg border text-left text-xs flex items-center justify-between transition-colors ${
                    instructions.doorstep
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span>Leave parcel at front door / security guard</span>
                  {instructions.doorstep ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="text-[10px] border px-1.5 py-0.5 rounded">Off</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toggleInstruction("gate")}
                  className={`w-full p-3 rounded-lg border text-left text-xs flex items-center justify-between transition-colors ${
                    instructions.gate
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span>Gate passcode / OTP required on delivery</span>
                  {instructions.gate ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="text-[10px] border px-1.5 py-0.5 rounded">Off</span>
                  )}
                </button>
              </div>
            </div>

            {/* AI ETA Breakdown */}
            <div className="card-elevated p-5 bg-muted/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Sparkles className="h-4 w-4" /> AI ETA Prediction Diagnostics
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Traffic factor</span>
                  <span className="font-medium">+4 min (Moderate)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weather delay</span>
                  <span className="font-medium text-emerald-600">None (Clear sky)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hub sorting speed</span>
                  <span className="font-medium text-emerald-600">Optimal (98%)</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-1">
                  <span className="font-medium">ETA Confidence</span>
                  <span className="font-semibold text-primary">97.8% High</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
