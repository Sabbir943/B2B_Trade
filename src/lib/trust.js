import { db } from "./db";
import { cleanText, newRef, now } from "./refs";
import { REQUIREMENT_STATUS } from "./requirements";

/**
 * Reviews and Trust Score (spec §7.3.6).
 *
 * Once a requirement is Awarded or Closed, both sides may leave one review.
 * Reviews are the input to the Trust Score shown next to a company name on
 * profiles, listings and inquiry threads.
 *
 * Trust Score = mean rating (as a 0–100 percentage) with a bonus for a live
 * verification badge; accounts with no reviews yet sit on a neutral 50.
 */

const REVIEWS = "reviews";
const BADGES = "badges";

export const NEUTRAL_TRUST = 50;

function scoreFrom(rating) {
  return Math.round((Number(rating) / 5) * 100);
}

function labelFor(score) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Trusted";
  if (score >= 60) return "Good";
  if (score >= 40) return "New";
  return "Unproven";
}

export async function leaveReview({ requirementId, from, to, rating, comment = "" }) {
  const sender = String(from || "").toLowerCase();
  const receiver = String(to || "").toLowerCase();
  if (!sender || !receiver || sender === receiver) {
    return { ok: false, error: "You can only review the other party." };
  }

  const value = Number(rating);
  if (!Number.isFinite(value) || value < 1 || value > 5) {
    return { ok: false, error: "Choose a rating between 1 and 5." };
  }

  try {
    const requirement = await db.collection("requirements").findOne({ id: String(requirementId || "") });
    if (!requirement) return { ok: false, error: "Requirement not found." };
    if (![REQUIREMENT_STATUS.AWARDED, REQUIREMENT_STATUS.CLOSED].includes(requirement.status)) {
      return { ok: false, error: "Reviews open once the requirement is awarded or closed." };
    }
    const isBuyer = requirement.email === sender;
    const quotedSupplier = await db.collection("threads").findOne({
      requirementId: requirement.id,
      participants: sender,
    });

    let counterpart;
    if (isBuyer) {
      // The buyer may only review a supplier who actually quoted.
      const quoted = await db.collection("threads").findOne({
        requirementId: requirement.id,
        participants: receiver,
      });
      if (!quoted) return { ok: false, error: "You can only review suppliers who quoted." };
      counterpart = receiver;
    } else if (quotedSupplier) {
      // A quoting supplier reviews the buyer who posted the requirement.
      counterpart = requirement.email;
    } else {
      return { ok: false, error: "Only the buyer and the quoting suppliers can review." };
    }

    const existing = await db.collection(REVIEWS).findOne({ requirementId: requirement.id, from: sender });
    if (existing) return { ok: false, error: "You already reviewed this requirement." };

    const review = {
      id: newRef("RV"),
      requirementId: requirement.id,
      from: sender,
      to: counterpart,
      rating: Math.round(value),
      comment: cleanText(comment, 600),
      createdAt: now(),
    };
    await db.collection(REVIEWS).insertOne(review);
    return { ok: true, review };
  } catch (error) {
    console.error("[trust] review failed", error.message);
    return { ok: false, error: "Could not save the review." };
  }
}

export async function getReviewsFor(email) {
  const key = String(email || "").toLowerCase();
  if (!key) return [];
  try {
    return await db.collection(REVIEWS).find({ to: key }).sort({ createdAt: -1 }).limit(50).toArray();
  } catch (error) {
    console.error("[trust] reviews read failed", error.message);
    return [];
  }
}

async function hasActiveBadge(email) {
  try {
    const count = await db.collection(BADGES).countDocuments({
      email: String(email || "").toLowerCase(),
      revokedAt: null,
      expiresAt: { $gt: now() },
    });
    return count > 0;
  } catch {
    return false;
  }
}

export async function getTrustScore(email) {
  const key = String(email || "").toLowerCase();
  if (!key) return { score: NEUTRAL_TRUST, label: labelFor(NEUTRAL_TRUST), count: 0, verified: false };
  try {
    const rows = await db
      .collection(REVIEWS)
      .aggregate([{ $match: { to: key } }, { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } }])
      .toArray();
    const verified = await hasActiveBadge(key);
    const count = rows[0]?.n ?? 0;
    const base = count ? scoreFrom(rows[0].avg) : NEUTRAL_TRUST;
    const score = Math.max(0, Math.min(100, base + (verified ? 8 : 0)));
    return { score, label: labelFor(score), count, verified };
  } catch (error) {
    console.error("[trust] score read failed", error.message);
    return { score: NEUTRAL_TRUST, label: labelFor(NEUTRAL_TRUST), count: 0, verified: false };
  }
}

/** Bulk variant for directories and search results. */
export async function getTrustScores(emails = []) {
  const keys = [...new Set(emails.map((email) => String(email || "").toLowerCase()).filter(Boolean))];
  const map = new Map();
  for (const key of keys) map.set(key, { score: NEUTRAL_TRUST, label: labelFor(NEUTRAL_TRUST), count: 0, verified: false });
  if (!keys.length) return map;
  try {
    const rows = await db
      .collection(REVIEWS)
      .aggregate([{ $match: { to: { $in: keys } } }, { $group: { _id: "$to", avg: { $avg: "$rating" }, n: { $sum: 1 } } }])
      .toArray();
    const badges = await db
      .collection(BADGES)
      .aggregate([
        { $match: { email: { $in: keys }, revokedAt: null, expiresAt: { $gt: now() } } },
        { $group: { _id: "$email" } },
      ])
      .toArray();
    const verified = new Set(badges.map((row) => row._id));
    for (const key of keys) {
      const row = rows.find((item) => item._id === key);
      const count = row?.n ?? 0;
      const base = count ? scoreFrom(row.avg) : NEUTRAL_TRUST;
      const score = Math.max(0, Math.min(100, base + (verified.has(key) ? 8 : 0)));
      map.set(key, { score, label: labelFor(score), count, verified: verified.has(key) });
    }
  } catch (error) {
    console.error("[trust] bulk score read failed", error.message);
  }
  return map;
}
