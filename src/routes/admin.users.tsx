import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  UserPlus,
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  KeyRound,
  Download,
  Trash2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Admin Dashboard" },
      { name: "description", content: "Manage platform user accounts, security roles, and active sessions." },
    ],
  }),
  component: ClerkUsersDashboard,
});

export type UserRole = "Customer" | "Delivery Partner" | "Hub Operator" | "Administrator";
export type UserStatus = "Active" | "Pending" | "Suspended";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  shipments: number;
  joined: string;
  lastActive: string;
}

const INITIAL_USERS: AdminUser[] = [
  {
    id: "user_2a9f81",
    name: "Aditi Kapoor",
    email: "aditi.kapoor@example.com",
    phone: "+91 98765 43210",
    role: "Customer",
    status: "Active",
    shipments: 24,
    joined: "Jan 12, 2024",
    lastActive: "2 min ago",
  },
  {
    id: "user_2b7d44",
    name: "Ravi Kumar",
    email: "ravi.k@shiplync.com",
    phone: "+91 98112 44210",
    role: "Delivery Partner",
    status: "Active",
    shipments: 812,
    joined: "Nov 04, 2023",
    lastActive: "Now",
  },
  {
    id: "user_2c8e19",
    name: "Anita Sharma",
    email: "anita.s@shiplync.com",
    phone: "+91 98334 11020",
    role: "Delivery Partner",
    status: "Active",
    shipments: 1240,
    joined: "Aug 19, 2023",
    lastActive: "14 min ago",
  },
  {
    id: "user_2d9a03",
    name: "Vikram Malhotra",
    email: "vikram.m@shiplync.com",
    phone: "+91 98901 88720",
    role: "Hub Operator",
    status: "Active",
    shipments: 4520,
    joined: "Feb 01, 2024",
    lastActive: "1 hour ago",
  },
  {
    id: "user_2e4b77",
    name: "Sunita Rao",
    email: "sunita.r@techcorp.in",
    phone: "+91 98450 66310",
    role: "Customer",
    status: "Active",
    shipments: 56,
    joined: "May 15, 2024",
    lastActive: "Yesterday",
  },
  {
    id: "user_2f1c82",
    name: "Suresh N.",
    email: "suresh.n@shiplync.com",
    phone: "+91 98221 77340",
    role: "Delivery Partner",
    status: "Active",
    shipments: 640,
    joined: "Mar 10, 2024",
    lastActive: "3 hours ago",
  },
  {
    id: "user_2g0d99",
    name: "Rajesh Varma",
    email: "rajesh.v@shiplync.com",
    phone: "+91 98877 22100",
    role: "Administrator",
    status: "Active",
    shipments: 14200,
    joined: "Jan 01, 2023",
    lastActive: "Now",
  },
  {
    id: "user_2h3e41",
    name: "Priya R.",
    email: "priya.r@shiplync.com",
    phone: "+91 98665 99810",
    role: "Delivery Partner",
    status: "Active",
    shipments: 902,
    joined: "Oct 22, 2023",
    lastActive: "45 min ago",
  },
  {
    id: "user_2i9f50",
    name: "Kabir Mehta",
    email: "kabir.m@gmail.com",
    phone: "+91 98341 55430",
    role: "Customer",
    status: "Pending",
    shipments: 0,
    joined: "Aug 16, 2026",
    lastActive: "Never",
  },
  {
    id: "user_2j8a12",
    name: "Deepa Patel",
    email: "deepa.p@logistics.com",
    phone: "+91 98771 33290",
    role: "Hub Operator",
    status: "Suspended",
    shipments: 310,
    joined: "Dec 08, 2023",
    lastActive: "3 days ago",
  },
];

function ClerkUsersDashboard() {
  const [userList, setUserList] = useState<AdminUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [roleTab, setRoleTab] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Customer");

  // Filtering users
  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.toLowerCase().includes(search.toLowerCase()) ||
        u.id.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleTab === "ALL" || u.role === roleTab;
      const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [userList, search, roleTab, statusFilter]);

  // Counts by role
  const counts = useMemo(() => {
    return {
      all: userList.length,
      customers: userList.filter((u) => u.role === "Customer").length,
      drivers: userList.filter((u) => u.role === "Delivery Partner").length,
      hubOps: userList.filter((u) => u.role === "Hub Operator").length,
      admins: userList.filter((u) => u.role === "Administrator").length,
    };
  }, [userList]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredUsers.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newId = `user_${Math.random().toString(36).substring(2, 8)}`;
    const newUser: AdminUser = {
      id: newId,
      name: newName,
      email: newEmail,
      phone: newPhone || "+91 98000 00000",
      role: newRole,
      status: "Active",
      shipments: 0,
      joined: "Just now",
      lastActive: "Now",
    };

    setUserList([newUser, ...userList]);
    setIsAddUserOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    toast.success(`Created user ${newName}`);
  };

  const handleStatusChange = (id: string, newStatus: UserStatus) => {
    setUserList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
    );
    toast.success(`Updated status to ${newStatus}`);
  };

  const handleDeleteUser = (id: string, name: string) => {
    setUserList((prev) => prev.filter((u) => u.id !== id));
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    toast.success(`Deleted user ${name}`);
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setUserList((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
    toast.success(`Deleted ${selectedIds.length} users`);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Clerk Style Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Users
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage user details, security roles, authentication status, and active sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => toast.success("Exported users CSV")}
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => setIsAddUserOpen(true)}
          >
            <UserPlus className="h-3.5 w-3.5" /> Create User
          </Button>
        </div>
      </div>

      {/* Clerk Style Role Filter Tabs */}
      <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: "ALL", label: "All Users", count: counts.all },
            { id: "Customer", label: "Customers", count: counts.customers },
            { id: "Delivery Partner", label: "Delivery Partners", count: counts.drivers },
            { id: "Hub Operator", label: "Hub Staff", count: counts.hubOps },
            { id: "Administrator", label: "Admins", count: counts.admins },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleTab(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                roleTab === tab.id
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label} <span className="ml-1 text-[11px] opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
              <SlidersHorizontal className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 text-xs bg-muted px-3 py-1.5 rounded-md border animate-in fade-in-50">
            <span className="font-medium">
              {selectedIds.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBatchDelete}
              className="h-6 text-xs text-destructive hover:text-destructive p-0 ml-2"
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Clerk Style Clean Data Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">
                <Checkbox
                  checked={
                    filteredUsers.length > 0 && selectedIds.length === filteredUsers.length
                  }
                  onCheckedChange={(c) => handleSelectAll(!!c)}
                />
              </TableHead>
              <TableHead className="text-xs font-medium">User</TableHead>
              <TableHead className="text-xs font-medium">Role</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium">Joined</TableHead>
              <TableHead className="text-xs font-medium">Last Active</TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedIds.includes(u.id);
                return (
                  <TableRow
                    key={u.id}
                    className={`text-xs ${isSelected ? "bg-muted/60" : "hover:bg-muted/30"}`}
                  >
                    <TableCell className="text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(c) => handleSelectOne(u.id, !!c)}
                      />
                    </TableCell>

                    {/* User Profile */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted border border-border text-foreground font-semibold grid place-items-center text-xs shrink-0">
                          {u.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground text-xs leading-none">
                            {u.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1 truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role Pill */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-normal text-[11px] border-border bg-muted/30 text-muted-foreground"
                      >
                        {u.role}
                      </Badge>
                    </TableCell>

                    {/* Status Dot */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            u.status === "Active"
                              ? "bg-emerald-500"
                              : u.status === "Pending"
                              ? "bg-amber-500"
                              : "bg-muted-foreground"
                          }`}
                        />
                        <span className="text-xs text-foreground font-medium">
                          {u.status}
                        </span>
                      </div>
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="text-xs text-muted-foreground">
                      {u.joined}
                    </TableCell>

                    {/* Last Active */}
                    <TableCell className="text-xs text-muted-foreground">
                      {u.lastActive}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                            {u.id}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {u.status !== "Active" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(u.id, "Active")}
                              className="gap-2 text-xs"
                            >
                              <UserCheck className="h-3.5 w-3.5" /> Activate user
                            </DropdownMenuItem>
                          )}
                          {u.status !== "Suspended" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(u.id, "Suspended")}
                              className="gap-2 text-xs"
                            >
                              <UserX className="h-3.5 w-3.5" /> Suspend user
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => toast.info(`Reset password sent to ${u.email}`)}
                            className="gap-2 text-xs"
                          >
                            <KeyRound className="h-3.5 w-3.5" /> Reset password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="gap-2 text-xs text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer Pagination Bar */}
        <div className="px-4 py-3 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Showing <strong>{filteredUsers.length}</strong> of{" "}
            <strong>{userList.length}</strong> users
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" disabled>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" disabled>
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Add a new user account to your platform directory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddUser} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="new-name" className="text-xs">Full Name</Label>
              <Input
                id="new-name"
                placeholder="e.g. Vikram Sharma"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-email" className="text-xs">Email Address</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="name@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-phone" className="text-xs">Phone Number</Label>
              <Input
                id="new-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Delivery Partner">Delivery Partner</SelectItem>
                  <SelectItem value="Hub Operator">Hub Operator</SelectItem>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
