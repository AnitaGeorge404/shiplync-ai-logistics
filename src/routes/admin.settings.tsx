import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Route as RouteIcon,
  ShieldCheck,
  Bell,
  Key,
  Save,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings — Admin Dashboard" },
      { name: "description", content: "Configure dispatch thresholds, medical priority lanes, API integrations, and security settings." },
    ],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [aiAutonomous, setAiAutonomous] = useState(true);
  const [delayThreshold, setDelayThreshold] = useState("15");
  const [maxStops, setMaxStops] = useState("8");

  const [medicalPriority, setMedicalPriority] = useState(true);
  const [photoChain, setPhotoChain] = useState(true);

  const [smsGateway, setSmsGateway] = useState(true);
  const [whatsappApi, setWhatsappApi] = useState(true);

  const [apiKey, setApiKey] = useState("slx_live_984210a9f81");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Noted locally — nothing here is wired to a backend yet, see the notice below.");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Platform settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configuration preview — dispatch automation, medical lane protocols, notification gateways and API access.
          </p>
        </div>

        <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={handleSave}>
          <Save className="h-3.5 w-3.5" /> Save changes
        </Button>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-info/30 bg-info/5 p-3.5 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
        <div>
          <span className="font-medium text-foreground">This page is a configuration preview, not a live control panel.</span>{" "}
          None of the toggles below are persisted or connected to a backend — there's no Twilio/WhatsApp integration or
          settings table in this app yet. Values reset on reload. Everything else in the admin portal (shipments, hubs,
          fleet, exceptions, users, payments) is real, database-backed data.
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Dispatch automation */}
        <div className="border rounded-lg p-5 bg-card space-y-4">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground border-b pb-3">
            <RouteIcon className="h-4 w-4" /> Dispatch automation
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Automatic route optimization</Label>
              <p className="text-[11px] text-muted-foreground">
                Automatically cluster parcel stops and reassign riders when congestion is detected.
              </p>
            </div>
            <Switch checked={aiAutonomous} onCheckedChange={setAiAutonomous} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Predictive delay threshold (minutes)</Label>
              <Input
                type="number"
                value={delayThreshold}
                onChange={(e) => setDelayThreshold(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Max deliveries per rider shift</Label>
              <Input
                type="number"
                value={maxStops}
                onChange={(e) => setMaxStops(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Medical priority protocols */}
        <div className="border rounded-lg p-5 bg-card space-y-4">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground border-b pb-3">
            <ShieldCheck className="h-4 w-4" /> Medical priority protocols
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Emergency override lane</Label>
              <p className="text-[11px] text-muted-foreground">
                Lock priority queue status for cold-chain vaccines and critical medical supplies.
              </p>
            </div>
            <Switch checked={medicalPriority} onCheckedChange={setMedicalPriority} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Chain-of-custody photo verification</Label>
              <p className="text-[11px] text-muted-foreground">
                Require driver photo and recipient signature confirmation before completing medical drop-off.
              </p>
            </div>
            <Switch checked={photoChain} onCheckedChange={setPhotoChain} />
          </div>
        </div>

        {/* Section 3: Notification gateways */}
        <div className="border rounded-lg p-5 bg-card space-y-4">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground border-b pb-3">
            <Bell className="h-4 w-4" /> Notification gateways
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">SMS customer alerts (Twilio)</Label>
              <p className="text-[11px] text-muted-foreground">
                Dispatch automated SMS tracking links when package status changes.
              </p>
            </div>
            <Switch checked={smsGateway} onCheckedChange={setSmsGateway} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">WhatsApp Business API</Label>
              <p className="text-[11px] text-muted-foreground">
                Send interactive WhatsApp notifications with live map tracking buttons.
              </p>
            </div>
            <Switch checked={whatsappApi} onCheckedChange={setWhatsappApi} />
          </div>
        </div>

        {/* Section 4: Security & API access */}
        <div className="border rounded-lg p-5 bg-card space-y-4">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground border-b pb-3">
            <Key className="h-4 w-4" /> Security & API access
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Example API key (placeholder — no live environment issues real keys yet)</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-9 text-xs font-mono flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  toast.success("API key copied to clipboard");
                }}
              >
                Copy Key
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
