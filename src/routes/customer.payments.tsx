import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/customer/payments")({
  head: () => ({
    meta: [
      { title: "Payments — ShipLync" },
      { name: "description", content: "Your ShipLync payment history." },
    ],
  }),
  component: PaymentsPage,
});

type Payment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionRef: string | null;
  createdAt: string;
  trackingId: string;
  senderCity: string;
  receiverCity: string;
};

function PaymentsPage() {
  const { isAuthenticated } = useAuth();
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async (): Promise<Payment[]> => {
      const res = await fetch("/api/payments");
      if (!res.ok) return [];
      const data = await res.json();
      return data.payments ?? [];
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-6 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Payments</div>
          <h1 className="font-display text-3xl font-semibold mt-1">Sign in to view payments</h1>
        </div>
        <div className="card-elevated p-6 sm:p-8">
          <LoginForm compact />
        </div>
      </div>
    );
  }

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Payments</div>
        <h1 className="font-display text-3xl font-semibold mt-1">Payment history</h1>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card-elevated p-4">
          <div className="text-xs text-muted-foreground">Total paid</div>
          <div className="text-2xl font-semibold font-display mt-1">₹{total.toFixed(2)}</div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-xs text-muted-foreground">Transactions</div>
          <div className="text-2xl font-semibold font-display mt-1">{payments.length}</div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-xs text-muted-foreground">Payment method</div>
          <div className="text-2xl font-semibold font-display mt-1">UPI / Mock</div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : payments.length === 0 ? (
        <div className="card-elevated p-10 text-center">
          <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium">No payments yet</div>
          <div className="text-sm text-muted-foreground mt-1">
            Payments appear here as soon as you book a shipment.
          </div>
        </div>
      ) : (
        <>
          <div className="card-elevated overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3">Transaction</th>
                  <th className="text-left px-5 py-3">Shipment</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Method</th>
                  <th className="text-right px-5 py-3">Amount</th>
                  <th className="text-right px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-5 py-4 font-mono text-xs">{p.transactionRef}</td>
                    <td className="px-5 py-4">
                      <Link
                        to="/customer/track/$id"
                        params={{ id: p.trackingId }}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {p.trackingId}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {p.senderCity} → {p.receiverCity}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-xs capitalize">{p.method}</td>
                    <td className="px-5 py-4 text-right font-medium">₹{p.amount.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right text-xs capitalize">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {payments.map((p) => (
              <div key={p.id} className="card-elevated p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs">{p.transactionRef}</span>
                  <span className="font-medium">₹{p.amount.toFixed(2)}</span>
                </div>
                <Link to="/customer/track/$id" params={{ id: p.trackingId }} className="font-mono text-xs text-primary hover:underline block">
                  {p.trackingId}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {p.senderCity} → {p.receiverCity} · {new Date(p.createdAt).toLocaleDateString()}
                </div>
                <div className="text-xs capitalize flex items-center justify-between">
                  <span className="text-muted-foreground">{p.method}</span>
                  <span>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
