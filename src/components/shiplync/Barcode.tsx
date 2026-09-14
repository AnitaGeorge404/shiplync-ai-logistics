import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

// REQ-5.3: a real CODE128 barcode encoding the tracking ID — not a QR
// placeholder or a styled text string. This is what a hub-intake camera
// scan (see BarcodeScanner.tsx) is actually meant to read off a shipping
// label or a printed/on-screen tracking confirmation.
export function Barcode({ value, height = 60 }: { value: string; height?: number }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    JsBarcode(ref.current, value, {
      format: "CODE128",
      height,
      width: 1.8,
      fontSize: 12,
      margin: 8,
      background: "transparent",
    });
  }, [value, height]);

  return <svg ref={ref} role="img" aria-label={`Barcode for ${value}`} />;
}
