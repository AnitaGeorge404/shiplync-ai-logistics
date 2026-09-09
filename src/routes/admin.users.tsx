import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useUsers, useHubs, useQueryClient } from "@/lib/api-hooks";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Admin Dashboard" },
      { name: "description", content: "Manage platform user accounts and roles." },
    ],
  }),
  component: AdminUsersDashboard,
});

const ROLES = ["customer", "delivery_agent", "hub_staff", "admin"] as const;
const ROLE_LABEL: Record<string, string> = {
  customer: "Customer",
  delivery_agent: "Delivery Partner",
  hub_staff: "Hub Staff",
  admin: "Administrator",
};

function AdminUsersDashboard() {
  const { data: userList = [] } = useUsers();
  const { data: hubsList = [] } = useHubs();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleTab, setRoleTab] = useState<string>("ALL");

  const filteredUsers = useMemo(() => {
    return userList.filter((u: any) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleTab === "ALL" || u.role === roleTab;
      return matchesSearch && matchesRole;
    });
  }, [userList, search, roleTab]);

  const counts = useMemo(() => {
    return {
      all: userList.length,
      customer: userList.filter((u: any) => u.role === "customer").length,
      delivery_agent: userList.filter((u: any) => u.role === "delivery_agent").length,
      hub_staff: userList.filter((u: any) => u.role === "hub_staff").length,
      admin: userList.filter((u: any) => u.role === "admin").length,
    };
  }, [userList]);

  const handleRoleChange = async (id: string, role: string, hubId?: string) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role, hubId }),
    });
    if (!res.ok) {
      toast.error("Could not update role");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["users"] });
    toast.success(`Role updated to ${ROLE_LABEL[role]}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Users</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real accounts from the database. Manage role assignments (customer, delivery partner, hub staff, admin).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto text-xs border-b pb-3">
        {[
          { id: "ALL", label: "All Users", count: counts.all },
          { id: "customer", label: "Customers", count: counts.customer },
          { id: "delivery_agent", label: "Delivery Partners", count: counts.delivery_agent },
          { id: "hub_staff", label: "Hub Staff", count: counts.hub_staff },
          { id: "admin", label: "Admins", count: counts.admin },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRoleTab(tab.id)}
            className={`px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap ${
              roleTab === tab.id
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label} <span className="ml-1 text-[11px] opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-xs bg-background"
        />
      </div>

      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium">User</TableHead>
              <TableHead className="text-xs font-medium">Role</TableHead>
              <TableHead className="text-xs font-medium">Hub</TableHead>
              <TableHead className="text-xs font-medium">Joined</TableHead>
              <TableHead className="w-12 text-right text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u: any) => (
                <TableRow key={u.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted border border-border text-foreground font-semibold grid place-items-center text-xs shrink-0">
                        {u.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground text-xs leading-none">{u.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-1 truncate">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/30 text-muted-foreground">
                      {ROLE_LABEL[u.role] ?? u.role}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {hubsList.find((h: any) => h.id === u.hubId)?.name ?? "—"}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 text-xs">
                        <DropdownMenuLabel className="text-[11px] text-muted-foreground">Set role</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {ROLES.map((r) => (
                          <DropdownMenuItem
                            key={r}
                            disabled={u.role === r}
                            onClick={() => handleRoleChange(u.id, r, u.hubId)}
                            className="gap-2 text-xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> {ROLE_LABEL[r]}
                          </DropdownMenuItem>
                        ))}
                        {(u.role === "delivery_agent" || u.role === "hub_staff") && hubsList.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[11px] text-muted-foreground">Assign hub</DropdownMenuLabel>
                            {hubsList.map((h: any) => (
                              <DropdownMenuItem
                                key={h.id}
                                disabled={u.hubId === h.id}
                                onClick={() => handleRoleChange(u.id, u.role, h.id)}
                                className="gap-2 text-xs"
                              >
                                <SlidersHorizontal className="h-3.5 w-3.5" /> {h.name}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="px-4 py-3 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Showing <strong>{filteredUsers.length}</strong> of <strong>{userList.length}</strong> users
          </div>
        </div>
      </div>
    </div>
  );
}
