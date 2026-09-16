import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useNotifications, useQueryClient } from "@/lib/api-hooks";
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
import { Bell, Search, HeartPulse, AlertTriangle, CheckCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Admin Dashboard" },
      { name: "description", content: "Your real system notification feed, from the live database." },
    ],
  }),
  component: AdminNotificationsPage,
});

function AdminNotificationsPage() {
  const { data: notifList = [] } = useNotifications();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredNotifs = useMemo(() => {
    return notifList.filter((n: any) => {
      const matchesSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "ALL" || n.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [notifList, search, typeFilter]);

  const stats = useMemo(() => {
    const total = notifList.length;
    const unread = notifList.filter((n: any) => !n.read).length;
    const medical = notifList.filter((n: any) => n.type === "medical_priority").length;
    const warnings = notifList.filter((n: any) => n.type === "delivery_failed" || n.type === "exception_alert").length;
    return { total, unread, medical, warnings };
  }, [notifList]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllRead = async () => {
    const unread = notifList.filter((n: any) => !n.read);
    await Promise.all(unread.map((n: any) => fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" })));
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    toast.success("All notifications marked as read");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real, event-driven notifications for your account — generated automatically as shipments move.
          </p>
        </div>

        <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={markAllRead} disabled={stats.unread === 0}>
          <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total <Bell className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Unread <Bell className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.unread}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Medical Alerts <HeartPulse className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.medical}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Warnings <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold mt-2">{stats.warnings}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search notification title or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs bg-background">
            <SelectValue placeholder="Notification Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="medical_priority">Medical Priority</SelectItem>
            <SelectItem value="delivery_failed">Delivery Failed</SelectItem>
            <SelectItem value="exception_alert">Exception Alert</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="shipment_booked">Shipment Booked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Event</TableHead>
              <TableHead className="text-xs font-medium">Type</TableHead>
              <TableHead className="text-xs font-medium">Timestamp</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-24 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNotifs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                  No notifications yet.
                </TableCell>
              </TableRow>
            )}
            {filteredNotifs.map((n: any) => (
              <TableRow key={n.id} className="text-xs hover:bg-muted/20">
                <TableCell className="py-3">
                  <div className="font-medium text-foreground text-xs">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{n.message}</div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20 capitalize">
                    {n.type.replace(/_/g, " ")}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </TableCell>

                <TableCell>
                  <span className={`text-[11px] font-medium ${n.read ? "text-muted-foreground" : "text-foreground"}`}>
                    {n.read ? "Read" : "Unread"}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  {!n.read && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => markRead(n.id)}>
                      Mark read
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
