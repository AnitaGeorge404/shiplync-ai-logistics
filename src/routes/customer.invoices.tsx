import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/customer/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — ShipLync" },
      { name: "description", content: "Download invoices for your ShipLync shipments." },
    ],
  }),
  component: InvoicesPage,
});

type ShipmentRow = {
  id: string;
  trackingId: string;
  cost: number;
  status: string;
  createdAt: string;
  senderCity: string;
  receiverCity: string;
  packageType: string;
};

function invoiceNumber(trackingId: string, createdAt: string) {
  const year = new Date(createdAt).getFullYear();
  return `INV-${year}-${trackingId.slice(-6)}`;
}

function InvoicesPage() {
  const { isAuthenticated } = useAuth();
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["shipments", "mine"],
    queryFn: async (): Promise<ShipmentRow[]> => {
      const res = await fetch("/api/shipments");
      if (!res.ok) return [];
      const data = await res.json();
      return data.shipments ?? [];
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-6 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Invoices</div>
          <h1 className="font-display text-3xl font-semibold mt-1">Sign in to view invoices</h1>
        </div>
        <div className="card-elevated p-6 sm:p-8 bg-background border rounded-2xl shadow-xl">
          <LoginForm compact />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Billing</div>
        <h1 className="font-display text-3xl font-semibold mt-1">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          One invoice is generated per shipment at the time of booking.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : shipments.length === 0 ? (
        <div className="card-elevated p-10 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium">No invoices yet</div>
          <div className="text-sm text-muted-foreground mt-1">Book a shipment to generate your first invoice.</div>
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Invoice</th>
                <th className="text-left px-5 py-3">Shipment</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-right px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipments.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4 font-mono text-xs font-medium">
                    {invoiceNumber(s.trackingId, s.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      to="/customer/track/$id"
                      params={{ id: s.trackingId }}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {s.trackingId}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {s.senderCity} → {s.receiverCity} · {s.packageType}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right font-medium">₹{s.cost.toFixed(2)}</td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => window.print()}
                    >
                      <Download className="h-3.5 w-3.5" /> Print
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
