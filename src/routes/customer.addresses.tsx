import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPinned, Plus, Trash2, Star, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/addresses")({
  head: () => ({
    meta: [
      { title: "Saved addresses — ShipLync" },
      { name: "description", content: "Manage your saved pickup and delivery addresses." },
    ],
  }),
  component: AddressesPage,
});

type Address = {
  id: string;
  label: string;
  contactName: string;
  contactPhone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

const emptyForm = {
  label: "",
  contactName: "",
  contactPhone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

function AddressesPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const { data: addressList = [], isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: async (): Promise<Address[]> => {
      const res = await fetch("/api/addresses");
      if (!res.ok) return [];
      const data = await res.json();
      return data.addresses ?? [];
    },
    enabled: isAuthenticated,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(editingId ? `/api/addresses/${editingId}` : "/api/addresses", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save address");
        return;
      }
      toast.success(editingId ? "Address updated" : "Address saved");
      setForm(emptyForm);
      setEditingId(null);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(a: Address) {
    setEditingId(a.id);
    setForm({
      label: a.label,
      contactName: a.contactName,
      contactPhone: a.contactPhone,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      isDefault: a.isDefault,
    });
    setOpen(true);
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["addresses"] });
    toast.success("Address removed");
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-6 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Saved addresses</div>
          <h1 className="font-display text-3xl font-semibold mt-1">Sign in to manage addresses</h1>
        </div>
        <div className="card-elevated p-6 sm:p-8 bg-background border rounded-2xl shadow-xl">
          <LoginForm compact />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Addresses</div>
          <h1 className="font-display text-3xl font-semibold mt-1">Saved addresses</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button className="gap-1.5" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add address
          </Button>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit saved address" : "Add a saved address"}</DialogTitle>
              <DialogDescription>Used to pre-fill pickup/delivery details when booking.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input
                    placeholder="Home, Office…"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Contact name</Label>
                  <Input
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Contact phone</Label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Address line</Label>
                <Input
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">City</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                </div>
                <div>
                  <Label className="text-xs">State</Label>
                  <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
                </div>
                <div>
                  <Label className="text-xs">Pincode</Label>
                  <Input
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="text-xs">Set as default</Label>
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(v) => setForm({ ...form, isDefault: v })}
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Saving..." : "Save address"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : addressList.length === 0 ? (
        <div className="card-elevated p-10 text-center">
          <MapPinned className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium">No saved addresses yet</div>
          <div className="text-sm text-muted-foreground mt-1">
            Add one to speed up future bookings.
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addressList.map((a) => (
            <div key={a.id} className="card-elevated p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  {a.label}
                  {a.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5">
                      <Star className="h-3 w-3" /> Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(a.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-sm">{a.contactName} · {a.contactPhone}</div>
              <div className="text-xs text-muted-foreground">
                {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
