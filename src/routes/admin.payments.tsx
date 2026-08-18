import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
  Filter,
  MoreHorizontal,
  Download,
  IndianRupee,
  CheckCircle2,
  Clock,
  RotateCcw,
  Receipt,
  ArrowUpRight,
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

export interface PaymentItem {
  id: string;
  customer: string;
  email: string;
  amount: number;
  method: "UPI" | "Credit Card" | "Debit Card" | "Cash on Pickup" | "Corporate Credit";
  status: "Completed" | "Pending" | "Refunded" | "Failed";
  date: string;
  tracking: string;
}

const INITIAL_PAYMENTS: PaymentItem[] = [
  { id: "TXN-984210", customer: "Aditi Kapoor", email: "aditi.k@example.com", amount: 480, method: "UPI", status: "Completed", date: "Aug 18, 11:14 AM", tracking: "SLX-77420-IN" },
  { id: "TXN-984211", customer: "TechCorp Logistics", email: "billing@techcorp.in", amount: 12400, method: "Corporate Credit", status: "Completed", date: "Aug 18, 10:45 AM", tracking: "SLX-77421-IN" },
  { id: "TXN-984212", customer: "Kabir Mehta", email: "kabir.m@gmail.com", amount: 340, method: "Credit Card", status: "Pending", date: "Aug 18, 10:12 AM", tracking: "SLX-77422-IN" },
  { id: "TXN-984213", customer: "Sunita Rao", email: "sunita.r@gmail.com", amount: 780, method: "UPI", status: "Completed", date: "Aug 18, 09:30 AM", tracking: "SLX-77423-IN" },
  { id: "TXN-984214", customer: "Vikram S.", email: "vikram.s@logistics.com", amount: 560, method: "Cash on Pickup", status: "Completed", date: "Aug 17, 08:20 PM", tracking: "SLX-77424-IN" },
  { id: "TXN-984215", customer: "Deepa Patel", email: "deepa.p@logistics.com", amount: 220, method: "Debit Card", status: "Refunded", date: "Aug 17, 05:10 PM", tracking: "SLX-77425-IN" },
];

function AdminPaymentsPage() {
  const [paymentsList, setPaymentsList] = useState<PaymentItem[]>(INITIAL_PAYMENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredPayments = useMemo(() => {
    return paymentsList.filter((p) => {
      const matchesSearch =
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.customer.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.tracking.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [paymentsList, search, statusFilter]);

  const stats = useMemo(() => {
    const totalVolume = paymentsList.reduce((acc, p) => (p.status === "Completed" ? acc + p.amount : acc), 0);
    const count = paymentsList.length;
    const completedCount = paymentsList.filter((p) => p.status === "Completed").length;
    const refundedCount = paymentsList.filter((p) => p.status === "Refunded").length;

    return { totalVolume, count, completedCount, refundedCount };
  }, [paymentsList]);

  const handleRefund = (id: string, customer: string, amount: number) => {
    setPaymentsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "Refunded" } : p))
    );
    toast.success(`Refund of ₹${amount} issued to ${customer}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Payments & Billing
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track customer transactions, courier payouts, invoice generation, and refunds.
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
            Settled Volume <IndianRupee className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">
            ₹{stats.totalVolume.toLocaleString()}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Transactions <CreditCard className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.count}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Success Rate <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">
            {Math.round((stats.completedCount / (stats.count || 1)) * 100)}%
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Refund Logs <RotateCcw className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.refundedCount}</div>
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
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Refunded">Refunded</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Transaction ID</TableHead>
              <TableHead className="text-xs font-medium">Customer & Email</TableHead>
              <TableHead className="text-xs font-medium">Method</TableHead>
              <TableHead className="text-xs font-medium">Tracking Link</TableHead>
              <TableHead className="text-xs font-medium">Amount</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium">Date</TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((p) => (
              <TableRow key={p.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3 font-mono font-semibold text-foreground text-xs">
                  {p.id}
                </TableCell>

                <TableCell>
                  <div className="font-medium text-foreground">{p.customer}</div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">{p.email}</div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20">
                    {p.method}
                  </Badge>
                </TableCell>

                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.tracking}
                </TableCell>

                <TableCell className="font-semibold text-foreground text-xs">
                  ₹{p.amount.toLocaleString()}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        p.status === "Completed"
                          ? "bg-emerald-500"
                          : p.status === "Pending"
                          ? "bg-amber-500"
                          : p.status === "Refunded"
                          ? "bg-blue-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="font-medium text-xs">{p.status}</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {p.date}
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
                        {p.id}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toast.info(`Viewing receipt for ${p.id}`)} className="gap-2 text-xs">
                        <Receipt className="h-3.5 w-3.5" /> Download Receipt
                      </DropdownMenuItem>
                      {p.status === "Completed" && (
                        <DropdownMenuItem onClick={() => handleRefund(p.id, p.customer, p.amount)} className="gap-2 text-xs text-amber-600">
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
