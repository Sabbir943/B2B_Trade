import { db } from "./db";
import { cleanParagraph, cleanText, dayKey, newRef, now, timeAgo } from "./refs";
import { getProfile } from "./profile";
import { getPricingSettings } from "./membership";

/**
 * Platform inbox (spec §7.4 — Inquiries and inbox).
 *
 *   · All conversations stay inside the platform inbox.
 *   · Contact details (email, phone) are revealed according to membership
 *     tier; daily contact limits apply (`directContactsPerDay` from pricing).
 *   · Anti-fraud warnings: messages containing a bank account number, IBAN,
 *     SWIFT code or phrases like "new bank details" / "payment details
 *     changed" show a warning banner to both parties.
 *   · Every message can be reported; reports go to the Inquiry Monitor
 *     (/admin/inquiries).
 */

const THREADS = "threads";
const MESSAGES = "messages";
const REVEALS = "contact_reveals";
const REPORTS = "inquiry_reports";

// Pure constants live in trade-constants.js so client components can import
// them without pulling the database driver into the browser bundle.
export { THREAD_STAGES, FRAUD_BANNER_TEXT } from "./trade-constants";
import { THREAD_STAGES, FRAUD_BANNER_TEXT } from "./trade-constants";

/* ------------------------------------------------------------------ *
 * Anti-fraud scanning (§7.4.3)
 * ------------------------------------------------------------------ */

const FRAUD_RULES = [
  {
    id: "bank_account",
    label: "bank account number",
    test: (text) =>
      /\b(?:account|a\/c|acct|acc|iban|payee|beneficiary)\b[^.\n]{0,40}?\b\d[\d\s-]{7,22}\d\b/i.test(text),
  },
  {
    id: "iban",
    label: "IBAN",
    test: (text) => /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/i.test(text),
  },
  {
    id: "swift",
    label: "SWIFT / BIC code",
    test: (text) =>
      /\b(?:swift|bic)\b[^.\n]{0,25}?\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/i.test(text),
  },
  {
    id: "changed_details",
    label: "\u201Cnew bank details\u201D / \u201Cpayment details changed\u201D wording",
    test: (text) =>
      /\b(?:new|updated?|changed?|revised|fresh)\s+(?:bank|payment|banking|account)\s+(?:details?|information|info)\b/i.test(
        text,
      ) ||
      /\b(?:bank|payment)\s+details?\s+(?:have|has|are|is|was)?\s*(?:been\s+)?changed\b/i.test(text) ||
      /\b(?:bank|account)\s+(?:has|have)\s+changed\b/i.test(text),
  },
];

/** Returns `[{ id, label }]` — empty array when the message looks clean. */
export function detectFraud(text) {
  const body = String(text || "");
  if (!body) return [];
  return FRAUD_RULES.filter((rule) => rule.test(body)).map((rule) => ({ id: rule.id, label: rule.label }));
}

/* ------------------------------------------------------------------ *
 * Threads & messages
 * ------------------------------------------------------------------ */

function normalizeParticipants(list, fallback = []) {
  return [...new Set([...(list || []), ...fallback].map((value) => String(value || "").toLowerCase().trim()).filter(Boolean))]
    .slice(0, 6);
}

export async function createThread({ from, to, subject, body, listingId = null, requirementId = null }) {
  const sender = String(from || "").toLowerCase();
  const receiver = String(to || "").toLowerCase();
  if (!sender || !receiver) return { ok: false, error: "A recipient is required." };
  if (sender === receiver) return { ok: false, error: "You cannot start a thread with yourself." };

  const message = cleanParagraph(body, 4000);
  if (message.length < 3) return { ok: false, error: "Write a short message first." };

  const flags = detectFraud(message);
  const at = now();
  const thread = {
    id: newRef("TH"),
    subject: cleanText(subject, 160) || "Inquiry",
    participants: normalizeParticipants([sender, receiver]),
    listingId: listingId ? String(listingId) : null,
    requirementId: requirementId ? String(requirementId) : null,
    stage: "New",
    fraudFlags: flags.map((flag) => flag.id),
    reported: false,
    createdAt: at,
    updatedAt: at,
    lastMessageAt: at,
    lastMessagePreview: message.slice(0, 140),
  };

  try {
    await db.collection(THREADS).insertOne(thread);
    await db.collection(MESSAGES).insertOne({
      id: newRef("MS"),
      threadId: thread.id,
      from: sender,
      body: message,
      fraudFlags: flags,
      readBy: [sender],
      createdAt: at,
    });
    if (listingId) {
      await db.collection("listings").updateOne({ id: String(listingId) }, { $inc: { inquiries: 1 } });
    }
  } catch (error) {
    console.error("[inbox] thread insert failed", error.message);
    return { ok: false, error: "Could not open the conversation." };
  }

  return { ok: true, thread };
}

export async function sendMessage(threadId, from, body) {
  const sender = String(from || "").toLowerCase();
  const text = cleanParagraph(body, 4000);
  if (text.length < 1) return { ok: false, error: "Write a message first." };

  try {
    const thread = await db.collection(THREADS).findOne({ id: String(threadId) });
    if (!thread) return { ok: false, error: "Conversation not found." };
    if (!thread.participants.includes(sender)) {
      return { ok: false, error: "You are not part of this conversation." };
    }

    const flags = detectFraud(text);
    const at = now();
    const fraudFlags = [...new Set([...(thread.fraudFlags || []), ...flags.map((flag) => flag.id)])];

    await db.collection(MESSAGES).insertOne({
      id: newRef("MS"),
      threadId: thread.id,
      from: sender,
      body: text,
      fraudFlags: flags,
      readBy: [sender],
      createdAt: at,
    });
    await db.collection(THREADS).updateOne(
      { id: thread.id },
      {
        $set: {
          fraudFlags,
          lastMessageAt: at,
          lastMessagePreview: text.slice(0, 140),
          updatedAt: at,
          ...(thread.stage === "New" && thread.participants.length ? { stage: "Negotiating" } : {}),
        },
      },
    );
    return { ok: true, flags };
  } catch (error) {
    console.error("[inbox] send failed", error.message);
    return { ok: false, error: "Could not send the message." };
  }
}

export async function getThread(id, email) {
  const key = String(email || "").toLowerCase();
  try {
    const thread = await db.collection(THREADS).findOne({ id: String(id) });
    if (!thread || !thread.participants.includes(key)) return null;
    const messages = await db.collection(MESSAGES).find({ threadId: thread.id }).sort({ createdAt: 1 }).toArray();
    return { thread, messages };
  } catch (error) {
    console.error("[inbox] thread read failed", error.message);
    return null;
  }
}

export async function getThreadsFor(email) {
  const key = String(email || "").toLowerCase();
  if (!key) return [];
  try {
    const threads = await db
      .collection(THREADS)
      .find({ participants: key })
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .toArray();
    const unread = await db
      .collection(MESSAGES)
      .aggregate([
        { $match: { threadId: { $in: threads.map((thread) => thread.id) }, from: { $ne: key }, readBy: { $ne: key } } },
        { $group: { _id: "$threadId", n: { $sum: 1 } } },
      ])
      .toArray();
    const unreadMap = new Map(unread.map((row) => [row._id, row.n]));
    const others = [...new Set(threads.flatMap((thread) => thread.participants.filter((p) => p !== key)))];
    const profiles = await db
      .collection("company_profiles")
      .find({ email: { $in: others } })
      .project({ email: 1, legalName: 1, country: 1 })
      .toArray();
    const profileMap = new Map(profiles.map((doc) => [doc.email, doc]));
    const users = await db.collection("user").find({ email: { $in: others } }).project({ name: 1, email: 1 }).toArray();
    const userMap = new Map(users.map((doc) => [doc.email, doc]));

    return threads.map((thread) => ({
      ...thread,
      unread: unreadMap.get(thread.id) || 0,
      counterpart: otherParty(thread, key),
      counterpartName:
        profileMap.get(otherParty(thread, key))?.legalName ||
        userMap.get(otherParty(thread, key))?.name ||
        otherParty(thread, key),
      counterpartCountry: profileMap.get(otherParty(thread, key))?.country || "",
      relativeTime: timeAgo(thread.lastMessageAt),
    }));
  } catch (error) {
    console.error("[inbox] list read failed", error.message);
    return [];
  }
}

function otherParty(thread, key) {
  return thread.participants.find((participant) => participant !== key) || "";
}

export async function markThreadRead(threadId, email) {
  const key = String(email || "").toLowerCase();
  try {
    await db.collection(MESSAGES).updateMany(
      { threadId: String(threadId), from: { $ne: key } },
      { $addToSet: { readBy: key } },
    );
  } catch (error) {
    console.error("[inbox] read mark failed", error.message);
  }
}

export async function setThreadStage(threadId, email, stage) {
  const key = String(email || "").toLowerCase();
  if (!THREAD_STAGES.includes(stage)) return { ok: false, error: "Unknown stage." };
  try {
    const result = await db.collection(THREADS).updateOne(
      { id: String(threadId), participants: key },
      { $set: { stage, updatedAt: now() } },
    );
    return { ok: result.matchedCount === 1 };
  } catch (error) {
    console.error("[inbox] stage update failed", error.message);
    return { ok: false };
  }
}

/* ------------------------------------------------------------------ *
 * Contact reveal by tier + daily limit (§7.4.2)
 * ------------------------------------------------------------------ */

export async function contactQuota(email, tier = "free") {
  const key = String(email || "").toLowerCase();
  const settings = await getPricingSettings();
  const plan = settings.tiers.find((item) => item.key === tier) || settings.tiers[0];
  const limit = Number(plan?.limits?.directContactsPerDay) || 0;

  let used = 0;
  try {
    const row = await db.collection(REVEALS).findOne({ email: key, day: dayKey() });
    used = row?.count || 0;
  } catch (error) {
    console.error("[inbox] quota read failed", error.message);
  }

  return { limit, used, remaining: Math.max(0, limit - used) };
}

/**
 * Reveal the other party's contact details, consuming one slot of the
 * caller's daily allowance (members can check a thread repeatedly for free).
 */
export async function revealContact(threadId, email, tier = "free") {
  const key = String(email || "").toLowerCase();
  try {
    const thread = await db.collection(THREADS).findOne({ id: String(threadId) });
    if (!thread || !thread.participants.includes(key)) {
      return { ok: false, error: "Conversation not found." };
    }

    const other = otherParty(thread, key);
    const quota = await contactQuota(key, tier);
    const day = dayKey();
    const row = await db.collection(REVEALS).findOne({ email: key, day });
    const alreadyRevealed = (row?.threadIds || []).includes(thread.id);

    if (!alreadyRevealed) {
      if (quota.remaining <= 0) {
        return {
          ok: false,
          error: `Your ${tier} plan allows ${quota.limit} contact reveal${quota.limit === 1 ? "" : "s"} per day. Try again tomorrow or upgrade your plan.`,
        };
      }
      await db.collection(REVEALS).updateOne(
        { email: key, day },
        { $inc: { count: 1 }, $addToSet: { threadIds: thread.id }, $setOnInsert: { createdAt: now() } },
        { upsert: true },
      );
    }

    const profile = await getProfile(other);
    const user = await db.collection("user").findOne({ email: other }, { projection: { name: 1, email: 1 } });
    return {
      ok: true,
      contact: {
        name: user?.name || profile.legalName || other,
        email: other,
        phone: profile.phone || "",
        country: profile.country || "",
        company: profile.legalName || "",
      },
      remaining: Math.max(0, quota.remaining - (alreadyRevealed ? 0 : 1)),
      limit: quota.limit,
    };
  } catch (error) {
    console.error("[inbox] reveal failed", error.message);
    return { ok: false, error: "Could not reveal contact details." };
  }
}

/* ------------------------------------------------------------------ *
 * Reporting (§7.4.4 → Inquiry Monitor)
 * ------------------------------------------------------------------ */

export async function reportThread(threadId, email, reason) {
  const key = String(email || "").toLowerCase();
  const detail = cleanText(reason, 400);
  if (!detail) return { ok: false, error: "Tell us what looks wrong." };

  try {
    const thread = await db.collection(THREADS).findOne({ id: String(threadId) });
    if (!thread || !thread.participants.includes(key)) {
      return { ok: false, error: "Conversation not found." };
    }
    const existing = await db.collection(REPORTS).findOne({ threadId: thread.id, status: "open" });
    if (existing) return { ok: true, duplicate: true };

    await db.collection(REPORTS).insertOne({
      id: newRef("RP"),
      threadId: thread.id,
      subject: thread.subject,
      parties: thread.participants,
      reportedBy: key,
      reason: detail,
      status: "open",
      createdAt: now(),
      resolvedAt: null,
      resolvedBy: null,
    });
    await db.collection(THREADS).updateOne({ id: thread.id }, { $set: { reported: true, updatedAt: now() } });
    return { ok: true };
  } catch (error) {
    console.error("[inbox] report failed", error.message);
    return { ok: false, error: "Could not file the report." };
  }
}

export async function getOpenReports() {
  try {
    return await db.collection(REPORTS).find({}).sort({ createdAt: -1 }).limit(100).toArray();
  } catch (error) {
    console.error("[inbox] reports read failed", error.message);
    return [];
  }
}

export async function decideReport(reportId, status, actor) {
  if (!["resolved", "escalated"].includes(status)) return { ok: false, error: "Unknown status." };
  try {
    const result = await db.collection(REPORTS).updateOne(
      { id: String(reportId) },
      { $set: { status, resolvedAt: now(), resolvedBy: actor } },
    );
    if (result.matchedCount === 0) return { ok: false, error: "Report not found." };
    if (status === "resolved") {
      const report = await db.collection(REPORTS).findOne({ id: String(reportId) });
      await db.collection(THREADS).updateOne({ id: report?.threadId }, { $set: { reported: false } });
    }
    return { ok: true, status };
  } catch (error) {
    console.error("[inbox] report decision failed", error.message);
    return { ok: false, error: "Could not update the report." };
  }
}
