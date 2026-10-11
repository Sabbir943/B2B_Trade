import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";
import { findActionIds } from "./action-id.mjs";

/** Part 2 of the server-action smoke test: members, staff, moderation deletes. */
const BASE = "http://localhost:3000";
const COOKIE = process.env.SMOKE_COOKIE;
if (!COOKIE) {
  console.error("SMOKE_COOKIE required");
  process.exit(1);
}

function env(name) {
  const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const match = raw.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

const PATHS = {
  suspendMember: "/admin/members",
  reinstateMember: "/admin/members",
  approveMember: "/admin/members",
  createStaffAccount: "/admin/roles",
  deactivateStaffAccount: "/admin/roles",
  grantExtraPermission: "/admin/roles",
  revokeExtraPermission: "/admin/roles",
  adminDeleteRequirement: "/admin/requirements",
  adminDeleteListing: "/admin/listings",
};

const ACTION_IDS = findActionIds(Object.keys(PATHS));

async function action(name, args) {
  const id = ACTION_IDS[name];
  const path = PATHS[name];
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "text/plain;charset=UTF-8",
      "next-action": id,
      accept: "text/x-component",
      origin: BASE,
      cookie: `better-auth.session_token=${COOKIE}`,
    },
    body: JSON.stringify(args),
  });
  const text = await response.text();
  const failed = response.status !== 200 || /\\"error\\"/.test(text);
  console.log(`  ${name}: HTTP ${response.status}${failed ? ` ${text.slice(0, 240)}` : " ok"}`);
  return { status: response.status, text };
}

async function signIn(email, password) {
  const response = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ email, password, rememberMe: true }),
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, code: body.code };
}

function section(title) {
  console.log(`\n=== ${title}`);
}

const MEMBER = "sectest1791644699@example.com";
const STAFF_EMAIL = `smoke.staff.${Date.now()}@example.com`;
const STAFF_PASSWORD = "SmokeTest12345!";

const client = new MongoClient(env("MONGODB_URI"));
await client.connect();
const db = client.db();

/* 1. member suspension ------------------------------------------- */
section("member suspend / reinstate");
console.log("  baseline sign-in:", (await signIn(MEMBER, "Password123!")).status);
await action("suspendMember", [MEMBER, "Smoke test suspension reason."]);
let target = await db.collection("user").findOne({ email: MEMBER });
console.log("  suspendedAt set:", Boolean(target?.suspendedAt), "| reason:", target?.suspendedReason);
console.log("  sessions after suspend:", await db.collection("session").countDocuments({ userId: String(target._id) }));
console.log("  suspended sign-in:", JSON.stringify(await signIn(MEMBER, "Password123!")));
await action("reinstateMember", [MEMBER]);
target = await db.collection("user").findOne({ email: MEMBER });
console.log("  suspendedAt cleared:", !target?.suspendedAt, "| sign-in:", (await signIn(MEMBER, "Password123!")).status);

/* 2. staff account ------------------------------------------------ */
section("staff account create / permission / deactivate");
await action("createStaffAccount", [
  { name: "Smoke Staff", email: STAFF_EMAIL, role: "staff_support", password: STAFF_PASSWORD },
]);
const staffUser = await db.collection("user").findOne({ email: STAFF_EMAIL });
const staffAccount = await db.collection("account").findOne({ userId: String(staffUser?._id) });
console.log("  user doc:", Boolean(staffUser), "| role:", staffUser?.role, "| credential doc:", Boolean(staffAccount));
console.log("  staff sign-in:", JSON.stringify(await signIn(STAFF_EMAIL, STAFF_PASSWORD)));

await action("grantExtraPermission", [STAFF_EMAIL, "admin.listings"]);
target = await db.collection("user").findOne({ email: STAFF_EMAIL });
console.log("  extraPermissions:", JSON.stringify(target?.extraPermissions));
await action("revokeExtraPermission", [STAFF_EMAIL, "admin.listings"]);
target = await db.collection("user").findOne({ email: STAFF_EMAIL });
console.log("  after revoke:", JSON.stringify(target?.extraPermissions));

await action("deactivateStaffAccount", [STAFF_EMAIL]);
target = await db.collection("user").findOne({ email: STAFF_EMAIL });
console.log("  role now:", target?.role, "| suspended:", Boolean(target?.suspendedAt));
console.log("  sign-in after deactivate:", JSON.stringify(await signIn(STAFF_EMAIL, STAFF_PASSWORD)));

/* 3. moderation deletes ------------------------------------------ */
section("moderation delete");
const ref = `SMOKE-${Date.now()}`;
await db.collection("requirements").insertOne({
  id: ref,
  email: "smoke.buyer@example.com",
  product: "Smoke Test Requirement",
  category: "spices",
  quantity: "10",
  unit: "MT",
  status: "pending",
  createdAt: new Date(),
});
await db.collection("listings").insertOne({
  id: ref,
  email: "smoke.seller@example.com",
  title: "Smoke Test Listing",
  category: "spices",
  status: "pending",
  createdAt: new Date(),
});
console.log("  seeded:", ref);
await action("adminDeleteRequirement", [ref]);
await action("adminDeleteListing", [ref]);
console.log(
  "  remaining — requirement:",
  await db.collection("requirements").countDocuments({ id: ref }),
  "| listing:",
  await db.collection("listings").countDocuments({ id: ref }),
);

const audits = await db
  .collection("audit_log")
  .find({ target: { $in: [`user:${STAFF_EMAIL}`, `user:${MEMBER}`, `requirement:${ref}`, `listing:${ref}`] } })
  .toArray();
console.log("  audit entries written:", audits.map((row) => row.action).join(", "));

/* 4. cleanup ------------------------------------------------------ */
section("cleanup");
await db.collection("user").deleteOne({ email: STAFF_EMAIL });
await db.collection("account").deleteOne({ userId: String(staffUser?._id) });
await db.collection("session").deleteMany({ userId: String(staffUser?._id) });
await db.collection("requirements").deleteOne({ id: ref });
await db.collection("listings").deleteOne({ id: ref });
await db.collection("user").updateOne(
  { email: MEMBER },
  { $unset: { suspendedAt: "", suspendedReason: "", suspendedBy: "" } },
);
console.log("  removed smoke staff + fixtures");

await client.close();
process.exit(0);
