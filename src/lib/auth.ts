import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:5173",
    // Vercel injects VERCEL_URL (host only, no scheme) for every
    // deployment — production and preview alike — so this covers each
    // preview URL automatically without hardcoding hashes that change
    // on every deploy.
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    // Stable production domains (add custom domains here too if you attach one).
    "https://shiplync-ai-logistics-git-main-anita-georges-projects.vercel.app",
  ],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      hubId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
