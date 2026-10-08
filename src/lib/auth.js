import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { client, db, supportsTransactions } from "./db";

export const auth = betterAuth({
  database: mongodbAdapter(db, supportsTransactions ? { client } : undefined),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      // Role is assigned by the Super Admin / provisioning script only —
      // `input: false` rejects any client-supplied value at sign-up or update,
      // so a user can never escalate themselves.
      role: {
        type: "string",
        defaultValue: "company_member",
        input: false,
      },
      // Membership tier (Free / Silver / Gold / Platinum) — also not client-settable.
      tier: {
        type: "string",
        defaultValue: "free",
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});
