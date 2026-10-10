import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";

const uri =
  process.env.MONGODB_URI ||
  readFileSync(".env", "utf8").match(/MONGODB_URI=(.*)/)?.[1]?.trim();

const client = new MongoClient(uri);
await client.connect();
const db = client.db();
const users = await db
  .collection("user")
  .find(
    {
      role: {
        $in: [
          "super_admin",
          "staff_verifier",
          "staff_support",
          "staff_content",
          "staff_sales",
        ],
      },
    },
    { projection: { email: 1, role: 1, emailVerified: 1, staff2faAt: 1 } },
  )
  .limit(10)
  .toArray();
console.log(JSON.stringify(users, null, 2));
await client.close();
