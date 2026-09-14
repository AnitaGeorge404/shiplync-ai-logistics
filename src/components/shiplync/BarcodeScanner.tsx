import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

// REQ-5.3: real optical barcode identification via the device camera — not
// just a typed tracking-ID field. Uses ZXing (github.com/zxing-js), which
// reads CODE128/QR/EAN and most common formats through getUserMedia; no
// server round-trip, decoding happens entirely in the browser.
export function BarcodeScanner({ onDetected }: { onDetected: (text: string) => void }) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, err, controls) => {
        controlsRef.current = controls;
        if (cancelled) return;
        if (result) {
          onDetected(result.getText());
          controls.stop();
          setActive(false);
        }
        // NotFoundException fires continuously while no barcode is in
        // frame — that's normal scanning, not an error to surface.
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Could not access the camera.");
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [active, onDetected]);

  if (!active) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-10 text-xs gap-1.5"
        onClick={() => {
          setError(null);
          setActive(true);
        }}
      >
        <Camera className="h-4 w-4" /> Scan with camera
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-lg overflow-hidden border bg-black aspect-video max-w-sm">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <div className="absolute inset-8 border-2 border-primary/70 rounded-md pointer-events-none" />
      </div>
      {error ? (
        <div className="text-xs text-destructive">{error}</div>
      ) : (
        <div className="text-xs text-muted-foreground">Point the camera at the shipment's barcode.</div>
      )}
      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setActive(false)}>
        <X className="h-3.5 w-3.5" /> Cancel
      </Button>
    </div>
  );
}
