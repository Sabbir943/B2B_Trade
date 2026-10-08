import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { client, db, supportsTransactions } from "./db";

const envOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: mongodbAdapter(db, supportsTransactions ? { client } : undefined),
  trustedOrigins: [
    // Dev server can be on any local port (3000, 3001, …) — wildcard covers them.
    "http://localhost:*",
    "https://localhost:*",
    "http://127.0.0.1:*",
    ...envOrigins,
  ],
  emailAndPassword: {
    enabled: true,
    // Sign-in is blocked until the email is verified (OTP flow).
    // Sign-up therefore returns { token: null } and does NOT auto sign-in —
    // the client sends an OTP and routes to /verify-otp instead.
    requireEmailVerification: true,
  },
  emailVerification: {
    // OTP emails go out through our own backend/ service, not better-auth.
    sendOnSignUp: false,
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
