import { db } from "./db";

/**
 * Staff-facing reads over the auth `user` collection — the only source of
 * truth for accounts (the Mongo adapter stores the primary key as `_id`).
 */

export async function listUsers(limit = 500) {
  try {
    return await db
      .collection("user")
      .find({})
      .project({ email: 1, name: 1, role: 1, tier: 1, emailVerified: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error("[users] list failed", error.message);
    return [];
  }
}

/** Aggregated role → count, used by /admin/roles and the overview. */
export async function countUsersByRole() {
  const counts = new Map();
  try {
    const rows = await db
      .collection("user")
      .aggregate([{ $group: { _id: { $ifNull: ["$role", "company_member"] }, n: { $sum: 1 } } }])
      .toArray();
    for (const row of rows) counts.set(row._id, row.n);
  } catch (error) {
    console.error("[users] role counts failed", error.message);
  }
  return counts;
}
