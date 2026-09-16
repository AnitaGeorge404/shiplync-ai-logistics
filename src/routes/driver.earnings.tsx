import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  Download,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useShipments } from "@/lib/api-hooks";
import type { RealShipment } from "@/lib/driver";

// No payroll/earnings table exists yet — earnings are derived from real
// delivered shipments at a flat per-drop rate. Documented simplification,
// see PROGRESS_REPORT.md; wallet withdrawal is still a UI-only demo action.
const PER_DROP_RATE = 80;

export const Route = createFileRoute("/driver/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings — Delivery Partner" },
      { name: "description", content: "Delivery pay ledger and instant wallet withdrawal." },
    ],
  }),
  component: DriverEarningsPage,
});

export interface EarningEntry {
  date: string;
  dropsCount: number;
  total: number;
}

function useEarnings() {
  const { data: assigned = [] } = useShipments("assigned") as { data: RealShipment[] };
  const delivered = assigned.filter((s) => s.status === "delivered" && s.deliveredAt);

  const byDate = new Map<string, number>();
  for (const s of delivered) {
    const key = new Date(s.deliveredAt!).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    byDate.set(key, (byDate.get(key) ?? 0) + 1);
  }

  const earnings: EarningEntry[] = Array.from(byDate.entries()).map(([date, dropsCount]) => ({
    date,
    dropsCount,
    total: dropsCount * PER_DROP_RATE,
  }));

  const todayKey = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const todayEarnings = byDate.get(todayKey) ? byDate.get(todayKey)! * PER_DROP_RATE : 0;
  const total = delivered.length * PER_DROP_RATE;

  return { earnings, todayEarnings, total, deliveredCount: delivered.length };
}

function DriverEarningsPage() {
  const { earnings, todayEarnings, total } = useEarnings();
  const [walletBalance, setWalletBalance] = useState(total);

  const handleCashout = () => {
    if (walletBalance <= 0) return;
    toast.success(`Withdrew ₹${walletBalance.toLocaleString()} to your UPI account.`);
    setWalletBalance(0);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold">Earnings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            ₹{PER_DROP_RATE} per completed drop
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => toast.success("Exported earnings statement")}
        >
          <Download className="h-3.5 w-3.5" /> Statement
        </Button>
      </div>

      <div className="border rounded-xl bg-card p-4 space-y-3">
        <div>
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Wallet balance
          </div>
          <div className="font-display font-bold text-3xl mt-1">
            ₹{walletBalance.toLocaleString()}
          </div>
        </div>
        <Button className="w-full h-11 gap-2" onClick={handleCashout} disabled={walletBalance <= 0}>
          <ArrowUpRight className="h-4 w-4" /> Withdraw to UPI
        </Button>
      </div>

      <div className="grid grid-cols-3 border rounded-lg bg-card divide-x overflow-hidden">
        <div className="px-2.5 py-3 text-center">
          <div className="font-display text-lg font-semibold flex items-center justify-center gap-0.5">
            <IndianRupee className="h-3.5 w-3.5" />
            {todayEarnings.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Today
          </div>
        </div>
        <div className="px-2.5 py-3 text-center">
          <div className="font-display text-lg font-semibold flex items-center justify-center gap-0.5">
            <Calendar className="h-3.5 w-3.5" />
            {total.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            All-time
          </div>
        </div>
        <div className="px-2.5 py-3 text-center">
          <div className="font-display text-lg font-semibold flex items-center justify-center gap-0.5">
            <TrendingUp className="h-3.5 w-3.5" />
            {PER_DROP_RATE}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Per drop
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Daily breakdown
        </div>
        <div className="border rounded-lg bg-card divide-y overflow-hidden">
          {earnings.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No deliveries completed yet.
            </div>
          )}
          {earnings.map((e, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium">{e.date}</div>
                <div className="text-xs text-muted-foreground">
                  {e.dropsCount} drop{e.dropsCount === 1 ? "" : "s"}
                </div>
              </div>
              <div className="font-mono text-sm font-semibold">₹{e.total}</div>
            </div>
          ))}
        </div>
      </div>

      <Link
        to="/driver/performance"
        className="flex items-center justify-between border rounded-lg bg-card px-4 py-3 hover:bg-muted/40"
      >
        <span className="text-sm font-medium">View performance scorecard</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
