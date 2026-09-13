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

console.log("=== Elderly-care prioritization + pickup scheduling + cron exception sweep (REQ-2.4, REQ-4.1, REQ-7.4) ===");

const email = `elderly-${Date.now()}@shiplync.test`;
const su = await call("/api/auth/sign-up/email", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password: "e2e-test-pass-123", name: "Elderly Test" }),
});
const cookie = su.headers.get("set-cookie")?.split(";")[0];

const base = {
  senderName: "Test Sender", senderPhone: "9000000000", senderAddressLine: "88 Marine Drive", senderCity: "Mumbai", senderState: "Maharashtra", senderPincode: "400002",
  receiverName: "Test Receiver", receiverPhone: "9000000002", receiverAddressLine: "Test Address Line", receiverCity: "Bengaluru", receiverState: "Karnataka", receiverPincode: "560066",
  weightKg: 2.5, lengthCm: 30, widthCm: 20, heightCm: 15, packageType: "standard", priority: "normal", insured: false,
};

async function book(overrides) {
  return call("/api/shipments", {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ ...base, ...overrides }),
  });
}

// REQ-2.4: elderly care alone (no medical packageType) must still auto-escalate to high priority.
const elderlyRes = await book({ elderlyCare: true });
const elderlyData = await elderlyRes.json();
check("elderly-care shipment booked (201)", elderlyRes.status === 201);
check("elderly-care alone auto-escalates priority to 'high'", elderlyData.shipment?.priority === "high");
check("elderly-care flag persisted", elderlyData.shipment?.elderlyCare === true);

// Standard, non-elderly shipment stays normal priority (control case).
const normalRes = await book({});
const normalData = await normalRes.json();
check("non-elderly standard shipment stays 'normal' priority", normalData.shipment?.priority === "normal");

// REQ-4.1: pickup date is accepted and persisted.
const pickupIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const pickupRes = await book({ pickupDate: pickupIso });
const pickupData = await pickupRes.json();
check("pickup date accepted (201)", pickupRes.status === 201);
check("pickup date persisted on the shipment", !!pickupData.shipment?.pickupDate);

// REQ-7.4: the cron-triggered automatic exception sweep must require the
// shared secret, not a staff session — proving it's reachable by a
// scheduler with no logged-in user, and rejects anyone without the secret.
const noAuthCron = await call("/api/cron/detect-exceptions");
check("SECURITY: cron endpoint rejects requests with no secret (401)", noAuthCron.status === 401);

const wrongSecretCron = await call("/api/cron/detect-exceptions", { headers: { authorization: "Bearer wrong-secret" } });
check("SECURITY: cron endpoint rejects an incorrect secret (401)", wrongSecretCron.status === 401);

if (process.env.CRON_SECRET) {
  const realCron = await call("/api/cron/detect-exceptions", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  const realCronData = await realCron.json();
  check("cron endpoint runs the real sweep with the correct secret (200)", realCron.status === 200);
  check("cron sweep returns a created-count and timestamp", typeof realCronData.created !== "undefined" && !!realCronData.ranAt);
} else {
  console.log("  (skipping authorized-cron-run check: CRON_SECRET not set in this environment)");
}

console.log(`\n=== ${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`} ===`);
process.exit(failures === 0 ? 0 : 1);
