"use server";

import { revalidatePath, updateTag } from "next/cache";
import { db } from "./db";
import { requirePermission } from "./session";
import { recordAudit, setStaffStatus, savePartnerMessage } from "./audit";
import { ROLES } from "./permissions";
import {
  normalizePricingSettings,
  changedPaths,
  PAID_TIERS,
} from "./pricing";
import {
  getPricingSettings,
  readPricingSettings,
  writePricingSettings,
  trialExpiry,
} from "./membership";

/**
 * Staff & privileged server actions.
 * Each one re-checks the caller's permission on the server before touching
 * data, then writes an immutable audit-log entry (actor, role, target).
 */

export async function decideVerificationCase(targetId, decision) {
  const { user, role } = await requirePermission("admin.verification_queue");

  await setStaffStatus("verification_case", targetId, decision, {
    decidedBy: user.email,
  });
  await recordAudit({
    action: `verification.case.${decision}`,
    target: `case:${targetId}`,
    detail: { decision },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/verification-queue");
  return { ok: true, decision };
}

export async function moderateListing(targetId, decision) {
  const { user, role } = await requirePermission("admin.listings");

  await setStaffStatus("listing", targetId, decision, {
    moderatedBy: user.email,
  });
  await recordAudit({
    action: `listing.${decision}`,
    target: `listing:${targetId}`,
    detail: { decision },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/listings");
  return { ok: true, decision };
}

export async function assignStaffRole(email, nextRole) {
  const { user, role } = await requirePermission("admin.roles");

  const valid = Object.values(ROLES).includes(nextRole);
  if (!valid || nextRole === ROLES.VISITOR) {
    return { ok: false, error: "Unknown role." };
  }

  const users = db.collection("user");
  const target = await users.findOne({ email: email.toLowerCase().trim() });
  if (!target) {
    return { ok: false, error: `No account found for ${email}.` };
  }

  const currentRole = target.role || ROLES.COMPANY_MEMBER;
  if (currentRole === nextRole) {
    return { ok: false, error: "That account already holds this role." };
  }

  // Exactly one Super Admin at launch: never create a second one, and never
  // demote the last remaining one. (Users are keyed by email here because the
  // Mongo adapter stores the primary key as `_id`, not `id`.)
  if (nextRole === ROLES.SUPER_ADMIN) {
    const existingSuper = await users.findOne({
      role: ROLES.SUPER_ADMIN,
      email: { $ne: target.email },
    });
    if (existingSuper) {
      return {
        ok: false,
        error: "A Super Admin account already exists — only one is allowed at launch.",
      };
    }
  }
  if (currentRole === ROLES.SUPER_ADMIN) {
    const otherSuper = await users.findOne({
      role: ROLES.SUPER_ADMIN,
      email: { $ne: target.email },
    });
    if (!otherSuper) {
      return { ok: false, error: "The last Super Admin cannot be demoted." };
    }
  }

  await users.updateOne(
    { email: target.email },
    { $set: { role: nextRole, updatedAt: new Date() } },
  );
  await recordAudit({
    action: "role.assigned",
    target: `user:${target.email}`,
    detail: { from: currentRole, to: nextRole },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/roles");
  return { ok: true, email: target.email, role: nextRole };
}

/** Every route whose prices/limits come from the pricing settings document. */
const PRICING_PATHS = [
  "/membership",
  "/sell",
  "/verification",
  "/verification-badges",
  "/sourcing-service",
  "/market-entry",
  "/legal/refund-policy",
  "/dashboard/membership",
  "/console/pricing",
];

/**
 * Super Admin: publish new membership pricing (spec §9).
 * The payload is fully re-normalised server-side — the client only proposes
 * values — then stored, audited with a before/after diff and re-published to
 * every page that renders a price or limit.
 */
export async function updatePricingSettings(payload) {
  const { user, role } = await requirePermission("console.pricing");

  const before = await readPricingSettings();
  const settings = normalizePricingSettings(payload);
  const changed = changedPaths(before, settings);

  if (!changed.length) {
    return { ok: true, changed: [] };
  }

  await writePricingSettings(settings, user.email);
  await recordAudit({
    action: "pricing.settings.update",
    target: "settings:pricing",
    detail: { changed, before, after: settings },
    actor: user.email,
    actorRole: role,
  });

  updateTag("pricing");
  for (const path of PRICING_PATHS) {
    revalidatePath(path);
  }

  return { ok: true, changed };
}

/**
 * Admin: grant a free Silver trial (length comes from pricing settings) to a
 * selected supplier — the operational path behind the trial offer.
 */
export async function grantSilverTrial(email) {
  const { user, role } = await requirePermission("admin.members");

  const target = String(email ?? "").toLowerCase().trim();
  if (!target) {
    return { ok: false, error: "Enter the member's account email." };
  }

  const users = db.collection("user");
  const member = await users.findOne({ email: target });
  if (!member) {
    return { ok: false, error: `No account found for ${target}.` };
  }

  const currentTier = member.tier || "free";
  if (PAID_TIERS.includes(currentTier)) {
    return {
      ok: false,
      error: `${target} is already on the ${currentTier} plan — trials are for free accounts only.`,
    };
  }

  const settings = await getPricingSettings();
  const months = settings.trials.silverTrialMonths;
  const until = trialExpiry(months);

  await users.updateOne(
    { email: member.email },
    {
      $set: {
        tier: "silver",
        trialGranted: true,
        trialUntil: until.toISOString(),
        trialGrantedBy: user.email,
        updatedAt: new Date(),
      },
    },
  );
  await recordAudit({
    action: "membership.trial.grant",
    target: `user:${member.email}`,
    detail: { tier: "silver", months, until: until.toISOString() },
    actor: user.email,
    actorRole: role,
  });

  updateTag("pricing");
  revalidatePath("/admin/members");
  revalidatePath("/dashboard/membership");

  return { ok: true, email: member.email, months, until: until.toISOString() };
}

export async function updateAssignedTask(taskId, status) {
  const { user, role } = await requirePermission("verification.assigned.update");

  await setStaffStatus("verification_task", taskId, status, {
    updatedBy: user.email,
  });
  await recordAudit({
    action: `verification.task.${status}`,
    target: `task:${taskId}`,
    detail: { status },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/dashboard/tasks");
  return { ok: true, status };
}

export async function sendPartnerMessage(subject, body) {
  const { user, role } = await requirePermission("market_entry.message");

  if (!subject.trim() || !body.trim()) {
    return { ok: false, error: "Subject and message are required." };
  }

  await savePartnerMessage({ from: user.email, subject: subject.trim(), body: body.trim() });
  await recordAudit({
    action: "market_entry.message",
    target: `partner:${user.email}`,
    detail: { subject: subject.trim() },
    actor: user.email,
    actorRole: role,
  });

  return { ok: true };
}
