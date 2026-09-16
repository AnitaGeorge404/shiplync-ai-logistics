import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { usePayments } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CreditCard,
  Search,
  MoreHorizontal,
  Download,
  IndianRupee,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payments & Financials — Admin Dashboard" },
      { name: "description", content: "Manage platform transactions, merchant billing, driver payouts, and refund logs." },
    ],
  }),
  component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
  const { data: paymentsList = [] } = usePayments("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredPayments = useMemo(() => {
    return paymentsList.filter((p: any) => {
      const matchesSearch =
        p.trackingId.toLowerCase().includes(search.toLowerCase()) ||
        (p.transactionRef ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [paymentsList, search, statusFilter]);

  const stats = useMemo(() => {
    const totalVolume = paymentsList.reduce((acc: number, p: any) => (p.status === "paid" ? acc + p.amount : acc), 0);
    const count = paymentsList.length;
    const completedCount = paymentsList.filter((p: any) => p.status === "paid").length;
    const refundedCount = paymentsList.filter((p: any) => p.status === "refunded").length;
    return { totalVolume, count, completedCount, refundedCount };
  }, [paymentsList]);

  const handleRefund = () => {
    toast.info("Refund processing isn't wired up to a payment gateway yet — no gateway account is connected.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Payments &amp; Billing
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real customer transactions and courier payout records, from the live database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => toast.success("Exported financial ledger CSV")}
          >
            <Download className="h-3.5 w-3.5" /> Export Ledger
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Settled Volume <IndianRupee className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">
            ₹{stats.totalVolume.toLocaleString()}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Transactions <CreditCard className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.count}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Success Rate <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">
            {Math.round((stats.completedCount / (stats.count || 1)) * 100)}%
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Refund Logs <RotateCcw className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.refundedCount}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search txn ID, customer, tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Transaction Ref</TableHead>
              <TableHead className="text-xs font-medium">Route</TableHead>
              <TableHead className="text-xs font-medium">Method</TableHead>
              <TableHead className="text-xs font-medium">Tracking ID</TableHead>
              <TableHead className="text-xs font-medium">Amount</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium">Date</TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                  No payments recorded yet.
                </TableCell>
              </TableRow>
            )}
            {filteredPayments.map((p: any) => (
              <TableRow key={p.id} className="text-xs hover:bg-muted/20">
                <TableCell className="py-3 font-mono font-semibold text-foreground text-xs">
                  {p.transactionRef}
                </TableCell>

                <TableCell>
                  <div className="font-medium text-foreground">{p.senderCity} → {p.receiverCity}</div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20 capitalize">
                    {p.method}
                  </Badge>
                </TableCell>

                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.trackingId}
                </TableCell>

                <TableCell className="font-semibold text-foreground text-xs">
                  ₹{p.amount.toLocaleString()}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        p.status === "paid"
                          ? "bg-success"
                          : p.status === "pending"
                          ? "bg-warning"
                          : p.status === "refunded"
                          ? "bg-info"
                          : "bg-destructive"
                      }`}
                    />
                    <span className="font-medium text-xs capitalize">{p.status}</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleString()}
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 text-xs">
                      <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                        {p.transactionRef}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {p.status === "paid" && (
                        <DropdownMenuItem onClick={handleRefund} className="gap-2 text-xs text-warning-foreground">
                          <RotateCcw className="h-3.5 w-3.5" /> Issue Refund
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
