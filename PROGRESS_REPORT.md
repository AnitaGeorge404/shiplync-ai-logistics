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
| **Backend** | **Real and live** — TanStack Start server routes backed by better-auth (real sessions, hashed passwords, role field) and a typed API layer with Zod validation. No longer a static mock array for the flows listed below. |
| **Integration** | Demonstrated end-to-end for the **customer shipment flow**: sign up/sign in → book shipment → real cost + tracking ID generated server-side → persisted to Postgres → visible in shipment history → trackable by tracking ID. Verified both via the UI and directly against the running API (see Section 6). |

## 3. Functionalities — Completed

- **REQ-1 User Management**: Real registration & login (email/password) via better-auth, sessions persisted server-side, role field (`customer`/`delivery_agent`/`hub_staff`/`admin`) on the user model, server-side session validation on every API call.
- **REQ-2 Shipment Request and Creation**: Customer booking form submits real sender/receiver/parcel data; server validates input (Zod), computes cost deterministically from weight/package type/priority/insurance (`src/lib/pricing.ts`), generates a unique tracking ID, and persists the shipment.
- **REQ-2.4 Critical delivery prioritization**: Medical packages are automatically escalated to at least "high" priority server-side, independent of what the form sends.
- **REQ-3 partial (status display)**: Shipment status, cost, and an initial ETA estimate are stored and returned by the tracking API; the customer tracking page renders real DB-backed shipments (in addition to the original demo data) through the existing map/timeline UI.
- Shipment audit trail: every status change is recorded as an append-only `shipment_events` row (this is what REQ-3.1–3.2 and the timeline UI are meant to read from).
- All four portal UIs (Customer, Delivery Agent, Hub Staff, Admin) — dashboards, booking, tracking, deliveries, hub intake/dispatch, exceptions, fleet, users, reports, settings — built and navigable.

## 4. Functionalities — Partially completed

- **REQ-3 (full tracking)**: Only the customer-facing tracking read path is wired to the DB; live status *updates* from delivery agents/hub staff are not yet writing to the real database (still mock UI).
- **REQ-4 Pickup/Assignment**: Data model exists (`assignedAgentId`, `assignedVehicleId` on `shipments`), but the assignment UI in the Hub/Admin portals is not yet wired to real writes.
- **REQ-5 Hub/Transit Operations**: Hub tables (`hubs`, `vehicles`) exist in the DB; intake/scan/dispatch screens are still UI-only.
- **REQ-7 Admin Monitoring**: `exceptions` table and severity/type enums exist in the schema (stationary-too-long, repeated failed delivery, delayed-beyond-threshold, etc., matching REQ-7.4), but the detection logic that populates it automatically is not yet implemented — this is designed, not running.
- Notifications: schema and one write path exist (a notification is created on shipment booking); the notifications UI still reads mock data.

## 5. Functionalities — Yet to be implemented

- **REQ-6 Delivery Exceptions and Returns**: `delivery_attempts` table exists; no API/UI wiring yet.
- Delivery-agent and hub-staff write flows (pickup confirmation, hub scan, dispatch, delivery attempt/OTP/signature).
- Automated exception detection (the "AI monitoring" described in the README) — planned as deterministic rule evaluation over `shipment_events` timestamps, not implemented yet.
- Reports export (CSV/PDF/Excel).
- Real-time propagation of status changes to other portals (current plan: react-query polling, per SRS P3's 2-second requirement — not yet added).
- Payment gateway integration — payments are modeled and recorded, not actually processed (explicitly out of scope without a real gateway account).

## 6. Backend/database verification (for the demo)

The following was tested directly against the running server during development, independent of the UI, to confirm the integration is real and not simulated:

1. `POST /api/auth/sign-up/email` → creates a real row in the `user` table (Supabase), returns a real session token.
2. `POST /api/shipments` (authenticated) → server computed `cost: 932.2` from weight/package-type/insurance inputs and generated tracking ID `SLX4D3P6H4D06`; row persisted in the `shipments` table, plus a `shipment_events` "booked" row and a `notifications` row.
3. `GET /api/shipments/track/:trackingId` → returns the persisted shipment (public tracking lookup, no auth required, per SRS REQ-3.3).
4. `GET /api/shipments` (authenticated) → returns only the logged-in customer's shipments (role/ownership scoping).

To reproduce live during the demo: run `npm run dev`, sign up as a new customer, book a shipment, then view it in **Shipment History** and via its tracking link — the tracking ID and cost shown are computed by the server, not hardcoded.

## 7. Significant changes from the original design

- **Database**: SRS calls for "a centralized cloud database" without naming a product. We chose **Supabase Postgres** (team preference) with **Drizzle ORM** for type-safe queries and schema management.
- **Deployment target**: The Lovable-generated scaffold defaulted to Cloudflare Workers (via Nitro). We moved this to a standard **Node server target**, since the team is deploying to **Render**, and Cloudflare Workers cannot open the raw TCP connections Postgres needs without extra infrastructure (Hyperdrive) we don't need here.
- **Auth**: SRS just requires "secure login credentials" and role-based access; we implemented this with **better-auth** (hashed passwords, real sessions, role stored on the user record) rather than building session handling from scratch.
- **Pricing/ETA "AI"**: The README describes an elaborate AI ETA/routing engine. For this phase we implemented it as a documented, deterministic rule set (base fare + weight rate + package-type surcharge + priority multiplier; ETA bucketed by priority/package type) rather than a black-box model — consistent with the SRS's actual wording ("calculate shipment charges based on **predefined attributes**").

## 8. Problems/challenges encountered

- **Cloudflare vs. Node target**: The project's Vite config silently defaulted to a Cloudflare Workers build, which is incompatible with a normal Postgres driver. Resolved by explicitly pinning the Nitro preset to `node-server`.
- **better-auth ⇄ Drizzle schema drift**: better-auth expects additional columns on its `account`/`verification` tables (OAuth token fields, `updatedAt`) beyond the minimal shape we first wrote. Diagnosed from the server's own schema-mismatch error log and fixed by extending the Drizzle schema to match.
- **`drizzle-kit push` instability**: The CLI's schema-diff/introspection crashed on a second run against the live Supabase database (a tooling bug unrelated to our schema). Worked around by applying the small remaining column diff as a direct SQL patch (`scripts/fix-account-columns.mjs`) instead of relying on the CLI for that step.
- **Supabase pooled connection**: The pooled (pgbouncer) connection string doesn't support prepared statements; the Postgres client is explicitly configured with `prepare: false` to avoid silent query failures.
- **Time constraint**: given the review deadline, we prioritized proving one complete, real vertical slice (auth → booking → persistence → tracking) end-to-end over partially wiring every screen — the remaining screens are UI-complete and are the next work items (see Section 4/5), not redesigns.

## 9. Next steps (post-review)

1. Wire delivery-agent and hub-staff status-update actions to real writes (advances REQ-4–REQ-6).
2. Implement the exception-detection job against `shipment_events` (REQ-7.4).
3. Add polling/live-refresh for cross-portal status visibility (SRS P3).
4. CSV export for admin reports.
5. Deploy to Render with the Supabase connection string as an environment variable.
