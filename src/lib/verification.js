import { db } from "./db";
import { addDays, addYears, cleanText, newRef, now } from "./refs";
import { ROLES } from "./permissions";
import { DOCUMENT_TYPES } from "./trade-constants";

export { DOCUMENT_TYPES };

/**
 * Verification badges (spec §7.5 — Verification).
 *
 *   1. Member applies for a badge and pays the fee.
 *   2. Uploads documents (trade licence / registration, tax ID, address proof).
 *   3. The case enters the Verification Queue and is assigned a method:
 *      document check, Dhaka site visit, partner visit abroad or third-party
 *      audit.
 *   4. Badge is awarded with the date and method shown on the profile.
 *   5. Annual renewal; a badge is revoked if a complaint is proven.
 *
 * Fees come from the live pricing settings (`serviceFees`), so a case only
 * moves to `submitted` once its invoice is paid — except the free
 * "Company checked" level.
 */

const CASES = "verification_cases";
const BADGES = "badges";

export const VERIFICATION_LEVELS = [
  {
    key: "company_checked",
    label: "Company checked",
    feeKey: null,
    blurb: "Registration, ownership and bank letter check.",
    requiredDocs: ["Trade licence / registration", "Tax ID", "Address proof"],
  },
  {
    key: "documents_audited",
    label: "Documents audited",
    feeKey: "document_verified",
    blurb: "Product certificates, lab reports and compliance declarations.",
    requiredDocs: ["Trade licence / registration", "Tax ID", "Product certificates"],
  },
  {
    key: "factory_audited",
    label: "Factory audited",
    feeKey: "audited",
    blurb: "On-site capacity, quality system and social compliance audit.",
    requiredDocs: ["Trade licence / registration", "Tax ID", "Address proof"],
  },
];

export const VERIFICATION_METHODS = [
  { key: "document_check", label: "Document check" },
  { key: "dhaka_site_visit", label: "Dhaka site visit" },
  { key: "partner_visit_abroad", label: "Partner visit abroad" },
  { key: "third_party_audit", label: "Third-party audit" },
];

export const CASE_STATUS = {
  AWAITING_PAYMENT: "awaiting_payment",
  SUBMITTED: "submitted",
  IN_REVIEW: "in_review",
  VISIT_SCHEDULED: "visit_scheduled",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export function levelByKey(key) {
  return VERIFICATION_LEVELS.find((level) => level.key === key) || null;
}

export function methodLabel(key) {
  return VERIFICATION_METHODS.find((method) => method.key === key)?.label || "—";
}

export function statusLabel(status) {
  return (
    {
      awaiting_payment: "Awaiting payment",
      submitted: "Submitted",
      in_review: "In review",
      visit_scheduled: "Visit scheduled",
      approved: "Approved",
      rejected: "Rejected",
    }[status] || status
  );
}

/** §7.5.3 — default method by level and where the company is based. */
export function defaultMethod(levelKey, country) {
  if (levelKey === "factory_audited") {
    return String(country || "").trim() === "Bangladesh" ? "dhaka_site_visit" : "third_party_audit";
  }
  return "document_check";
}

/** Fee for a level in the member's currency, from live pricing settings. */
export function feeForLevel(settings, levelKey) {
  const level = levelByKey(levelKey);
  if (!level || !level.feeKey) return { usd: 0, bdt: 0, quoted: false, label: "Included" };
  const fee = settings.serviceFees.find((item) => item.key === level.feeKey);
  if (!fee) return { usd: 0, bdt: 0, quoted: false, label: "Included" };
  if (fee.kind === "fixed") {
    return { usd: Number(fee.usd) || 0, bdt: Number(fee.bdt) || 0, quoted: false, label: "" };
  }
  // Custom-priced audits are quoted by staff after the application.
  return { usd: 0, bdt: 0, quoted: true, label: fee.note || "Quoted per engagement" };
}

function normalizeDocuments(input) {
  const list = Array.isArray(input) ? input : [];
  return list
    .map((doc) => ({
      type: cleanText(doc?.type, 60) || "Other",
      reference: cleanText(doc?.reference, 200),
    }))
    .filter((doc) => doc.reference.length > 0)
    .slice(0, 8);
}

/* ------------------------------------------------------------------ *
 * Member side
 * ------------------------------------------------------------------ */

export async function createVerificationCase({ email, levelKey, documents, country = "", renewalOf = null }) {
  const key = String(email || "").toLowerCase();
  const level = levelByKey(levelKey);
  if (!key) return { ok: false, error: "Sign in to apply." };
  if (!level) return { ok: false, error: "Choose a verification level." };

  const docs = normalizeDocuments(documents);
  if (!docs.length) return { ok: false, error: "Add at least one document reference." };

  try {
    const open = await db.collection(CASES).findOne({
      email: key,
      status: { $in: [CASE_STATUS.AWAITING_PAYMENT, CASE_STATUS.SUBMITTED, CASE_STATUS.IN_REVIEW, CASE_STATUS.VISIT_SCHEDULED] },
    });
    if (open) return { ok: false, error: "You already have a verification in progress." };

    const at = now();
    const testCase = {
      id: newRef("VC"),
      email: key,
      level: level.key,
      levelLabel: level.label,
      feeKey: level.feeKey,
      status: CASE_STATUS.SUBMITTED,
      method: defaultMethod(level.key, country),
      methodAssignedBy: "system",
      documents: docs,
      createdAt: at,
      updatedAt: at,
      decidedAt: null,
      decidedBy: null,
      decisionReason: "",
      badgeId: null,
      renewalOf,
    };
    await db.collection(CASES).insertOne(testCase);
    return { ok: true, testCase };
  } catch (error) {
    console.error("[verification] case insert failed", error.message);
    return { ok: false, error: "Could not submit the application." };
  }
}

/**
 * §7.5.1 step 1 — start an application.
 * Returns `{ ok, fee, invoiceId? , testCase? }`: free levels create the case
 * straight away, paid ones hand over to billing (§7.7 checkout flow).
 */
export async function startVerificationApplication({
  email,
  levelKey,
  documents,
  country = "",
  renewalOf = null,
}) {
  const key = String(email || "").toLowerCase();
  const level = levelByKey(levelKey);
  if (!level) return { ok: false, error: "Choose a verification level." };

  const docs = normalizeDocuments(documents);
  if (!docs.length && !renewalOf) return { ok: false, error: "Add at least one document reference." };

  const { getPricingSettings } = await import("./membership");
  const settings = await getPricingSettings();
  const fee = feeForLevel(settings, levelKey);
  if (fee.usd === 0 && fee.bdt === 0 && !fee.quoted) {
    return createVerificationCase({ email: key, levelKey, documents: docs, country, renewalOf });
  }

  const { createInvoice } = await import("./billing");
  const invoice = await createInvoice({
    email: key,
    kind: "verification_fee",
    label: `${level.label} verification${renewalOf ? " renewal" : ""}`,
    amountUsd: fee.usd,
    amountBdt: fee.bdt,
    currency: fee.usd ? "USD" : "BDT",
    quoted: fee.quoted,
    context: { levelKey, documents: docs, country, renewalOf },
  });
  if (!invoice.ok) return invoice;
  return { ok: true, needsPayment: true, invoiceId: invoice.invoice.id, fee };
}

export async function getCasesFor(email) {
  const key = String(email || "").toLowerCase();
  if (!key) return [];
  try {
    return await db.collection(CASES).find({ email: key }).sort({ createdAt: -1 }).toArray();
  } catch (error) {
    console.error("[verification] cases read failed", error.message);
    return [];
  }
}

export async function getCase(id) {
  try {
    return await db.collection(CASES).findOne({ id: String(id || "") });
  } catch (error) {
    console.error("[verification] case read failed", error.message);
    return null;
  }
}

export async function getBadges(email) {
  const key = String(email || "").toLowerCase();
  if (!key) return [];
  try {
    return await db.collection(BADGES).find({ email: key }).sort({ awardedAt: -1 }).toArray();
  } catch (error) {
    console.error("[verification] badges read failed", error.message);
    return [];
  }
}

export async function getActiveBadge(email) {
  const key = String(email || "").toLowerCase();
  if (!key) return null;
  try {
    return await db
      .collection(BADGES)
      .findOne({ email: key, revokedAt: null, expiresAt: { $gt: now() } }, { sort: { awardedAt: -1 } });
  } catch (error) {
    console.error("[verification] badge read failed", error.message);
    return null;
  }
}

/** §7.5.5 — start the annual renewal (a fresh case linked to the old badge). */
export async function startRenewal(email) {
  const key = String(email || "").toLowerCase();
  try {
    const badge = await db
      .collection(BADGES)
      .findOne({ email: key, revokedAt: null }, { sort: { awardedAt: -1 } });
    if (!badge) return { ok: false, error: "There is no badge to renew yet." };

    const open = await db.collection(CASES).findOne({
      email: key,
      status: { $in: [CASE_STATUS.SUBMITTED, CASE_STATUS.IN_REVIEW, CASE_STATUS.VISIT_SCHEDULED, CASE_STATUS.AWAITING_PAYMENT] },
    });
    if (open) return { ok: false, error: "A renewal is already in progress." };

    const profile = await import("./profile").then((module) => module.getProfile(key));
    return startVerificationApplication({
      email: key,
      levelKey: badge.level,
      documents: [],
      country: profile.country,
      renewalOf: badge.id,
    });
  } catch (error) {
    console.error("[verification] renewal failed", error.message);
    return { ok: false, error: "Could not start the renewal." };
  }
}

/* ------------------------------------------------------------------ *
 * Staff side
 * ------------------------------------------------------------------ */

export async function getVerificationQueue() {
  try {
    return await db
      .collection(CASES)
      .find({ status: { $in: [CASE_STATUS.SUBMITTED, CASE_STATUS.IN_REVIEW, CASE_STATUS.VISIT_SCHEDULED] } })
      .sort({ createdAt: 1 })
      .toArray();
  } catch (error) {
    console.error("[verification] queue read failed", error.message);
    return [];
  }
}

export async function assignMethod(caseId, method, actor) {
  if (!VERIFICATION_METHODS.some((item) => item.key === method)) {
    return { ok: false, error: "Unknown verification method." };
  }
  try {
    const result = await db.collection(CASES).updateOne(
      { id: String(caseId) },
      { $set: { method, methodAssignedBy: actor, updatedAt: now() } },
    );
    return { ok: result.matchedCount === 1 };
  } catch (error) {
    console.error("[verification] method assign failed", error.message);
    return { ok: false };
  }
}

/** §7.5.4 — approving a case awards the badge with date and method. */
export async function approveCase(caseId, actor) {
  try {
    const testCase = await db.collection(CASES).findOne({ id: String(caseId) });
    if (!testCase) return { ok: false, error: "Case not found." };
    if (testCase.status === CASE_STATUS.APPROVED) return { ok: false, error: "Already approved." };

    const at = now();
    const badge = {
      id: newRef("BD"),
      email: testCase.email,
      caseId: testCase.id,
      level: testCase.level,
      levelLabel: testCase.levelLabel,
      method: testCase.method,
      methodLabel: methodLabel(testCase.method),
      awardedAt: at,
      expiresAt: addYears(at, 1),
      revokedAt: null,
      revokedReason: "",
      renewedFrom: testCase.renewalOf || null,
    };
    await db.collection(BADGES).insertOne(badge);
    await db.collection(CASES).updateOne(
      { id: testCase.id },
      { $set: { status: CASE_STATUS.APPROVED, decidedAt: at, decidedBy: actor, badgeId: badge.id, updatedAt: at } },
    );
    // Keep the account badge flag in sync for profile / search ranking.
    await db.collection("user").updateOne({ email: testCase.email }, { $set: { verifiedBadge: badge.level, updatedAt: at } });
    return { ok: true, badge };
  } catch (error) {
    console.error("[verification] approve failed", error.message);
    return { ok: false, error: "Could not approve the case." };
  }
}

export async function rejectCase(caseId, reason, actor) {
  try {
    const result = await db.collection(CASES).updateOne(
      { id: String(caseId) },
      {
        $set: {
          status: CASE_STATUS.REJECTED,
          decisionReason: cleanText(reason, 240) || "Documents insufficient.",
          decidedAt: now(),
          decidedBy: actor,
          updatedAt: now(),
        },
      },
    );
    return { ok: result.matchedCount === 1 };
  } catch (error) {
    console.error("[verification] reject failed", error.message);
    return { ok: false };
  }
}

/** Move a case to a non-terminal status (e.g. a scheduled site visit). */
export async function setCaseStatus(caseId, status, actor, note = "") {
  const allowed = [CASE_STATUS.SUBMITTED, CASE_STATUS.IN_REVIEW, CASE_STATUS.VISIT_SCHEDULED];
  if (!allowed.includes(status)) return { ok: false, error: "Unknown case status." };
  try {
    const update = { status, note: cleanText(note, 240), updatedBy: actor, updatedAt: now() };
    if (status === CASE_STATUS.VISIT_SCHEDULED) update.method = "dhaka_site_visit";

    const result = await db.collection(CASES).updateOne({ id: String(caseId) }, { $set: update });
    if (result.matchedCount === 0) return { ok: false, error: "Case not found." };
    return { ok: true };
  } catch (error) {
    console.error("[verification] status update failed", error.message);
    return { ok: false, error: "Could not update the case." };
  }
}

/* ------------------------------------------------------------------ *
 * Verification tasks (§7.5.3 — the queue hands work to officers/partners)
 * ------------------------------------------------------------------ */

const TASKS = "verification_tasks";

export const TASK_STATUS = ["open", "in_progress", "completed", "blocked"];

/**
 * One task per case, created when the method is assigned. The queue can then
 * hand it to a Verification Partner, who sees it under /dashboard/tasks.
 */
export async function ensureVerificationTask(caseId, method) {
  try {
    const testCase = await db.collection(CASES).findOne({ id: String(caseId) });
    if (!testCase) return null;

    const at = now();
    const existing = await db.collection(TASKS).findOne({ caseId: testCase.id });
    if (existing) {
      await db.collection(TASKS).updateOne(
        { id: existing.id },
        { $set: { method, methodLabel: methodLabel(method), updatedAt: at } },
      );
      return { ...existing, method, methodLabel: methodLabel(method) };
    }

    const task = {
      id: newRef("VT"),
      caseId: testCase.id,
      email: testCase.email,
      level: testCase.level,
      levelLabel: testCase.levelLabel,
      method,
      methodLabel: methodLabel(method),
      assignee: "",
      status: "open",
      dueAt: addDays(at, 7).toISOString(),
      createdAt: at,
      updatedAt: at,
    };
    await db.collection(TASKS).insertOne(task);
    return task;
  } catch (error) {
    console.error("[verification] task ensure failed", error.message);
    return null;
  }
}

export async function listTasks({ assignee, limit = 100 } = {}) {
  const filter = assignee ? { assignee } : {};
  try {
    return await db.collection(TASKS).find(filter).sort({ createdAt: 1 }).limit(limit).toArray();
  } catch (error) {
    console.error("[verification] tasks read failed", error.message);
    return [];
  }
}

export async function listAssignees() {
  try {
    return await db
      .collection("user")
      .find({ role: { $in: [ROLES.VERIFICATION_PARTNER, ROLES.STAFF_VERIFIER] } })
      .project({ email: 1, name: 1, role: 1 })
      .sort({ name: 1 })
      .toArray();
  } catch (error) {
    console.error("[verification] assignees read failed", error.message);
    return [];
  }
}

export async function assignTask(taskId, assignee) {
  try {
    const result = await db
      .collection(TASKS)
      .updateOne({ id: String(taskId) }, { $set: { assignee: String(assignee || ""), updatedAt: now() } });
    return { ok: result.matchedCount === 1 };
  } catch (error) {
    console.error("[verification] task assign failed", error.message);
    return { ok: false };
  }
}

export async function updateTaskStatus(taskId, status, actor) {
  if (!TASK_STATUS.includes(status)) return { ok: false, error: "Unknown status." };
  try {
    const task = await db.collection(TASKS).findOne({ id: String(taskId) });
    if (!task) return { ok: false, error: "Task not found." };
    if (task.assignee && task.assignee !== actor) {
      return { ok: false, error: "That task is assigned to another officer." };
    }
    const result = await db
      .collection(TASKS)
      .updateOne({ id: String(taskId) }, { $set: { status, updatedBy: actor, updatedAt: now() } });
    if (result.matchedCount === 0) return { ok: false, error: "Task not found." };
    await setStaffStatusTask(taskId, status, actor);
    return { ok: true, status };
  } catch (error) {
    console.error("[verification] task update failed", error.message);
    return { ok: false, error: "Could not update the task." };
  }
}

async function setStaffStatusTask(taskId, status, actor) {
  try {
    const { setStaffStatus } = await import("./audit");
    await setStaffStatus("verification_task", taskId, status, { updatedBy: actor });
  } catch (error) {
    console.error("[verification] staff status mirror failed", error.message);
  }
}


/** §7.5.5 — badge revoked when a complaint is proven. */
export async function revokeBadge(badgeId, reason, actor) {
  try {
    const badge = await db.collection(BADGES).findOne({ id: String(badgeId) });
    if (!badge) return { ok: false, error: "Badge not found." };
    const at = now();
    await db.collection(BADGES).updateOne(
      { id: badge.id },
      { $set: { revokedAt: at, revokedReason: cleanText(reason, 240) || "Complaint proven.", revokedBy: actor } },
    );
    const stillValid = await db.collection(BADGES).countDocuments({
      email: badge.email,
      revokedAt: null,
      expiresAt: { $gt: at },
    });
    if (!stillValid) {
      await db.collection("user").updateOne({ email: badge.email }, { $set: { verifiedBadge: null, updatedAt: at } });
    }
    return { ok: true };
  } catch (error) {
    console.error("[verification] revoke failed", error.message);
    return { ok: false, error: "Could not revoke the badge." };
  }
}

export async function listAllBadges(limit = 200) {
  try {
    return await db.collection(BADGES).find({}).sort({ awardedAt: -1 }).limit(limit).toArray();
  } catch (error) {
    console.error("[verification] badges read failed", error.message);
    return [];
  }
}
