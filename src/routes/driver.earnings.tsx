import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Wallet,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Download,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useShipments } from "@/lib/api-hooks";

// No payroll/earnings table exists yet — earnings are derived from real
// delivered shipments at a flat per-drop rate. Documented simplification,
// see PROGRESS_REPORT.md; wallet withdrawal is still a UI-only demo action.
const PER_DROP_RATE = 80;

export const Route = createFileRoute("/driver/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings & Wallet — Delivery Partner" },
      { name: "description", content: "Driver earnings ledger, trip bonuses, instant cashout, and weekly payout history." },
    ],
  }),
  component: DriverEarningsPage,
});

export interface EarningEntry {
  date: string;
  dropsCount: number;
  basePay: number;
  surgeBonus: number;
  incentives: number;
  total: number;
  status: "Settled" | "Pending";
}

function useEarnings() {
  const { data: assigned = [] } = useShipments("assigned");
  const delivered = assigned.filter((s: any) => s.status === "delivered" && s.deliveredAt);

  const byDate = new Map<string, number>();
  for (const s of delivered) {
    const key = new Date(s.deliveredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    byDate.set(key, (byDate.get(key) ?? 0) + 1);
  }

  const earnings: EarningEntry[] = Array.from(byDate.entries()).map(([date, dropsCount]) => ({
    date,
    dropsCount,
    basePay: dropsCount * PER_DROP_RATE,
    surgeBonus: 0,
    incentives: 0,
    total: dropsCount * PER_DROP_RATE,
    status: "Settled" as const,
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
    toast.success(`Withdrew ₹${walletBalance.toLocaleString()} to your UPI account! Transfer instant.`);
    setWalletBalance(0);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Earnings & Wallet Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track daily drop pay, peak surge bonuses, tips, and instant wallet withdrawals.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs gap-1.5"
          onClick={() => toast.success("Exported earnings statement")}
        >
          <Download className="h-3.5 w-3.5" /> Statement PDF
        </Button>
      </div>

      {/* Wallet Balance Hero Banner */}
      <div className="border rounded-xl p-5 bg-card flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <Wallet className="h-4 w-4" /> Available Wallet Balance
          </div>
          <div className="font-display font-bold text-3xl text-foreground mt-1">
            ₹{walletBalance.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">
            Instant UPI Transfer Available 24/7
          </div>
        </div>

        <Button
          size="sm"
          className="h-10 text-xs gap-2 px-5"
          onClick={handleCashout}
          disabled={walletBalance <= 0}
        >
          <ArrowUpRight className="h-4 w-4" /> Withdraw to UPI
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Today's Earnings <IndianRupee className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">₹{todayEarnings.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            All-time Total <Calendar className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">₹{total.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Peak Surge Bonus <Sparkles className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">₹0</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Per-drop Rate <TrendingUp className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">₹{PER_DROP_RATE}</div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="space-y-3 pt-2">
        <h2 className="font-display text-base font-semibold text-foreground">
          Daily Earnings Breakdown
        </h2>

        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Date & Shift</TableHead>
                <TableHead className="text-xs font-medium">Drops</TableHead>
                <TableHead className="text-xs font-medium">Base Drop Pay</TableHead>
                <TableHead className="text-xs font-medium">Surge Bonus</TableHead>
                <TableHead className="text-xs font-medium">Incentives</TableHead>
                <TableHead className="text-xs font-medium">Total Earning</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                    No deliveries completed yet.
                  </TableCell>
                </TableRow>
              )}
              {earnings.map((e, i) => (
                <TableRow key={i} className="text-xs hover:bg-muted/30">
                  <TableCell className="py-3 font-medium text-foreground text-xs">
                    {e.date}
                  </TableCell>

                  <TableCell className="font-semibold text-foreground text-xs">
                    {e.dropsCount} drops
                  </TableCell>

                  <TableCell className="font-mono text-xs text-muted-foreground">
                    ₹{e.basePay}
                  </TableCell>

                  <TableCell className="font-mono text-xs text-emerald-600 font-medium">
                    +₹{e.surgeBonus}
                  </TableCell>

                  <TableCell className="font-mono text-xs text-muted-foreground">
                    +₹{e.incentives}
                  </TableCell>

                  <TableCell className="font-mono font-bold text-foreground text-xs">
                    ₹{e.total}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20">
                      {e.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
