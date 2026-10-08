/**
 * Provision roles — the operational path for assigning the seven spec roles.
 *
 *   node scripts/set-role.mjs list-roles
 *   node scripts/set-role.mjs <email> <role> [tier]
 *
 * Examples:
 *   node scripts/set-role.mjs owner@alliedone.test super_admin
 *   node scripts/set-role.mjs staff@alliedone.test staff_verifier
 *   node scripts/set-role.mjs buyer@alliedone.test company_member gold
 *
 * Guards (same rules as the /admin/roles server action):
 *   - unknown roles are rejected
 *   - only ONE super_admin can exist at launch
 *   - the last super_admin cannot be demoted
 */
import fs from "node:fs";
import { MongoClient } from "mongodb";

const ROLES = [
  "visitor",
  "company_member",
  "brand_partner",
  "verification_partner",
  "staff_verifier",
  "staff_support",
  "staff_content",
  "staff_sales",
  "super_admin",
];

const TIERS = ["free", "silver", "gold", "platinum"];

function env(name) {
  const text = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
  const match = text.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
}

const [,, email, role, tier = "free"] = process.argv;

if (!email || email === "list-roles") {
  console.log("Roles:", ROLES.join(", "));
  console.log("Tiers:", TIERS.join(", "));
  process.exit(0);
}

if (!ROLES.includes(role)) {
  console.error(`Unknown role "${role}". Use one of: ${ROLES.join(", ")}`);
  process.exit(1);
}
if (role === "company_member" && !TIERS.includes(tier)) {
  console.error(`Unknown tier "${tier}". Use one of: ${TIERS.join(", ")}`);
  process.exit(1);
}

const uri = env("MONGODB_URI");
if (!uri) {
  console.error("MONGODB_URI missing in .env");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const users = client.db().collection("user");
  const target = await users.findOne({ email: email.toLowerCase() });
  if (!target) {
    console.error(`No account for ${email}. Sign up first, then re-run.`);
    process.exit(1);
  }

  const current = target.role || "company_member";

  if (role === "super_admin") {
    const existing = await users.findOne({
      role: "super_admin",
      email: { $ne: target.email },
    });
    if (existing) {
      console.error(
        `Blocked: a Super Admin already exists (${existing.email}). Only one is allowed at launch.`,
      );
      process.exit(1);
    }
  }

  if (current === "super_admin" && role !== "super_admin") {
    const other = await users.findOne({
      role: "super_admin",
      email: { $ne: target.email },
    });
    if (!other) {
      console.error("Blocked: the last Super Admin cannot be demoted.");
      process.exit(1);
    }
  }

  const update = { role, updatedAt: new Date() };
  if (role === "company_member") update.tier = tier;

  // better-auth's Mongo adapter keys users by `_id`; match on the unique
  // email so we never depend on the adapter's id mapping.
  await users.updateOne({ email: target.email }, { $set: update });
  console.log(`OK  ${email}: ${current} → ${role}${role === "company_member" ? ` (tier ${tier})` : ""}`);
} finally {
  await client.close();
}
