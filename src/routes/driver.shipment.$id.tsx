import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useShipments, useDeliveryAttempts, useQueryClient, useHubs } from "@/lib/api-hooks";
import {
  NEXT_STATUS,
  TERMINAL_STATUSES,
  canRecordAttempt,
  fullAddress,
  mapsHref,
  telHref,
  formatEta,
  FAILED_ATTEMPT_REASONS,
  ATTEMPT_OUTCOME_LABEL,
  type RealShipment,
} from "@/lib/driver";
import { StatusTag, PriorityTag } from "@/components/shiplync/driver/Tags";
import { DriverLiveTracker } from "@/components/shiplync/driver/DriverLiveTracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Phone,
  Navigation,
  User,
  Package,
  Truck,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Building2,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/driver/shipment/$id")({
  head: () => ({ meta: [{ title: "Shipment — Delivery Partner" }] }),
  component: ShipmentDetailPage,
});

type Attempt = {
  id: string;
  attemptNumber: number;
  outcome: string;
  reason: string | null;
  attemptedAt: string;
};

function ShipmentDetailPage() {
  const { id } = Route.useParams();
  const { data: assigned = [], isLoading } = useShipments("assigned") as {
    data: RealShipment[];
    isLoading: boolean;
  };
  const { data: attempts = [] } = useDeliveryAttempts(id);
  const { data: hubs = [] } = useHubs();
  const queryClient = useQueryClient();

  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<"none" | "delivered" | "failed">("none");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [reason, setReason] = useState(FAILED_ATTEMPT_REASONS[0].value);
  const [notes, setNotes] = useState("");
  const [justFailed, setJustFailed] = useState(false);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading shipment…
      </div>
    );
  }

  const shipment = assigned.find((s) => s.id === id);
  if (!shipment) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="border rounded-lg bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          This shipment isn't assigned to you, or no longer exists.
        </div>
      </div>
    );
  }

  const s = shipment;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["shipments", "assigned"] });
    await queryClient.invalidateQueries({ queryKey: ["shipments", id, "attempts"] });
  }

  async function advance(status: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/shipments/${id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, note: `Updated by delivery agent to ${status}.` }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Could not update status");
        return;
      }
      toast.success(`Marked "${status.replace(/_/g, " ")}"`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitDelivered(e: React.FormEvent) {
    e.preventDefault();
    setOtpError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/shipments/${id}/attempts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          outcome: "delivered",
          otp: otp.trim(),
          reason: `OTP ${otp.trim()} verified by delivery agent.`,
          otpVerified: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || "Wrong OTP, try again";
        toast.error(msg);
        setOtpError(msg);
        return;
      }
      toast.success("Delivered! Proof of delivery recorded.");
      setPanel("none");
      setOtp("");
      setOtpError(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitFailed(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const label = FAILED_ATTEMPT_REASONS.find((r) => r.value === reason)?.label ?? reason;
      const res = await fetch(`/api/shipments/${id}/attempts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          outcome: reason,
          reason: notes ? `${label}: ${notes}` : label,
          otpVerified: false,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Could not record delivery attempt");
        return;
      }
      toast.success("Failed attempt logged");
      setPanel("none");
      setNotes("");
      setJustFailed(true);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const currentHub =
    hubs.find((h: any) => h.id === (s as any).currentHubId) ||
    hubs.find(
      (h: any) =>
        (s as any).currentLocationCity &&
        h.city.toLowerCase() === (s as any).currentLocationCity.toLowerCase(),
    ) ||
    null;

  const next = NEXT_STATUS[s.status] ?? null;
  const canAttempt = canRecordAttempt(s.status);
  const isTerminal = TERMINAL_STATUSES.has(s.status);

  return (
    <div className="space-y-5 pb-4">
      <BackLink />

      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display text-xl font-semibold">{s.receiverName}</h1>
          <PriorityTag shipment={s} />
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1.5">
          <span className="font-mono text-xs text-muted-foreground">{s.trackingId}</span>
          <StatusTag status={s.status} />
        </div>
      </div>

      {/* Real-time GPS Tracking & Live Customer Broadcast */}
      <DriverLiveTracker
        shipmentId={s.id}
        trackingId={s.trackingId}
        receiverAddress={{
          addressLine: s.receiverAddressLine,
          city: s.receiverCity,
          state: s.receiverState,
          pincode: s.receiverPincode,
          lat: (s as any).receiverLat ?? null,
          lng: (s as any).receiverLng ?? null,
        }}
        currentHub={
          currentHub
            ? {
                name: currentHub.name,
                city: currentHub.city,
                lat: currentHub.lat,
                lng: currentHub.lng,
              }
            : null
        }
        currentLocationCity={(s as any).currentLocationCity}
        senderAddress={{
          addressLine: (s as any).senderAddressLine ?? "",
          city: (s as any).senderCity ?? s.receiverCity,
          state: (s as any).senderState ?? s.receiverState,
          pincode: (s as any).senderPincode ?? s.receiverPincode,
          lat: (s as any).senderLat ?? null,
          lng: (s as any).senderLng ?? null,
        }}
        status={s.status}
      />

      {/* Actions — the correct next step is the dominant control here. */}
      <div className="border rounded-xl bg-card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <a
            href={telHref(s.receiverPhone)}
            className="inline-flex items-center justify-center gap-1.5 h-10 rounded-md border text-xs font-medium hover:bg-muted/50"
          >
            <Phone className="h-3.5 w-3.5" /> Call recipient
          </a>
          <a
            href={mapsHref(fullAddress(s))}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 h-10 rounded-md border text-xs font-medium hover:bg-muted/50"
          >
            <Navigation className="h-3.5 w-3.5" /> Navigate
          </a>
        </div>

        {next && (
          <Button className="w-full h-11" disabled={busy} onClick={() => advance(next.status)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : next.label}
          </Button>
        )}

        {canAttempt && panel === "none" && (
          <div className="space-y-2">
            <Button
              className="w-full h-11 gap-1.5"
              disabled={busy}
              onClick={() => setPanel("delivered")}
            >
              <CheckCircle2 className="h-4 w-4" /> Mark delivered
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
              disabled={busy}
              onClick={() => setPanel("failed")}
            >
              <AlertTriangle className="h-4 w-4" /> Record failed attempt
            </Button>
          </div>
        )}

        {panel === "delivered" && (
          <form onSubmit={submitDelivered} className="space-y-3 border-t pt-3">
            <div>
              <Label className="text-xs flex items-center gap-1.5 font-medium">
                <KeyRound className="h-3.5 w-3.5 text-primary" /> Enter 4-digit customer OTP
              </Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ask the recipient for the 4-digit delivery verification code shown on their tracking screen.
              </p>
            </div>
            <div>
              <Input
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  if (otpError) setOtpError(null);
                }}
                maxLength={4}
                inputMode="numeric"
                placeholder="e.g. 1234"
                required
                autoFocus
                className={`h-12 text-center font-mono text-xl tracking-widest font-bold ${
                  otpError ? "border-destructive focus-visible:ring-destructive text-destructive" : ""
                }`}
              />
              {otpError && (
                <p className="text-xs text-destructive font-medium flex items-center justify-center gap-1.5 mt-2 animate-in fade-in duration-200">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {otpError}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10"
                onClick={() => {
                  setPanel("none");
                  setOtpError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-10 gap-1.5" disabled={busy || otp.trim().length !== 4}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {busy ? "Verifying…" : "Verify OTP & deliver"}
              </Button>
            </div>
          </form>
        )}

        {panel === "failed" && (
          <form onSubmit={submitFailed} className="space-y-3 border-t pt-3">
            <div>
              <Label className="text-xs">Reason</Label>
              <div className="grid gap-1.5 mt-1.5">
                {FAILED_ATTEMPT_REASONS.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`text-left text-sm px-3 py-2 rounded-md border ${reason === r.value ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/40"}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the hub team should know"
                className="mt-1.5 text-sm"
                rows={3}
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2.5">
              This stop will be marked as attempted. You can retry it later on this route, or the
              hub team will reschedule or return the package to the sender.
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10"
                onClick={() => setPanel("none")}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" className="flex-1 h-10" disabled={busy}>
                {busy ? "Saving…" : "Log failed attempt"}
              </Button>
            </div>
          </form>
        )}

        {isTerminal && (
          <div className="text-xs text-muted-foreground text-center py-1">
            {s.status === "delivered"
              ? "Delivered — no further action needed."
              : s.status === "returned"
                ? "Returned to sender."
                : "No action needed."}
          </div>
        )}
      </div>

      {justFailed && panel === "none" && (
        <div className="text-xs text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
          Logged. Continue to your next stop — this one stays on your list in case you can retry
          today.
        </div>
      )}

      <Section title="Recipient" icon={<User className="h-3.5 w-3.5" />}>
        <Row label="Name" value={s.receiverName} />
        <Row label="Address" value={fullAddress(s)} />
        <Row label="Phone" value={s.receiverPhone} />
        {(s.receiverFloorCount > 0 || s.receiverHasSecurityCheckpoint) && (
          <Row
            label="Access notes"
            value={[
              s.receiverFloorCount > 0
                ? `${s.receiverFloorCount} floor${s.receiverFloorCount > 1 ? "s" : ""} to climb`
                : null,
              s.receiverHasSecurityCheckpoint ? "Security checkpoint at entrance" : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        )}
      </Section>

      <Section title="Shipment" icon={<Package className="h-3.5 w-3.5" />}>
        <Row label="Tracking ID" value={s.trackingId} mono />
        <Row
          label="Package"
          value={`${s.packageType}${s.elderlyCare ? " · elderly-care recipient" : ""}`}
          capitalize
        />
        <Row label="Weight" value={`${s.weightKg} kg`} />
        {(s.lengthCm || s.widthCm || s.heightCm) && (
          <Row
            label="Dimensions"
            value={`${s.lengthCm ?? "—"} × ${s.widthCm ?? "—"} × ${s.heightCm ?? "—"} cm`}
          />
        )}
        <Row label="Priority" value={s.priority} capitalize />
      </Section>

      <Section title="Delivery" icon={<Truck className="h-3.5 w-3.5" />}>
        <Row label="Status" value={<StatusTag status={s.status} />} raw />
        <Row label="ETA" value={formatEta(s)} />
        <Row label="Attempts" value={String(attempts.length)} />
      </Section>

      {attempts.length > 0 && (
        <Section title="Attempt history" icon={<Building2 className="h-3.5 w-3.5" />}>
          <div className="space-y-2">
            {(attempts as Attempt[]).map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-3 text-xs border-b last:border-0 pb-2 last:pb-0"
              >
                <div>
                  <div className="font-medium text-foreground">
                    #{a.attemptNumber} · {ATTEMPT_OUTCOME_LABEL[a.outcome] ?? a.outcome}
                  </div>
                  {a.reason && <div className="text-muted-foreground mt-0.5">{a.reason}</div>}
                </div>
                <div className="text-muted-foreground shrink-0">
                  {new Date(a.attemptedAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/driver/deliveries"
      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to deliveries
    </Link>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        {icon} {title}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  capitalize,
  raw,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  capitalize?: boolean;
  raw?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      {raw ? (
        value
      ) : (
        <span
          className={`text-right font-medium text-foreground ${mono ? "font-mono text-xs" : ""} ${capitalize ? "capitalize" : ""}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}
