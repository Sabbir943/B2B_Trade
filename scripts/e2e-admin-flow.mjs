/**
 * One-off e2e probe for the local admin flow — marks a user emailVerified
 * (simulating a completed OTP check) so the sign-in step can be exercised.
 *   node scripts/e2e-admin-flow.mjs <email>
 */
import fs from "node:fs";
import { MongoClient } from "mongodb";

function env(name) {
  const text = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
  const match = text.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
}

const email = String(process.argv[2] || "").toLowerCase();
if (!email) {
  console.error("usage: node scripts/e2e-admin-flow.mjs <email>");
  process.exit(1);
}

const client = new MongoClient(env("MONGODB_URI"));
await client.connect();
const users = client.db().collection("user");

const existing = await users.findOne({ email });
if (existing) {
  await users.updateOne({ email }, { $set: { emailVerified: true } });
  console.log(`verified ${email} (role=${existing.role || "company_member"})`);
} else {
  console.log(`user ${email} not found — sign up first`);
}
await client.close();
