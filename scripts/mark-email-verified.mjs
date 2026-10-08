/**
 * One-time migration: mark pre-existing accounts as email-verified so nobody
 * is locked out when `requireEmailVerification` turned on.
 *
 *   node scripts/mark-email-verified.mjs
 *
 * Run it ONCE. Re-running later would also auto-verify accounts created
 * afterwards that are still waiting for their code.
 */
import fs from "node:fs";
import { MongoClient } from "mongodb";

function env(name) {
  const text = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
  const match = text.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
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

  const pending = await users
    .find({ emailVerified: { $ne: true } }, { projection: { email: 1 } })
    .toArray();

  if (pending.length === 0) {
    console.log("Nothing to do — every account is already verified.");
    process.exit(0);
  }

  const result = await users.updateMany(
    { emailVerified: { $ne: true } },
    { $set: { emailVerified: true, updatedAt: new Date() } },
  );

  console.log(`OK  ${result.modifiedCount}/${pending.length} accounts marked verified:`);
  for (const user of pending) console.log(`    ${user.email}`);
} finally {
  await client.close();
}
