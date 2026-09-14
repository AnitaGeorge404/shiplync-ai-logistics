import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

await sql`
  ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS receiver_floor_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS receiver_has_security_checkpoint boolean NOT NULL DEFAULT false
`;

console.log("Migration applied: receiver_floor_count, receiver_has_security_checkpoint columns added to shipments.");
await sql.end();
