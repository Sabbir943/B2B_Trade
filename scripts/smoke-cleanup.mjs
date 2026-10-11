import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

/** Removes the rows the smoke tests wrote (site content, leftover sessions). */
function env(name) {
  const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const match = raw.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

const client = new MongoClient(env("MONGODB_URI"));
await client.connect();
const db = client.db();

const content = await db.collection("site_content").deleteMany({});
console.log("site_content rows removed:", content.deletedCount);

const sessions = await db.collection("session").deleteMany({ token: { $regex: "^smoke-" } });
console.log("smoke sessions removed:", sessions.deletedCount);

const leftovers = await db
  .collection("user")
  .deleteMany({ email: { $regex: "^smoke\\." } });
console.log("smoke users removed:", leftovers.deletedCount);
const accounts = await db.collection("account").deleteMany({ userAgent: "smoke-test" });
console.log("leftover:", accounts.deletedCount);

const categories = await db.collection("categories").countDocuments({});
console.log("categories kept (seeded by the manager):", categories);

await client.close();
