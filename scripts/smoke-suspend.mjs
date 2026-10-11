import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

/**
 * Suspended-account enforcement check.
 * Simulates what suspendMember writes, then asks better-auth for a session
 * (the databaseHooks.session.create.before hook must refuse it).
 */
function env(name) {
  const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const match = raw.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

const email = process.argv[2] || "sectest1791644699@example.com";
const password = process.argv[3] || "Password123!";
const base = "http://localhost:3000/api/auth";

const client = new MongoClient(env("MONGODB_URI"));
await client.connect();
const db = client.db();
const user = await db.collection("user").findOne({ email });
console.log("user:", user ? `${user.email} role=${user.role} suspended=${Boolean(user.suspendedAt)}` : "not found");
if (!user) process.exit(1);

async function signIn(label) {
  const response = await fetch(`${base}/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
    body: JSON.stringify({ email, password, rememberMe: true }),
  });
  const body = await response.json().catch(() => ({}));
  console.log(`${label}: ${response.status} ${JSON.stringify(body).slice(0, 300)}`);
  return { response, body };
}

// 1. clean state → sign-in must work
await db.collection("user").updateOne({ email }, { $unset: { suspendedAt: "", suspendedReason: "", suspendedBy: "" } });
const clean = await signIn("clean sign-in");

// 2. suspended → session creation must be refused
await db.collection("user").updateOne(
  { email },
  {
    $set: {
      suspendedAt: new Date().toISOString(),
      suspendedReason: "Smoke test suspension.",
      suspendedBy: "smoke",
    },
  },
);
await signIn("suspended sign-in");

// 3. reinstate → sign-in works again
await db
  .collection("user")
  .updateOne({ email }, { $unset: { suspendedAt: "", suspendedReason: "", suspendedBy: "" } });
await signIn("reinstated sign-in");

await client.close();
if (clean.response.status !== 200) process.exitCode = 1;
