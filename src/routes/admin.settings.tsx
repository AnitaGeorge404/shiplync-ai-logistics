import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Sparkles,
  ShieldCheck,
  Bell,
  Key,
  Save,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings — Admin Dashboard" },
      { name: "description", content: "Configure AI dispatch thresholds, medical priority lanes, API integrations, and security settings." },
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
    toast.success("Platform settings updated successfully");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Platform Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure system parameters, AI dispatch engine, medical lane protocols, and API integration keys.
          </p>
        </div>

        <Button size="sm" className="h-9 text-xs gap-1.5" onClick={handleSave}>
          <Save className="h-3.5 w-3.5" /> Save Changes
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: AI Dispatch Engine */}
        <div className="border rounded-lg p-5 bg-card space-y-4">
          <div className="flex items-center gap-2 font-display font-semibold text-base text-foreground border-b pb-3">
            <Sparkles className="h-4 w-4 text-foreground" /> AI Dispatch Engine
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Autonomous Route Optimization</Label>
              <p className="text-[11px] text-muted-foreground">
                Automatically cluster parcel stops and reassign riders when congestion is detected.
              </p>
            </div>
            <Switch checked={aiAutonomous} onCheckedChange={setAiAutonomous} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Predictive Delay Threshold (minutes)</Label>
              <Input
                type="number"
                value={delayThreshold}
                onChange={(e) => setDelayThreshold(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Max Deliveries per Rider Shift</Label>
              <Input
                type="number"
                value={maxStops}
                onChange={(e) => setMaxStops(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Medical Priority Protocols */}
        <div className="border rounded-lg p-5 bg-card space-y-4">
          <div className="flex items-center gap-2 font-display font-semibold text-base text-foreground border-b pb-3">
            <ShieldCheck className="h-4 w-4 text-foreground" /> Medical Priority Protocols
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Emergency Override Lane</Label>
              <p className="text-[11px] text-muted-foreground">
                Lock priority queue status for cold-chain vaccines and critical medical supplies.
              </p>
            </div>
            <Switch checked={medicalPriority} onCheckedChange={setMedicalPriority} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Chain-of-Custody Photo Verification</Label>
              <p className="text-[11px] text-muted-foreground">
                Require driver photo and recipient signature confirmation before completing medical drop-off.
              </p>
            </div>
            <Switch checked={photoChain} onCheckedChange={setPhotoChain} />
          </div>
        </div>

        {/* Section 3: Notification Integrations */}
        <div className="border rounded-lg p-5 bg-card space-y-4">
          <div className="flex items-center gap-2 font-display font-semibold text-base text-foreground border-b pb-3">
            <Bell className="h-4 w-4 text-foreground" /> Notification Gateways
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">SMS Customer Alerts (Twilio)</Label>
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

        {/* Section 4: Security & API Keys */}
        <div className="border rounded-lg p-5 bg-card space-y-4">
          <div className="flex items-center gap-2 font-display font-semibold text-base text-foreground border-b pb-3">
            <Key className="h-4 w-4 text-foreground" /> Security & API Access
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Live Environment API Key</Label>
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
