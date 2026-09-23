# ShipLync — Project Progress Report

**Course:** CSE312 — Software Architecture: Principles and Practices
**Team:** Group 6 — Anita George (2024BCS0072), Abhinav Jayan (2024BCS0044), Amey Prasad (2024BCS0036), Lestlin Robins (2024BCS0060)
**Institution:** IIIT Kottayam

---
## 1. What ShipLync is

ShipLync is a courier & logistics management platform covering the full shipment lifecycle — booking, hub intake/dispatch, delivery, exceptions/returns — across four roles: **Customer**, **Delivery Agent**, **Hub Staff**, and **Administrator**, as defined in the SRS (v1.0, approved).

## 2. Current status of UI, backend, and database

| Layer | Status |
|---|---|
| **UI** | Complete for all four portals. Every screen in the SRS/README scope is built (not stubbed) using React 19 + TanStack Start + Tailwind. |
| **Database** | **Real and live** — PostgreSQL hosted on Supabase, schema managed with Drizzle ORM. 13 tables covering users, shipments, shipment events (audit trail), hubs, vehicles, delivery attempts, payments, notifications, and exceptions — modeled directly from SRS section 4 (REQ-1 through REQ-7). |
| **Backend** | **Real and live** — TanStack Start server routes backed by better-auth (real sessions, hashed passwords, role field) and a typed API layer with Zod validation covering the full shipment lifecycle, not just booking. |
| **Integration** | Demonstrated end-to-end across **all four roles**: a customer books a shipment → hub staff scans it in and dispatches it to a delivery agent → the agent advances its status and records a delivery outcome → the system auto-detects exceptions from real data → the customer sees live status and notifications. Verified both via the UI and directly against the running API (Section 6). |

## 3. Functionalities — Completed

- **REQ-1 User Management**: Real registration & login (email/password) via better-auth, sessions persisted server-side, role field (`customer`/`delivery_agent`/`hub_staff`/`admin`) on the user model, server-side role checks on every write endpoint.
- **REQ-2 Shipment Request and Creation**: Customer booking form submits real sender/receiver/parcel data; server validates input (Zod), computes cost deterministically from weight/package type/priority/insurance (`src/lib/pricing.ts`), generates a unique tracking ID, persists the shipment.
- **REQ-2.4 Critical delivery prioritization**: Medical packages are automatically escalated to at least "high" priority server-side (verified: a "normal" priority medical booking was auto-escalated to "high" in the persisted row).
- **REQ-3 Shipment Tracking and Status Management**: Full status lifecycle (`booked → arrived_hub → out_for_delivery → delivered`, etc.) is written by hub staff and delivery agents through role-gated endpoints, not just read by customers. Every transition is appended to `shipment_events`, giving a real audit trail that the existing tracking-timeline UI renders.
- **REQ-4 Pickup, Delivery, and Assignment Management**: Hub Dispatch screen has a live panel that assigns a real delivery agent to an unassigned shipment and dispatches it — writes `assignedAgentId` and advances status in one action.
- **REQ-5 Hub and Transit Operations**: Hub Intake screen has a live scan panel — entering a real tracking ID looks it up and marks it `arrived_hub` in the database.
- **REQ-6 Delivery Exceptions and Returns**: Delivery agents record real delivery attempts (delivered / receiver unavailable / refused / rescheduled / returned) via the Driver Deliveries screen; failed attempts move the shipment to `delivery_attempted`, a `returned` outcome moves it to `returned`, and `delivered` sets `deliveredAt`.
- **REQ-7 Administrative Monitoring**: Admin Exceptions screen runs a real, deterministic detection sweep (`src/lib/exception-detection.ts`) against live shipment data — three rules: **stationary >48h** (matches the SRS 4.7 example verbatim), **delayed past ETA**, and **repeated failed deliveries (≥2)** — and lets admins resolve flagged exceptions.
- **Notifications**: A notification row is created on every meaningful event (booked, agent assigned, delivery failed, delivered, etc.) and the Admin Notifications screen shows a live feed of the signed-in account's real notifications.
- **Reports**: Admin Reports screen has a working "Export real shipments (CSV)" button that streams a live CSV from the database.
- All four portal UIs — dashboards, booking, tracking, deliveries, hub intake/dispatch, exceptions, fleet, users, reports, settings — built, navigable, and now backed by real write paths for every core workflow above.

## 4. Functionalities — Partially completed

- Real-time propagation of status changes to other portals currently relies on **polling** (5–10s refetch intervals via react-query on the wired panels), not the sub-2-second push the SRS P3 describes as ideal — acceptable for the demo, listed as a follow-up.
- The originally mock-data-driven tables on these screens (e.g. the full Dispatch batch table, Hub intake scan history) still show illustrative demo rows alongside the new real panels — the real panels are additive so the existing polished UI wasn't torn out mid-review; a full swap-over is the natural next step.
- Assignment currently supports agent-only (vehicle/hub reassignment endpoints exist server-side — `POST /api/shipments/:id/assign` accepts `vehicleId`/`hubId` too — but no UI control for those two yet).

## 5. Functionalities — Yet to be implemented

- OTP/photo/signature capture for proof of delivery (schema fields exist on `delivery_attempts`; no capture UI).
- PDF/Excel report formats (CSV is implemented; the "Generate Custom Report" dialog is still UI-only for other formats).
- Payment gateway integration — payments are modeled and recorded, not actually processed (explicitly out of scope without a real gateway account).
- Scheduled/automatic exception detection (currently triggered on-demand by an admin action or the page's periodic refetch, not a background cron job).

## 6. Backend/database verification (for the demo)

Verified directly against the running server, independent of the UI:

1. `POST /api/auth/sign-up/email` → real row in `user` table, real session.
2. `POST /api/shipments` → server computed cost and tracking ID, persisted; a "medical" package sent with `priority: "normal"` was **auto-escalated to `"high"`** server-side (REQ-2.4).
3. **Full lifecycle chain** run against a fresh shipment: hub staff scan → `PATCH /status → arrived_hub` → `POST /assign` (real delivery agent) → `PATCH /status → out_for_delivery` → agent `POST /attempts {outcome:"delivered"}` → final `GET /track` returned `status: "delivered"` with a complete event trail: `booked → arrived_hub → arrived_hub → out_for_delivery → delivered`.
4. `POST /api/exceptions/detect` → after two failed delivery attempts were logged on a shipment, the detector correctly created a `repeated_failed_delivery` exception with a human-readable message, retrievable via `GET /api/exceptions`.
5. `GET /api/reports/shipments.csv` (admin-only) → returns a real CSV of persisted shipments.
6. `GET /api/notifications` → returns the real notification rows generated by the above actions.

Demo accounts (all use password `shiplync-demo-2026`, created by `scripts/seed.mjs`):
- `customer1@shiplync.test` — customer (Demo Customer)
- `agent1@shiplync.test` — delivery agent (Ravi Kumar)
- `hub1@shiplync.test` — hub staff (Bengaluru Dispatch Center)
- `admin1@shiplync.test` — admin (Ops Admin)

To reproduce live: run `npm run dev`, sign in as the customer, book a shipment, then sign in (separate browser/incognito) as `hub1@shiplync.test` to scan it in and dispatch it via **Hub → Intake / Dispatch**, then as `agent1@shiplync.test` to advance and complete it via **Driver → Deliveries**, then as `admin1@shiplync.test` to run detection and export the CSV via **Admin → Exceptions / Reports**.

## 7. Significant changes from the original design

- **Database**: SRS calls for "a centralized cloud database" without naming a product. We chose **Supabase Postgres** with **Drizzle ORM** for type-safe queries and schema management.
- **Deployment target**: The Lovable-generated scaffold defaulted to Cloudflare Workers (via Nitro). We moved this to a standard **Node server target**, since the team is deploying to **Render**, and Cloudflare Workers cannot open the raw TCP connections Postgres needs without extra infrastructure (Hyperdrive) we don't need here.
- **Auth**: Implemented with **better-auth** (hashed passwords, real sessions, role stored on the user record) rather than building session handling from scratch.
- **Pricing/ETA "AI"**: The README describes an elaborate AI ETA/routing engine. We implemented it as a documented, deterministic rule set (base fare + weight rate + package-type surcharge + priority multiplier; ETA bucketed by priority/package type) rather than a black-box model — consistent with the SRS's actual wording ("calculate shipment charges based on **predefined attributes**").
- **Exception detection**: Implemented as three explicit, auditable threshold rules over real timestamps (not a trained model) — directly traceable to SRS REQ-7.4's own example ("a package remains stationary at a hub for 48 hours").
- **UI integration strategy**: Rather than rewriting each heavily-designed existing screen wholesale (high risk of breaking a working, polished UI under a review deadline), real-data panels were added additively to the Driver, Hub, and Admin screens that actually perform the database writes, sitting alongside the original illustrative UI.

## 8. Problems/challenges encountered

- **Cloudflare vs. Node target**: The project's Vite config silently defaulted to a Cloudflare Workers build, incompatible with a normal Postgres driver. Resolved by pinning the Nitro preset to `node-server`.
- **better-auth ⇄ Drizzle schema drift**: better-auth expects additional columns on its `account`/`verification` tables (OAuth token fields, `updatedAt`) beyond the minimal shape first written. Diagnosed from the server's own schema-mismatch error log and fixed by extending the Drizzle schema.
- **`drizzle-kit push` instability**: The CLI's introspection crashed on a second run against the live Supabase database. Worked around by applying the remaining column diff as a direct SQL patch (`scripts/fix-account-columns.mjs`).
- **Supabase pooled connection**: The pooled (pgbouncer) connection doesn't support prepared statements; the Postgres client is explicitly configured with `prepare: false`.
- **better-auth CORS/origin check**: Local dev ran on a non-default port (8081, since 8080 was occupied), and better-auth rejected requests as "Invalid origin" until common dev ports were added to `trustedOrigins`.
- **Time constraint**: given the review deadline, backend logic and its correctness were prioritized over rewriting every existing mock screen — each REQ area now has a genuine, tested, real write path even where the surrounding screen still also shows illustrative demo rows.

## 9. Next steps (post-review)

1. Fully retire the remaining mock-data-only tables in favor of the real panels.
2. Add vehicle/hub reassignment controls to the Hub Dispatch UI (endpoints already support it).
3. Move exception detection to a scheduled job instead of on-demand/polling.
4. Add OTP/photo/signature capture for proof of delivery.
5. Deploy to Render with the Supabase connection string as an environment variable.
