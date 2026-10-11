import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { MongoClient } from "mongodb";

/**
 * Local smoke helper: mints a real better-auth session cookie for an existing
 * staff account so the admin pages/APIs can be curl-tested without a mailbox.
 * Usage: node scripts/smoke-session.mjs [email]
 * Prints: COOKIE=<value>
 */

function env(name) {
  const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const match = raw.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

const email = (process.argv[2] || "owner@alliedone.test").toLowerCase();
const uri = env("MONGODB_URI");
if (!uri) {
  console.error("MONGODB_URI missing");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db();

const user = await db.collection("user").findOne({ email });
if (!user) {
  console.error(`no user ${email}`);
  process.exit(1);
}

const now = new Date();
// Equivalent to having just completed /secure-admin-login (2FA stamp).
await db
  .collection("user")
  .updateOne({ email }, { $set: { staff2faAt: now.toISOString() } });

const token = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
await db.collection("session").insertOne({
  token,
  userId: String(user._id),
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  ipAddress: "127.0.0.1",
  userAgent: "smoke-test",
  createdAt: now,
  updatedAt: now,
});

await client.close();

// better-auth signs the session cookie: encodeURIComponent(token + "." + base64(hmac)).
const secret = env("BETTER_AUTH_SECRET") || env("AUTH_SECRET");
const signature = createHmac("sha256", secret).update(token).digest("base64");
const cookie = encodeURIComponent(`${token}.${signature}`);
console.log(`COOKIE=${cookie}`);
console.log(`RAW=${token}`);
