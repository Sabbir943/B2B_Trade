import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { client, db, supportsTransactions } from "./db";

export const auth = betterAuth({
  database: mongodbAdapter(db, supportsTransactions ? { client } : undefined),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
});
