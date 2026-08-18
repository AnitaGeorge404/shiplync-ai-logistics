import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { notifications as initialNotifications } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Plus,
  Search,
  MoreHorizontal,
  Send,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [
      { title: "System Notifications — Admin Dashboard" },
      { name: "description", content: "Manage system broadcasts, alert logs, driver pushes, and medical notifications." },
    ],
  }),
  component: AdminNotificationsPage,
});

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "medical" | "warning" | "success" | "ai";
  time: string;
  read: boolean;
  audience: string;
}

const INITIAL_LOGS: NotificationItem[] = [
  { id: "NTF-801", title: "Medical Priority Shipment Intake", body: "BLR-South received priority vaccine parcel SLX-77421-IN", type: "medical", time: "2 min ago", read: false, audience: "Hub Staff" },
  { id: "NTF-802", title: "Hub Congestion Warning", body: "BOM-Main operating at 92% capacity. Redirecting 40 parcels to Thane.", type: "warning", time: "12 min ago", read: false, audience: "All Operators" },
  { id: "NTF-803", title: "AI Route Optimization Complete", body: "Clustered 42 stops into 6 routes, saving 3.4L fuel across BLR fleet.", type: "ai", time: "28 min ago", read: true, audience: "Drivers" },
  { id: "NTF-804", title: "SLA Delivered On-Time", body: "Express consignment SLX-77400 delivered to Koramangala 14m early.", type: "success", time: "45 min ago", read: true, audience: "Customers" },
];

function AdminNotificationsPage() {
  const [notifList, setNotifList] = useState<NotificationItem[]>(INITIAL_LOGS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const [bTitle, setBTitle] = useState("");
  const [bBody, setBBody] = useState("");
  const [bAudience, setBAudience] = useState("All Users");

  const filteredNotifs = useMemo(() => {
    return notifList.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.body.toLowerCase().includes(search.toLowerCase()) ||
        n.audience.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "ALL" || n.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [notifList, search, typeFilter]);

  const stats = useMemo(() => {
    const total = notifList.length;
    const unread = notifList.filter((n) => !n.read).length;
    const medical = notifList.filter((n) => n.type === "medical").length;
    const warnings = notifList.filter((n) => n.type === "warning").length;

    return { total, unread, medical, warnings };
  }, [notifList]);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle || !bBody) return;

    const newNotif: NotificationItem = {
      id: `NTF-${Math.floor(800 + Math.random() * 200)}`,
      title: bTitle,
      body: bBody,
      type: "ai",
      time: "Just now",
      read: false,
      audience: bAudience,
    };

    setNotifList([newNotif, ...notifList]);
    setIsBroadcastOpen(false);
    setBTitle("");
    setBBody("");
    toast.success(`Broadcast sent to ${bAudience}`);
  };

  const handleMarkAllRead = () => {
    setNotifList((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleDelete = (id: string) => {
    setNotifList((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification log deleted");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            System Notifications & Broadcasts
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time event stream, system alerts, push notifications, and broadcast messages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
          </Button>
          <Button
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => setIsBroadcastOpen(true)}
          >
            <Send className="h-3.5 w-3.5" /> Send Broadcast
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Event Logs <Bell className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Unread Notifications <Bell className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.unread}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Medical Alerts <HeartPulse className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.medical}</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Warning Logs <AlertTriangle className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">{stats.warnings}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search notification title or audience..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
            <SelectValue placeholder="Notification Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="medical">Medical Alert</SelectItem>
            <SelectItem value="warning">Warning Log</SelectItem>
            <SelectItem value="ai">AI System</SelectItem>
            <SelectItem value="success">Success</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">Event Title & Details</TableHead>
              <TableHead className="text-xs font-medium">Type</TableHead>
              <TableHead className="text-xs font-medium">Audience</TableHead>
              <TableHead className="text-xs font-medium">Timestamp</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNotifs.map((n) => (
              <TableRow key={n.id} className="text-xs hover:bg-muted/30">
                <TableCell className="py-3">
                  <div className="font-medium text-foreground text-xs">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{n.body}</div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20 capitalize">
                    {n.type}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {n.audience}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {n.time}
                </TableCell>

                <TableCell>
                  <span className={`text-[11px] font-medium ${n.read ? "text-muted-foreground" : "text-foreground"}`}>
                    {n.read ? "Read" : "Unread"}
                  </span>
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
                        {n.id}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(n.id)} className="gap-2 text-xs text-destructive">
                        <Trash2 className="h-3.5 w-3.5" /> Delete Log
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Broadcast Modal */}
      <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send System Broadcast</DialogTitle>
            <DialogDescription>
              Push a live message to hub operators, delivery riders, or customers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBroadcast} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Broadcast Title</Label>
              <Input
                placeholder="e.g. Severe Weather Warning — BOM Region"
                value={bTitle}
                onChange={(e) => setBTitle(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Message Body</Label>
              <Input
                placeholder="Enter notification details..."
                value={bBody}
                onChange={(e) => setBBody(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Target Audience</Label>
              <Select value={bAudience} onValueChange={setBAudience}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Users">All Users</SelectItem>
                  <SelectItem value="Hub Staff">Hub Staff</SelectItem>
                  <SelectItem value="Drivers">Drivers Only</SelectItem>
                  <SelectItem value="Customers">Customers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsBroadcastOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1.5">
                <Send className="h-3.5 w-3.5" /> Send Broadcast
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
