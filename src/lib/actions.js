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
import { setListingStatus } from "./listings";
import {
  approveCase,
  assignMethod,
  ensureVerificationTask,
  rejectCase,
  revokeBadge,
  setCaseStatus,
  updateTaskStatus,
} from "./verification";
import { publishRequirement, rejectRequirement } from "./requirements";
import { decideReport } from "./inbox";
import { advanceApplication, assignOfficer } from "./market-entry";
import { activateBankTransfer, createInvoice } from "./billing";

/**
 * Staff & privileged server actions.
 * Each one re-checks the caller's permission on the server before touching
 * data, then writes an immutable audit-log entry (actor, role, target).
 */

/**
 * §7.5 — verification queue decisions.
 * `Approved` awards the badge (date + method on the profile), `Rejected`
 * stores the reason, `Visit requested` moves the case to a scheduled visit.
 */
export async function decideVerificationCase(targetId, decision, reason = "") {
  const { user, role } = await requirePermission("admin.verification_queue");

  let result = { ok: true };
  if (decision === "Approved") {
    result = await approveCase(targetId, user.email);
  } else if (decision === "Rejected") {
    result = await rejectCase(targetId, reason, user.email);
  } else {
    result = await setCaseStatus(targetId, "visit_scheduled", user.email, reason);
  }

  if (!result.ok) return { ok: false, error: result.error || "Decision failed." };

  await setStaffStatus("verification_case", targetId, decision, {
    decidedBy: user.email,
  });
  await recordAudit({
    action: `verification.case.${String(decision).toLowerCase().replace(/\s+/g, "_")}`,
    target: `case:${targetId}`,
    detail: { decision, reason },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/verification-queue");
  revalidatePath("/dashboard/verification");
  return { ok: true, decision };
}

/** §7.5.3 — assign the method used to verify a case, and open the task. */
export async function assignVerificationMethod(caseId, method) {
  const { user, role } = await requirePermission("admin.verification_queue");

  const assigned = await assignMethod(caseId, method, user.email);
  if (!assigned.ok) return { ok: false, error: assigned.error || "Could not assign the method." };

  const task = await ensureVerificationTask(caseId, method);

  await recordAudit({
    action: "verification.method.assign",
    target: `case:${caseId}`,
    detail: { method, taskId: task?.id ?? null },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/verification-queue");
  revalidatePath("/dashboard/tasks");
  return { ok: true, method };
}

/** §7.5.5 — revoke a badge when a complaint is proven. */
export async function revokeVerificationBadge(badgeId, reason) {
  const { user, role } = await requirePermission("admin.verification_queue");

  const result = await revokeBadge(badgeId, reason, user.email);
  if (!result.ok) return { ok: false, error: result.error || "Could not revoke the badge." };

  await recordAudit({
    action: "verification.badge.revoke",
    target: `badge:${badgeId}`,
    detail: { reason },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/verification-queue");
  revalidatePath("/dashboard/verification");
  return { ok: true };
}

/**
 * §7.2.2 — listing moderation: approve, or reject with a reason the seller
 * sees on their listing.
 */
export async function moderateListing(targetId, decision, reason = "") {
  const { user, role } = await requirePermission("admin.listings");

  const approved = String(decision).toLowerCase() === "approved";
  const result = await setListingStatus(targetId, approved ? "approved" : "rejected", {
    reason: approved ? "" : reason,
    moderator: user.email,
  });
  if (!result.ok) return { ok: false, error: result.error || "Moderation failed." };

  await setStaffStatus("listing", targetId, decision, {
    moderatedBy: user.email,
  });
  await recordAudit({
    action: `listing.${String(decision).toLowerCase().replace(/\s+/g, "_")}`,
    target: `listing:${targetId}`,
    detail: { decision, reason },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/listings");
  revalidatePath("/dashboard/products");
  return { ok: true, decision };
}

/** §7.3.2 — requirement moderation (approve publishes + auto-matches). */
export async function moderateRequirement(targetId, decision, reason = "") {
  const { user, role } = await requirePermission("admin.requirements");

  const approved = String(decision).toLowerCase() === "approved";
  const result = approved
    ? await publishRequirement(targetId, user.email)
    : await rejectRequirement(targetId, reason, user.email);

  if (!result.ok) return { ok: false, error: result.error || "Moderation failed." };

  await setStaffStatus("requirement", targetId, decision, { moderatedBy: user.email });
  await recordAudit({
    action: `requirement.${String(decision).toLowerCase().replace(/\s+/g, "_")}`,
    target: `requirement:${targetId}`,
    detail: { decision, reason, matched: result.matched ?? 0 },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/requirements");
  revalidatePath("/dashboard/requirements");
  revalidatePath("/requirements");
  return { ok: true, decision, matched: result.matched ?? 0 };
}

/** §7.4.4 — Inquiry Monitor decisions on member reports. */
export async function resolveInquiryReport(reportId, status) {
  const { user, role } = await requirePermission("admin.inquiries");

  const result = await decideReport(reportId, status, user.email);
  if (!result.ok) return { ok: false, error: result.error || "Could not update the report." };

  await recordAudit({
    action: `inquiry.report.${status}`,
    target: `report:${reportId}`,
    detail: { status },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/inquiries");
  revalidatePath("/dashboard/inquiries");
  return { ok: true, status };
}

/** §7.6.2–4 — market-entry pipeline steps taken by staff. */
export async function advanceMarketEntryStage(targetId, stage, note = "") {
  const { user, role } = await requirePermission("admin.market_entry");

  const result = await advanceApplication(targetId, stage, user.email, note);
  if (!result.ok) return { ok: false, error: result.error || "Could not update the stage." };

  await recordAudit({
    action: `market_entry.stage.${stage}`,
    target: `application:${targetId}`,
    detail: { stage, note },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/market-entry");
  revalidatePath("/dashboard/market-entry");
  return { ok: true, stage };
}

export async function assignMarketEntryOfficer(targetId, officer) {
  const { user, role } = await requirePermission("admin.market_entry");

  const result = await assignOfficer(targetId, officer, user.email);
  if (!result.ok) return { ok: false, error: "Could not assign the officer." };

  await recordAudit({
    action: "market_entry.officer.assign",
    target: `application:${targetId}`,
    detail: { officer },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/market-entry");
  return { ok: true, officer };
}

/** §7.6.5 — issue the monthly retainer invoice from the admin panel. */
export async function issueMarketEntryRetainer(targetId) {
  const { user, role } = await requirePermission("admin.payments");

  const application = await db.collection("market_entry_applications").findOne({ id: String(targetId) });
  if (!application) return { ok: false, error: "Application not found." };
  if (!["contract", "active"].includes(application.stage)) {
    return { ok: false, error: "Retainers start once the contract stage is reached." };
  }

  const settings = await getPricingSettings();
  const fee = settings.serviceFees.find((item) => item.key === "market_entry");
  const amountUsd = Number(fee?.retainerUsdMin) || 500;

  const invoice = await createInvoice({
    email: application.email,
    kind: "retainer",
    label: `Market entry retainer — ${application.company}`,
    amountUsd,
    currency: "USD",
    context: { applicationId: application.id, company: application.company },
  });
  if (!invoice.ok) return { ok: false, error: "Could not create the retainer invoice." };

  await recordAudit({
    action: "market_entry.retainer.issue",
    target: `application:${application.id}`,
    detail: { invoiceId: invoice.invoice.id, amountUsd },
    actor: user.email,
    actorRole: role,
  });

  if (application.stage === "contract") {
    await advanceApplication(application.id, "active", user.email, "Retainer billing started");
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/market-entry");
  revalidatePath("/dashboard/membership");
  return { ok: true, invoiceId: invoice.invoice.id, amountUsd };
}

/** §7.7.3 — staff activate a membership after the bank transfer arrives. */
export async function activateBankTransferPayment(invoiceId) {
  const { user, role } = await requirePermission("admin.payments");

  const result = await activateBankTransfer(invoiceId, user.email);
  if (!result.ok) return { ok: false, error: result.error || "Could not activate the payment." };

  await recordAudit({
    action: "billing.membership.activated",
    target: `invoice:${invoiceId}`,
    detail: { method: "bank", tier: result.invoice?.tier ?? null },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/admin/payments");
  revalidatePath("/dashboard/membership");
  return { ok: true };
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

  // The UI speaks in labels; storage speaks in keys.
  const mapped =
    { "In progress": "in_progress", Completed: "completed", Blocked: "blocked" }[status] || status;

  const result = await updateTaskStatus(taskId, mapped, user.email);
  if (!result.ok) return { ok: false, error: result.error || "Task update failed." };

  await recordAudit({
    action: `verification.task.${mapped}`,
    target: `task:${taskId}`,
    detail: { status: mapped },
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
