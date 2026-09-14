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

console.log("=== Last-mile ETA factors: stairs + security checkpoint (REQ-3.4) ===");

const email = `lastmile-${Date.now()}@shiplync.test`;
const su = await call("/api/auth/sign-up/email", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password: "e2e-test-pass-123", name: "Last Mile Test" }),
});
const cookie = su.headers.get("set-cookie")?.split(";")[0];

const base = {
  senderName: "Test Sender", senderPhone: "9000000000", senderAddressLine: "88 Marine Drive", senderCity: "Mumbai", senderState: "Maharashtra", senderPincode: "400002",
  receiverName: "Test Receiver", receiverPhone: "9000000002", receiverAddressLine: "Test Address Line", receiverCity: "Mumbai", receiverState: "Maharashtra", receiverPincode: "400010",
  weightKg: 2.5, lengthCm: 30, widthCm: 20, heightCm: 15, packageType: "standard", priority: "normal", insured: false,
};

async function book(overrides) {
  return call("/api/shipments", {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ ...base, ...overrides }),
  });
}

const groundFloorRes = await book({});
const groundFloorData = await groundFloorRes.json();
check("ground-floor, no checkpoint booking accepted (201)", groundFloorRes.status === 201);
check("default receiverFloorCount is 0", groundFloorData.shipment?.receiverFloorCount === 0);
check("default receiverHasSecurityCheckpoint is false", groundFloorData.shipment?.receiverHasSecurityCheckpoint === false);

const stairsRes = await book({ receiverFloorCount: 5 });
const stairsData = await stairsRes.json();
check("5-floor walk-up booking accepted (201)", stairsRes.status === 201);
check("receiverFloorCount persisted as 5", stairsData.shipment?.receiverFloorCount === 5);

const checkpointRes = await book({ receiverHasSecurityCheckpoint: true });
const checkpointData = await checkpointRes.json();
check("security-checkpoint booking accepted (201)", checkpointRes.status === 201);
check("receiverHasSecurityCheckpoint persisted as true", checkpointData.shipment?.receiverHasSecurityCheckpoint === true);

const bothRes = await book({ receiverFloorCount: 5, receiverHasSecurityCheckpoint: true });
const bothData = await bothRes.json();

const groundEtaMs = new Date(groundFloorData.shipment.estimatedDeliveryAt) - new Date(groundFloorData.shipment.createdAt);
const stairsEtaMs = new Date(stairsData.shipment.estimatedDeliveryAt) - new Date(stairsData.shipment.createdAt);
const checkpointEtaMs = new Date(checkpointData.shipment.estimatedDeliveryAt) - new Date(checkpointData.shipment.createdAt);
const bothEtaMs = new Date(bothData.shipment.estimatedDeliveryAt) - new Date(bothData.shipment.createdAt);

console.log(`  ground floor, no checkpoint: ${(groundEtaMs / 36e5).toFixed(2)}h`);
console.log(`  5 floors, no checkpoint:     ${(stairsEtaMs / 36e5).toFixed(2)}h`);
console.log(`  ground floor, checkpoint:    ${(checkpointEtaMs / 36e5).toFixed(2)}h`);
console.log(`  5 floors + checkpoint:       ${(bothEtaMs / 36e5).toFixed(2)}h`);

check("5-floor walk-up genuinely increases the ETA vs ground floor", stairsEtaMs > groundEtaMs);
check("a security checkpoint genuinely increases the ETA vs no checkpoint", checkpointEtaMs > groundEtaMs);
check("floors + checkpoint together add more than either alone", bothEtaMs > stairsEtaMs && bothEtaMs > checkpointEtaMs);
// 5 floors * 4 min = 20 min = 0.333h; expect within a tight tolerance of the base.
check("5-floor penalty is roughly the expected ~20 minutes (not some fabricated large jump)", stairsEtaMs - groundEtaMs >= 15 * 60 * 1000 && stairsEtaMs - groundEtaMs <= 25 * 60 * 1000);
check("security-checkpoint penalty is roughly the expected ~12 minutes", checkpointEtaMs - groundEtaMs >= 8 * 60 * 1000 && checkpointEtaMs - groundEtaMs <= 16 * 60 * 1000);

// Server-side bound: an absurd floor count must be rejected, not silently accepted.
const absurdRes = await book({ receiverFloorCount: 99999 });
check("REJECTED: absurd floor count (400)", absurdRes.status === 400);

console.log(`\n=== ${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`} ===`);
process.exit(failures === 0 ? 0 : 1);
