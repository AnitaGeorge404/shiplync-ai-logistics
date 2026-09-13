import "dotenv/config";
process.on("unhandledRejection", (e) => { console.error("UNHANDLED:", e); process.exit(1); });

const mod = await import("../.vercel/output/functions/__server.func/index.mjs");
const handler = mod.default ?? mod;

let failures = 0;
function check(label, cond) {
  console.log(`${cond ? "OK  " : "FAIL"} ${label}`);
  if (!cond) failures++;
}
async function call(path, opts = {}) {
  return handler.fetch(new Request(`http://localhost${path}`, opts), {}, {});
}
async function signIn(email) {
  const res = await call("/api/auth/sign-in/email", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "shiplync-demo-2026" }),
  });
  return res.headers.get("set-cookie")?.split(";")[0];
}

console.log("=== Hub currentHubId scoping test (regression for the bug found this session) ===");

const custEmail = `hubscope-${Date.now()}@shiplync.test`;
const su = await call("/api/auth/sign-up/email", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: custEmail, password: "e2e-test-pass-123", name: "Hub Scope Test" }),
});
const custCookie = su.headers.get("set-cookie")?.split(";")[0];

const bookRes = await call("/api/shipments", {
  method: "POST", headers: { "content-type": "application/json", cookie: custCookie },
  body: JSON.stringify({
    senderName: "Hub Scope Sender", senderPhone: "9000000000", senderAddressLine: "88 Marine Drive", senderCity: "Mumbai", senderState: "Maharashtra", senderPincode: "400002",
    receiverName: "Hub Scope Receiver", receiverPhone: "9000000002", receiverAddressLine: "12 FC Road", receiverCity: "Bengaluru", receiverState: "Karnataka", receiverPincode: "560066",
    weightKg: 1.5, lengthCm: 20, widthCm: 15, heightCm: 10, packageType: "standard", priority: "normal", insured: false,
  }),
});
const shipment = (await bookRes.json()).shipment;

const hubCookie = await signIn("hub1@shiplync.test");

const beforeScope = await call("/api/shipments?scope=hub", { headers: { cookie: hubCookie } });
const beforeData = await beforeScope.json();
const wasVisibleBefore = beforeData.shipments.some((s) => s.id === shipment.id);
console.log(`  before scan: visible in scope=hub? ${wasVisibleBefore}`);

const scanRes = await call(`/api/shipments/${shipment.id}/status`, {
  method: "PATCH", headers: { "content-type": "application/json", cookie: hubCookie },
  body: JSON.stringify({ status: "arrived_hub" }),
});
check("hub scan -> 200", scanRes.status === 200);
const scanned = (await scanRes.json()).shipment;
check("currentHubId is now set (was null before this session's fix)", !!scanned.currentHubId);
check("originHubId is now set too", !!scanned.originHubId);

const afterScope = await call("/api/shipments?scope=hub", { headers: { cookie: hubCookie } });
const afterData = await afterScope.json();
const visibleAfter = afterData.shipments.some((s) => s.id === shipment.id);
check("shipment now appears in hub_staff's scope=hub list", visibleAfter);

const hubsRes = await call("/api/hubs", { headers: { cookie: hubCookie } });
const hubsData = await hubsRes.json();
const thisHub = hubsData.hubs.find((h) => h.id === scanned.currentHubId);
check("hub's activeShipmentCount reflects this shipment", thisHub && thisHub.activeShipmentCount >= 1);

const trackRes = await call(`/api/shipments/track/${shipment.trackingId}`);
const trackData = await trackRes.json();
check("public tracking page now returns a real currentHubName", !!trackData.currentHubName);
console.log(`  currentHubName: ${trackData.currentHubName}`);

const lastEvent = trackData.events[trackData.events.length - 1];
check("shipment event location is the real hub name, not receiverCity", lastEvent.location === trackData.currentHubName);

console.log(`\n=== ${failures === 0 ? "ALL HUB-SCOPING CHECKS PASSED" : `${failures} CHECK(S) FAILED`} ===`);
process.exit(failures === 0 ? 0 : 1);
