import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { ObjectId } from "mongodb";
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
    // OTP emails go out through our own route handlers (/api/otp/*), not better-auth.
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
      // Suspension stamp set by staff (member-admin-actions.js). Sign-in and
      // every guarded route check this; never client-settable.
      suspendedAt: {
        type: "string",
        input: false,
      },
      suspendedReason: {
        type: "string",
        input: false,
      },
      // Per-user extra permission strings, granted only by the Super Admin.
      // Merged into the role's grants in requirePermission (session.js).
      extraPermissions: {
        type: "string[]",
        input: false,
      },
    },
  },
  // Suspended accounts can never receive a new session (sign-in is blocked);
  // existing sessions are also rejected by requireAuth in src/lib/session.js.
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          try {
            // Better-auth stores session.userId as a string; the Mongo adapter
            // keeps _id as ObjectId, but hand-provisioned staff accounts use a
            // UUID string — match either form.
            const candidates = [{ _id: session.userId }];
            if (/^[0-9a-f]{24}$/i.test(String(session.userId))) {
              candidates.push({ _id: new ObjectId(session.userId) });
            }
            const user = await db
              .collection("user")
              .findOne({ $or: candidates }, { projection: { suspendedAt: 1 } });
            if (user?.suspendedAt) return false;
          } catch (error) {
            console.error("[auth] session hook failed", error.message);
          }
          return void 0;
        },
      },
    },
  },
  plugins: [nextCookies()],
});
