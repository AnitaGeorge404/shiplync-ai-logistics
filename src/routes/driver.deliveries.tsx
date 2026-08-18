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
  ListChecks,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Download,
  IndianRupee,
  ShieldCheck,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/deliveries")({
  head: () => ({
    meta: [
      { title: "Deliveries — Delivery Partner" },
      { name: "description", content: "All assigned deliveries, completed drop-offs, COD payments, and proof of delivery." },
    ],
  }),
  component: DriverDeliveriesPage,
});

export interface DeliveryRecord {
  id: string;
  tracking: string;
  recipient: string;
  address: string;
  cod: number;
  status: "Completed" | "Pending" | "Attempted";
  verifiedMethod: "OTP Verified" | "Photo Signature" | "Pending";
  timestamp: string;
}

const INITIAL_DELIVERIES: DeliveryRecord[] = [
  { id: "D-101", tracking: "SLX-77420-IN", recipient: "Aditi Kapoor", address: "Koramangala 4th Block", cod: 0, status: "Completed", verifiedMethod: "OTP Verified", timestamp: "11:20 AM" },
  { id: "D-102", tracking: "SLX-77421-IN", recipient: "Sunita Rao", address: "HSR Layout Sector 1", cod: 480, status: "Pending", verifiedMethod: "Pending", timestamp: "Est 11:45 AM" },
  { id: "D-103", tracking: "SLX-77422-IN", recipient: "Kabir Mehta", address: "Indiranagar 100ft Rd", cod: 0, status: "Pending", verifiedMethod: "Pending", timestamp: "Est 12:10 PM" },
  { id: "D-104", tracking: "SLX-77423-IN", recipient: "TechCorp Logistics", address: "Whitefield Tech Park", cod: 1240, status: "Pending", verifiedMethod: "Pending", timestamp: "Est 12:35 PM" },
  { id: "D-105", tracking: "SLX-77424-IN", recipient: "Vikram S.", address: "Domlur Flyover Rd", cod: 0, status: "Pending", verifiedMethod: "Pending", timestamp: "Est 01:05 PM" },
  { id: "D-106", tracking: "SLX-77425-IN", recipient: "Deepa Patel", address: "Sarjapur Main Rd", cod: 340, status: "Pending", verifiedMethod: "Pending", timestamp: "Est 01:30 PM" },
];

function DriverDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>(INITIAL_DELIVERIES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const matchesSearch =
        d.tracking.toLowerCase().includes(search.toLowerCase()) ||
        d.recipient.toLowerCase().includes(search.toLowerCase()) ||
        d.address.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [deliveries, search, statusFilter]);

  const stats = useMemo(() => {
    const total = deliveries.length;
    const completed = deliveries.filter((d) => d.status === "Completed").length;
    const pending = deliveries.filter((d) => d.status === "Pending").length;
    const codTotal = deliveries
      .filter((d) => d.status === "Completed")
      .reduce((acc, d) => acc + d.cod, 0);

    return { total, completed, pending, codTotal };
  }, [deliveries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Deliveries Summary
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Complete list of assigned parcel drop-offs, COD cash collections, and OTP verifications.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs gap-1.5"
          onClick={() => toast.success("Exported deliveries summary")}
        >
          <Download className="h-3.5 w-3.5" /> Export Log
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Shift Drops <ListChecks className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Delivered <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.completed}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Remaining Drops <Clock className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.pending}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            COD Cash Collected <IndianRupee className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">₹{stats.codTotal}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tracking ID, recipient, address..."
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
            <SelectItem value="ALL">All Drops</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Attempted">Attempted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Tracking & ID</TableHead>
              <TableHead className="text-xs font-medium">Recipient & Location</TableHead>
              <TableHead className="text-xs font-medium">COD Amount</TableHead>
              <TableHead className="text-xs font-medium">Verification</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeliveries.map((d) => (
              <TableRow key={d.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3 font-mono font-semibold text-foreground text-xs">
                  {d.tracking}
                </TableCell>

                <TableCell>
                  <div className="font-medium text-foreground text-xs">{d.recipient}</div>
                  <div className="text-[11px] text-muted-foreground">{d.address}</div>
                </TableCell>

                <TableCell className="font-mono text-xs font-medium">
                  {d.cod > 0 ? `₹${d.cod}` : "Prepaid"}
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20">
                    {d.verifiedMethod}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        d.status === "Completed" ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <span className="font-medium text-xs">{d.status}</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {d.timestamp}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
