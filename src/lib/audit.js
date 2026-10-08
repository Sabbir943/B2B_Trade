import { randomUUID } from "node:crypto";
import { db } from "./db";

/**
 * Audit log — every staff action (and privileged Super Admin action) is
 * written here with actor, role, target and timestamp. Entries are immutable;
 * the console reads them straight from Mongo.
 */

const AUDIT = "audit_log";
const STATUS = "staff_status";
const MESSAGES = "partner_messages";

export async function recordAudit({ action, target, detail = {}, actor, actorRole }) {
  const entry = {
    id: randomUUID(),
    at: new Date(),
    actor: actor ?? "system",
    actorRole: actorRole ?? "system",
    action,
    target: target ?? "-",
    detail,
  };

  try {
    await db.collection(AUDIT).insertOne(entry);
  } catch (error) {
    console.error("[audit] failed to write entry", error.message);
  }

  return entry;
}

export async function listAuditEntries(limit = 40) {
  try {
    return await db
      .collection(AUDIT)
      .find({})
      .sort({ at: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error("[audit] failed to read entries", error.message);
    return [];
  }
}

/**
 * Persistent per-row status for staff decisions on the sample queues
 * (verification cases, listings, …) so a decision survives a reload.
 */
export async function getStaffStatuses(kind) {
  try {
    const rows = await db.collection(STATUS).find({ kind }).toArray();
    return Object.fromEntries(rows.map((row) => [row.targetId, row]));
  } catch (error) {
    console.error("[staff_status] read failed", error.message);
    return {};
  }
}

export async function setStaffStatus(kind, targetId, status, meta = {}) {
  const now = new Date();
  try {
    await db.collection(STATUS).updateOne(
      { kind, targetId },
      { $set: { ...meta, status, updatedAt: now } },
      { upsert: true },
    );
  } catch (error) {
    console.error("[staff_status] write failed", error.message);
  }
}

export async function savePartnerMessage({ from, subject, body }) {
  const doc = { id: randomUUID(), at: new Date(), from, subject, body, status: "sent" };
  try {
    await db.collection(MESSAGES).insertOne(doc);
  } catch (error) {
    console.error("[partner_messages] write failed", error.message);
  }
  return doc;
}
