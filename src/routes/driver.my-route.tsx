import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Route as RouteIcon,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/my-route")({
  head: () => ({
    meta: [
      { title: "My Route — Delivery Partner" },
      { name: "description", content: "GPS turn-by-turn route, stop sequence, recipient contact, and one-tap delivery completion." },
    ],
  }),
  component: DriverRoutePage,
});

export interface RouteStop {
  stopNum: number;
  id: string;
  tracking: string;
  recipient: string;
  address: string;
  phone: string;
  type: string;
  medical: boolean;
  eta: string;
  cod: number;
  status: "Completed" | "Next Stop" | "Pending";
}

const INITIAL_STOPS: RouteStop[] = [
  { stopNum: 1, id: "S-1", tracking: "SLX-77420-IN", recipient: "Aditi Kapoor", address: "Flat 402, Koramangala 4th Block", phone: "+91 98765 43210", type: "Medical Priority", medical: true, eta: "Delivered 11:20 AM", cod: 0, status: "Completed" },
  { stopNum: 2, id: "S-2", tracking: "SLX-77421-IN", recipient: "Sunita Rao", address: "Plot 12, HSR Layout Sector 1", phone: "+91 98450 66310", type: "Express", medical: false, eta: "Next (11:45 AM)", cod: 480, status: "Next Stop" },
  { stopNum: 3, id: "S-3", tracking: "SLX-77422-IN", recipient: "Kabir Mehta", address: "House 88, Indiranagar 100ft Rd", phone: "+91 98341 55430", type: "Standard", medical: false, eta: "12:10 PM", cod: 0, status: "Pending" },
  { stopNum: 4, id: "S-4", tracking: "SLX-77423-IN", recipient: "TechCorp Logistics", address: "Building B, Whitefield Tech Park", phone: "+91 98112 44210", type: "Heavy Freight", medical: false, eta: "12:35 PM", cod: 1240, status: "Pending" },
  { stopNum: 5, id: "S-5", tracking: "SLX-77424-IN", recipient: "Vikram S.", address: "Tower 2, Domlur Flyover Rd", phone: "+91 98901 88720", type: "Fragile", medical: false, eta: "01:05 PM", cod: 0, status: "Pending" },
  { stopNum: 6, id: "S-6", tracking: "SLX-77425-IN", recipient: "Deepa Patel", address: "Villa 14, Sarjapur Main Rd", phone: "+91 98771 33290", type: "Standard", medical: false, eta: "01:30 PM", cod: 340, status: "Pending" },
];

function DriverRoutePage() {
  const [stops, setStops] = useState<RouteStop[]>(INITIAL_STOPS);
  const [isPodOpen, setIsPodOpen] = useState(false);
  const [activeStop, setActiveStop] = useState<RouteStop | null>(null);
  const [otpInput, setOtpInput] = useState("");

  const nextStop = stops.find((s) => s.status === "Next Stop") || stops.find((s) => s.status === "Pending");
  const completedCount = stops.filter((s) => s.status === "Completed").length;

  const handleStartNav = (address: string) => {
    toast.success(`Opening Turn-by-Turn GPS Navigation to ${address}...`);
  };

  const handleCall = (recipient: string, phone: string) => {
    toast.info(`Calling ${recipient} (${phone})...`);
  };

  const handleCompletePodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStop) return;

    setStops((prev) =>
      prev.map((s) => {
        if (s.id === activeStop.id) {
          return { ...s, status: "Completed", eta: "Delivered Just now" };
        }
        if (s.stopNum === activeStop.stopNum + 1) {
          return { ...s, status: "Next Stop" };
        }
        return s;
      })
    );

    setIsPodOpen(false);
    setOtpInput("");
    toast.success(`Delivery completed for ${activeStop.recipient}! POD & OTP Verified.`);
  };

  const handleAIReorder = () => {
    toast.info("AI recalculating shortest traffic route...");
    setTimeout(() => {
      toast.success("Route re-sequenced! Saved 3.2 km avoiding Silk Board traffic.");
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Today's Route #BLR-402
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono">
              {completedCount} of {stops.length} STOPS COMPLETED
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Optimized route sequence for EV Van KA-05-EV-2210 · Est Completion 1:30 PM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleAIReorder}
          >
            <Sparkles className="h-3.5 w-3.5" /> Re-optimize Route
          </Button>
        </div>
      </div>

      {/* Next Up Hero Card */}
      {nextStop && (
        <div className="border border-primary/30 rounded-xl p-5 bg-card space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-full bg-foreground text-background grid place-items-center text-xs font-bold font-mono">
                {nextStop.stopNum}
              </span>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  CURRENT DESTINATION
                </span>
                <div className="font-display font-bold text-lg text-foreground leading-tight">
                  {nextStop.recipient}
                </div>
              </div>
            </div>

            <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200">
              ETA {nextStop.eta}
            </Badge>
          </div>

          <div className="text-xs text-foreground bg-muted/30 p-3 rounded-lg flex items-center gap-2">
            <MapPin className="h-4 w-4 text-foreground shrink-0" />
            <span className="font-medium">{nextStop.address}</span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => handleCall(nextStop.recipient, nextStop.phone)}
              >
                <Phone className="h-3.5 w-3.5" /> Call Customer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => handleStartNav(nextStop.address)}
              >
                <Navigation className="h-3.5 w-3.5" /> Start GPS Nav
              </Button>
            </div>

            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => {
                setActiveStop(nextStop);
                setIsPodOpen(true);
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete POD (OTP)
            </Button>
          </div>
        </div>
      )}

      {/* Stop Sequence List */}
      <div className="space-y-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          Route Stop Sequence ({stops.length} Total)
        </h2>

        <div className="space-y-3">
          {stops.map((s) => (
            <div
              key={s.id}
              className={`border rounded-lg p-4 bg-card transition-all ${
                s.status === "Completed"
                  ? "opacity-60 bg-muted/20"
                  : s.status === "Next Stop"
                  ? "border-primary"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex items-start gap-3">
                  <span
                    className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold font-mono shrink-0 ${
                      s.status === "Completed"
                        ? "bg-muted text-muted-foreground"
                        : s.status === "Next Stop"
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {s.stopNum}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{s.recipient}</span>
                      <span className="font-mono text-xs text-muted-foreground">{s.tracking}</span>
                      {s.medical && (
                        <Badge variant="outline" className="text-[9px] bg-red-50 text-red-600 border-red-200">
                          Medical
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.address}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {s.cod > 0 && (
                    <Badge variant="outline" className="text-xs font-mono">
                      Collect ₹{s.cod} COD
                    </Badge>
                  )}
                  <span className="text-xs font-medium text-muted-foreground">{s.eta}</span>

                  {s.status !== "Completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setActiveStop(s);
                        setIsPodOpen(true);
                      }}
                    >
                      Complete POD
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete POD Modal */}
      <Dialog open={isPodOpen} onOpenChange={setIsPodOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Proof of Delivery (POD)</DialogTitle>
            <DialogDescription>
              Verify OTP code provided by {activeStop?.recipient} to finalize delivery.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompletePodSubmit} className="space-y-4 py-2 text-xs">
            <div className="border rounded-md p-3 bg-muted/20 space-y-1">
              <div className="font-medium text-foreground text-sm">{activeStop?.recipient}</div>
              <div className="text-muted-foreground text-xs">{activeStop?.address}</div>
              <div className="font-mono text-xs text-muted-foreground mt-1">
                Tracking ID: {activeStop?.tracking}
              </div>
            </div>

            {activeStop && activeStop.cod > 0 && (
              <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-md text-amber-800 dark:text-amber-200 font-medium">
                Collect Cash on Delivery: ₹{activeStop.cod}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <KeyRound className="h-3.5 w-3.5" /> Enter 4-Digit Customer OTP
              </Label>
              <Input
                type="text"
                maxLength={4}
                placeholder="e.g. 4210"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                required
                className="h-10 text-center font-mono text-lg tracking-widest bg-background"
                autoFocus
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPodOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Verify OTP & Complete POD</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
