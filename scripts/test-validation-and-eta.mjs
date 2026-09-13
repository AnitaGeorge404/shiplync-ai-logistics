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

console.log("=== Validation + distance-based ETA test ===");

const email = `val-${Date.now()}@shiplync.test`;
const su = await call("/api/auth/sign-up/email", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password: "e2e-test-pass-123", name: "Val Test" }),
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

check("REJECTED: invalid phone", (await book({ senderPhone: "12345" })).status === 400);
check("REJECTED: invalid pincode", (await book({ senderPincode: "12" })).status === 400);
check("REJECTED: blank address", (await book({ senderAddressLine: "   " })).status === 400);
check("REJECTED: zero weight", (await book({ weightKg: 0 })).status === 400);
check("REJECTED: negative weight", (await book({ weightKg: -5 })).status === 400);
check("REJECTED: weight over max", (await book({ weightKg: 99999 })).status === 400);
check("REJECTED: zero dimension", (await book({ lengthCm: 0 })).status === 400);
check("REJECTED: missing city", (await book({ senderCity: "" })).status === 400);
check("ACCEPTED: fully valid payload", (await book({})).status === 201);

// Distance-based ETA: same-city should be meaningfully faster than
// a long cross-country route, for the identical package profile.
const localRes = await book({ receiverCity: "Mumbai", receiverState: "Maharashtra", receiverPincode: "400010" });
const localData = await localRes.json();

const longRes = await book({ senderCity: "Delhi", senderState: "Delhi", senderPincode: "110001", receiverCity: "Kochi", receiverState: "Kerala", receiverPincode: "682001" });
const longData = await longRes.json();

const localEtaMs = new Date(localData.shipment.estimatedDeliveryAt) - new Date(localData.shipment.createdAt);
const longEtaMs = new Date(longData.shipment.estimatedDeliveryAt) - new Date(longData.shipment.createdAt);

console.log(`  local (Mumbai->Mumbai) ETA: ${(localEtaMs / 36e5).toFixed(1)}h, distance: ${localData.shipment.distanceKm?.toFixed(0)}km`);
console.log(`  long (Delhi->Kochi) ETA: ${(longEtaMs / 36e5).toFixed(1)}h, distance: ${longData.shipment.distanceKm?.toFixed(0)}km`);

check("Long-distance shipment has a longer ETA than local", longEtaMs > localEtaMs);
check("Long-distance shipment has a larger real distanceKm", longData.shipment.distanceKm > localData.shipment.distanceKm);
check("Long route ETA is roughly 2-4 days", longEtaMs / 36e5 >= 40 && longEtaMs / 36e5 <= 110);
check("Local route ETA is roughly 1 day", localEtaMs / 36e5 >= 15 && localEtaMs / 36e5 <= 30);

// Priority/package type should change the ETA for the identical route.
const medicalRes = await book({
  senderCity: "Delhi", senderState: "Delhi", senderPincode: "110001",
  receiverCity: "Kochi", receiverState: "Kerala", receiverPincode: "682001",
  packageType: "medical",
});
const medicalData = await medicalRes.json();
const medicalEtaMs = new Date(medicalData.shipment.estimatedDeliveryAt) - new Date(medicalData.shipment.createdAt);
console.log(`  medical (Delhi->Kochi) ETA: ${(medicalEtaMs / 36e5).toFixed(1)}h`);
check("Medical priority is faster than standard on the identical route", medicalEtaMs < longEtaMs);

console.log(`\n=== ${failures === 0 ? "ALL VALIDATION/ETA CHECKS PASSED" : `${failures} CHECK(S) FAILED`} ===`);
process.exit(failures === 0 ? 0 : 1);
