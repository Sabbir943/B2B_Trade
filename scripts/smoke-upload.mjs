import { readFileSync, rmSync } from "node:fs";
import { createHmac } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

/**
 * Upload guard smoke test (needs `npm run dev`):
 *   no session → 401 · fresh staff 2FA → 200 · missing stamp → 403
 *
 * Usage: node scripts/smoke-upload.mjs
 * Mints its own session, uploads a 1x1 PNG, then removes the file, the
 * session and any 2FA stamp change it made.
 */
const BASE = "http://localhost:3000";
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function env(name) {
  const raw = readFileSync(path.join(ROOT, ".env"), "utf8");
  const match = raw.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

const client = new MongoClient(env("MONGODB_URI"));
await client.connect();
const db = client.db();

const owner = await db.collection("user").findOne({ email: "owner@alliedone.test" });
if (!owner) {
  console.error("no owner@alliedone.test user");
  process.exit(1);
}
const originalStamp = owner.staff2faAt;

// Same session mint as scripts/smoke-session.mjs (signed better-auth cookie).
const now = new Date();
await db
  .collection("user")
  .updateOne({ _id: owner._id }, { $set: { staff2faAt: now.toISOString() } });
const token = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
await db.collection("session").insertOne({
  token,
  userId: String(owner._id),
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  ipAddress: "127.0.0.1",
  userAgent: "smoke-test",
  createdAt: now,
  updatedAt: now,
});
const secret = env("BETTER_AUTH_SECRET") || env("AUTH_SECRET");
const signature = createHmac("sha256", secret).update(token).digest("base64");
const cookie = encodeURIComponent(`${token}.${signature}`);

// 1x1 transparent PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function upload(label, withSession = true) {
  const form = new FormData();
  form.append("file", new Blob([PNG], { type: "image/png" }), "guard-test.png");
  const headers = withSession ? { cookie: `better-auth.session_token=${cookie}` } : {};
  const response = await fetch(`${BASE}/api/upload`, { method: "POST", body: form, headers });
  const body = await response.json().catch(() => ({}));
  console.log(`  ${label}: ${response.status} ${JSON.stringify(body).slice(0, 140)}`);
  return { status: response.status, body };
}

let fileId = null;
let failed = false;
try {
  console.log("=== upload guard");
  const anon = await upload("no session", false);
  const fresh = await upload("fresh 2FA");
  fileId = fresh.body.id;

  await db.collection("user").updateOne({ _id: owner._id }, { $unset: { staff2faAt: "" } });
  const stale = await upload("missing 2FA stamp");

  const checks = [
    ["no session → 401", anon.status === 401],
    ["fresh 2FA → 200", fresh.status === 200 && fileId],
    ["missing stamp → 403 message", stale.status === 403 && /fresh sign-in code/.test(stale.body.error || "")],
  ];
  for (const [label, ok] of checks) {
    console.log(`  ${ok ? "PASS" : "FAIL"} ${label}`);
    if (!ok) failed = true;
  }
} finally {
  // restore the 2FA stamp state the account had before this test
  if (originalStamp) {
    await db.collection("user").updateOne({ _id: owner._id }, { $set: { staff2faAt: originalStamp } });
  } else {
    await db.collection("user").updateOne({ _id: owner._id }, { $unset: { staff2faAt: "" } });
  }
  await db.collection("session").deleteMany({ token: { $regex: "^smoke-" } });
  if (fileId) {
    for (const ext of [".png", ".jpg", ".webp", ".gif", ".svg"]) {
      rmSync(path.join(ROOT, ".uploads", `${fileId}${ext}`), { force: true });
    }
  }
  await client.close();
  console.log("cleanup: uploaded file + session removed, 2FA stamp restored");
}

process.exit(failed ? 1 : 0);
