"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { hashPassword } from "better-auth/crypto";
import { db } from "./db";
import { requirePermission } from "./session";
import { recordAudit } from "./audit";
import { ROLES, STAFF_ROLES } from "./permissions";
import { cleanText } from "./refs";

/**
 * Member & staff account management (no-code admin panel, Part 2).
 * Suspension and role grants always require a reason the member can see;
 * every action is audit-logged with actor, role and target.
 */

const USERS = "user";
const SESSIONS = "session";

function normalizeEmail(email) {
  return String(email ?? "").toLowerCase().trim();
}

async function findUser(email) {
  const target = normalizeEmail(email);
  if (!target) return null;
  return db.collection(USERS).findOne({ email: target });
}

/** Drop every live session for a user (used on suspend / deactivate). */
async function revokeAllSessions(userId) {
  try {
    await db.collection(SESSIONS).deleteMany({ userId: String(userId) });
  } catch (error) {
    console.error("[member-admin] session revoke failed", error.message);
  }
}

/* ------------------------------------------------------------------ *
 * Member lifecycle
 * ------------------------------------------------------------------ */

/** Approve: mark the account's email as verified (unlocks sign-in). */
export async function approveMember(email) {
  const { user, role } = await requirePermission("admin.members");
  const target = await findUser(email);
  if (!target) return { ok: false, error: "No account found for that email." };

  if (target.emailVerified) return { ok: false, error: "That account is already verified." };

  await db.collection(USERS).updateOne(
    { email: target.email },
    { $set: { emailVerified: true, updatedAt: new Date() } },
  );
  await recordAudit({
    action: "member.approve",
    target: `user:${target.email}`,
    detail: {},
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/members");
  return { ok: true };
}

/** Suspend: blocks sign-in and ends all live sessions. Reason is required. */
export async function suspendMember(email, reason) {
  const { user, role } = await requirePermission("admin.members");
  const why = cleanText(reason, 240);
  if (why.length < 3) return { ok: false, error: "A reason is required to suspend an account." };

  const target = await findUser(email);
  if (!target) return { ok: false, error: "No account found for that email." };
  if (target.role === ROLES.SUPER_ADMIN) {
    return { ok: false, error: "The Super Admin account cannot be suspended." };
  }
  if (target.suspendedAt) return { ok: false, error: "That account is already suspended." };

  await db.collection(USERS).updateOne(
    { email: target.email },
    {
      $set: {
        suspendedAt: new Date().toISOString(),
        suspendedReason: why,
        suspendedBy: user.email,
        updatedAt: new Date(),
      },
    },
  );
  await revokeAllSessions(target._id);
  await recordAudit({
    action: "member.suspend",
    target: `user:${target.email}`,
    detail: { reason: why },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/members");
  return { ok: true };
}

/** Reinstate: clear the suspension and let the member sign in again. */
export async function reinstateMember(email) {
  const { user, role } = await requirePermission("admin.members");
  const target = await findUser(email);
  if (!target) return { ok: false, error: "No account found for that email." };
  if (!target.suspendedAt) return { ok: false, error: "That account is not suspended." };

  await db.collection(USERS).updateOne(
    { email: target.email },
    {
      $unset: { suspendedAt: "", suspendedReason: "", suspendedBy: "" },
      $set: { updatedAt: new Date() },
    },
  );
  await recordAudit({
    action: "member.reinstate",
    target: `user:${target.email}`,
    detail: {},
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/members");
  return { ok: true };
}

/* ------------------------------------------------------------------ *
 * Staff accounts
 * ------------------------------------------------------------------ */

/**
 * Create a staff account directly (no invite flow at launch). The password
 * is hashed with better-auth's own scrypt hasher so the account can sign in
 * through the normal flow; email is pre-verified because staff are
 * provisioned by the Super Admin, not self-serve.
 */
export async function createStaffAccount({ name, email, role: nextRole, password }) {
  const { user, role } = await requirePermission("admin.roles");

  if (!STAFF_ROLES.includes(nextRole)) {
    return { ok: false, error: "Choose a staff role (not Super Admin)." };
  }
  const address = normalizeEmail(email);
  const displayName = cleanText(name, 120);
  const secret = String(password ?? "");
  if (!address || !displayName) return { ok: false, error: "Name and email are required." };
  if (secret.length < 10) return { ok: false, error: "Password must be at least 10 characters." };

  const existing = await findUser(address);
  if (existing) return { ok: false, error: "An account with that email already exists." };

  const now = new Date();
  // Same shape the better-auth Mongo adapter produces: ObjectId _id, with the
  // hex string as the public id and the credential account keyed to it.
  const id = new ObjectId();
  const idHex = id.toString();
  const passwordHash = await hashPassword(secret);

  try {
    await db.collection(USERS).insertOne({
      _id: id,
      name: displayName,
      email: address,
      emailVerified: true,
      role: nextRole,
      tier: "free",
      createdAt: now,
      updatedAt: now,
      createdBy: user.email,
    });
    // `userId` must be an ObjectId: the Mongo adapter converts reference
    // fields on write and on lookup, so a hex string never matches.
    await db.collection("account").insertOne({
      _id: new ObjectId(),
      userId: id,
      providerId: "credential",
      accountId: idHex,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error("[member-admin] staff create failed", error.message);
    return { ok: false, error: "Could not create the staff account." };
  }

  await recordAudit({
    action: "staff.account.create",
    target: `user:${address}`,
    detail: { role: nextRole, name: displayName },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/roles");
  revalidatePath("/admin/members");
  return { ok: true, email: address, role: nextRole };
}

/** Deactivate: suspend + strip the staff role + kill sessions. */
export async function deactivateStaffAccount(email) {
  const { user, role } = await requirePermission("admin.roles");
  const target = await findUser(email);
  if (!target) return { ok: false, error: "No account found for that email." };
  if (target.role === ROLES.SUPER_ADMIN) {
    return { ok: false, error: "The Super Admin account cannot be deactivated." };
  }
  if (!STAFF_ROLES.includes(target.role)) {
    return { ok: false, error: "That account does not hold a staff role." };
  }

  const now = new Date();
  await db.collection(USERS).updateOne(
    { email: target.email },
    {
      $set: {
        role: ROLES.COMPANY_MEMBER,
        suspendedAt: now.toISOString(),
        suspendedReason: "Staff account deactivated.",
        suspendedBy: user.email,
        updatedAt: now,
      },
    },
  );
  await revokeAllSessions(target._id);
  await recordAudit({
    action: "staff.account.deactivate",
    target: `user:${target.email}`,
    detail: { from: target.role },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/roles");
  revalidatePath("/admin/members");
  return { ok: true };
}

/* ------------------------------------------------------------------ *
 * Per-user extra permissions (merged into requirePermission)
 * ------------------------------------------------------------------ */

/** Grant one extra permission string to a user (Super Admin only). */
export async function grantExtraPermission(email, permission) {
  const { user, role } = await requirePermission("admin.roles");
  const target = await findUser(email);
  if (!target) return { ok: false, error: "No account found for that email." };

  const perm = cleanText(permission, 80);
  if (!/^[a-z_]+\.[a-z_]+$/.test(perm)) {
    return { ok: false, error: "Permission must look like “admin.listings”." };
  }
  if (target.role === ROLES.SUPER_ADMIN) {
    return { ok: false, error: "The Super Admin already holds every permission." };
  }

  const current = Array.isArray(target.extraPermissions) ? target.extraPermissions : [];
  if (current.includes(perm)) return { ok: false, error: "That permission is already granted." };

  await db.collection(USERS).updateOne(
    { email: target.email },
    { $set: { extraPermissions: [...current, perm], updatedAt: new Date() } },
  );
  await recordAudit({
    action: "staff.permission.grant",
    target: `user:${target.email}`,
    detail: { permission: perm },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/roles");
  return { ok: true };
}

/** Revoke one extra permission string from a user (Super Admin only). */
export async function revokeExtraPermission(email, permission) {
  const { user, role } = await requirePermission("admin.roles");
  const target = await findUser(email);
  if (!target) return { ok: false, error: "No account found for that email." };

  const perm = cleanText(permission, 80);
  const current = Array.isArray(target.extraPermissions) ? target.extraPermissions : [];
  if (!current.includes(perm)) return { ok: false, error: "That permission is not granted." };

  await db.collection(USERS).updateOne(
    { email: target.email },
    { $set: { extraPermissions: current.filter((item) => item !== perm), updatedAt: new Date() } },
  );
  await recordAudit({
    action: "staff.permission.revoke",
    target: `user:${target.email}`,
    detail: { permission: perm },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/roles");
  return { ok: true };
}
