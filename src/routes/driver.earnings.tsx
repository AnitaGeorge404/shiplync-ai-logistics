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

const INITIAL_EARNINGS: EarningEntry[] = [
  { date: "Today (Aug 18)", dropsCount: 18, basePay: 1440, surgeBonus: 300, incentives: 100, total: 1840, status: "Pending" },
  { date: "Aug 17, 2026", dropsCount: 24, basePay: 1920, surgeBonus: 400, incentives: 150, total: 2470, status: "Settled" },
  { date: "Aug 16, 2026", dropsCount: 20, basePay: 1600, surgeBonus: 250, incentives: 100, total: 1950, status: "Settled" },
  { date: "Aug 15, 2026", dropsCount: 22, basePay: 1760, surgeBonus: 350, incentives: 200, total: 2310, status: "Settled" },
  { date: "Aug 14, 2026", dropsCount: 19, basePay: 1520, surgeBonus: 200, incentives: 100, total: 1820, status: "Settled" },
];

function DriverEarningsPage() {
  const [earnings] = useState<EarningEntry[]>(INITIAL_EARNINGS);
  const [walletBalance, setWalletBalance] = useState(3240);

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
          <div className="text-2xl font-semibold font-display mt-2">₹1,840</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            This Week <Calendar className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">₹11,420</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Peak Surge Bonus <Sparkles className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">₹1,500</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Monthly Total <TrendingUp className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">₹46,200</div>
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
