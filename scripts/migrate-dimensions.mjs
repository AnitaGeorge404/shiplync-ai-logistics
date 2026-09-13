import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

await sql`
  ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS length_cm double precision,
    ADD COLUMN IF NOT EXISTS width_cm double precision,
    ADD COLUMN IF NOT EXISTS height_cm double precision,
    ADD COLUMN IF NOT EXISTS distance_km double precision
`;

console.log("Migration applied: length_cm, width_cm, height_cm, distance_km on shipments");
await sql.end();
process.exit(0);
