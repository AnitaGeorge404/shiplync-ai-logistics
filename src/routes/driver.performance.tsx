import { createFileRoute } from "@tanstack/react-router";
import { drivers } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Star,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Award,
  Sparkles,
  Smile,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/performance")({
  head: () => ({
    meta: [
      { title: "Performance & Rating — Delivery Partner" },
      { name: "description", content: "Driver rating scorecard, SLA compliance rate, customer reviews, and achievement badges." },
    ],
  }),
  component: DriverPerformancePage,
});

function DriverPerformancePage() {
  const driver = drivers[0] || { name: "Ravi Kumar", id: "DRV-102", rating: 4.9, vehicle: "EV Bike" };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Performance Scorecard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track your delivery accuracy, customer ratings, fuel efficiency, and tier rewards.
          </p>
        </div>

        <Badge variant="outline" className="text-xs font-mono gap-1 border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
          <Star className="h-3.5 w-3.5 fill-emerald-600" /> TIER 1 TOP RIDER
        </Badge>
      </div>

      {/* Driver Profile Hero Card */}
      <div className="border rounded-xl p-5 bg-card flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground font-bold text-lg grid place-items-center shrink-0">
            RK
          </div>
          <div>
            <div className="font-display font-bold text-xl text-foreground">{driver.name}</div>
            <div className="text-xs text-muted-foreground font-mono">
              Partner ID: {driver.id} · Vehicle: {driver.vehicle}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold mt-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>4.92 / 5.0 Rating</span>
              <span className="text-muted-foreground font-normal">(812 Total Deliveries)</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs gap-1.5"
          onClick={() => toast.info("Performance report generated")}
        >
          <Award className="h-3.5 w-3.5" /> View Tier Benefits
        </Button>
      </div>

      {/* Scorecard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            On-Time Delivery SLA <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">98.6%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Top 5% of fleet</div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Customer Satisfaction <Smile className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">99.1%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Positive Feedback</div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            EV Efficiency <Zap className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">14.2 km/kWh</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Optimal Battery Use</div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Medical Priority Compliance <ShieldCheck className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">100%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Zero Temp Breaches</div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="space-y-3 pt-2">
        <h2 className="font-display text-base font-semibold text-foreground">
          Recent Customer Feedback
        </h2>

        <div className="space-y-3">
          {[
            { name: "Aditi K.", text: "Super polite delivery partner! Reached 15 minutes before estimated time and verified OTP quickly.", date: "Today, 11:22 AM" },
            { name: "Sunita R.", text: "Careful handling of cold-chain vaccine box. Very professional service.", date: "Yesterday, 4:10 PM" },
            { name: "Kabir M.", text: "Great communication via WhatsApp before arriving.", date: "Aug 16, 2026" },
          ].map((rev, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-card space-y-1">
              <div className="flex items-center justify-between">
                <div className="font-medium text-xs text-foreground flex items-center gap-1.5">
                  <span>{rev.name}</span>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{rev.date}</span>
              </div>
              <p className="text-xs text-muted-foreground">{rev.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
