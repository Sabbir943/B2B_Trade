import { db } from "./db";
import { cleanParagraph, cleanText, addHours, isPast, newRef, now } from "./refs";
import { getPublishedListings } from "./listings";

/**
 * Buy requirements → supplier match (spec §7.3).
 *
 *   1. Buyer posts product, specs, quantity + unit, HS Code (optional),
 *      shipping terms, destination port, payment terms and preferred
 *      supplier countries.
 *   2. Staff moderation for spam and fraud — target within 12 hours
 *      (`moderationDueAt`).
 *   3. Published and auto-matched: matching category / HS Code / country
 *      suppliers get a match record whose `notifyAt` follows the supplier's
 *      membership tier (Platinum 12 hours early, Gold instant, Silver after
 *      48 hours, Free views immediately but cannot contact).
 *   4. Suppliers quote through the inbox (a thread carrying `requirementId`).
 *   5. If no quote arrives within 72 hours the Sourcing Desk flow starts;
 *      the buyer can also press "Request Sourcing Help" at any time.
 *   6. Buyer marks the requirement Awarded or Closed; both sides leave a
 *      review, which feeds the Trust Score (see ./trust.js).
 *
 * Matching in the first version is rule-based only (category + HS Code +
 * country) — AI matching comes later once real data exists.
 */

const REQUIREMENTS = "requirements";
const MATCHES = "requirement_matches";
const SOURCING = "sourcing_requests";

export const REQUIREMENT_STATUS = {
  PENDING: "pending",
  PUBLISHED: "published",
  REJECTED: "rejected",
  AWARDED: "awarded",
  CLOSED: "closed",
};

/** §7.3.2 — staff moderation target. */
export const MODERATION_TARGET_HOURS = 12;
/** §7.3.5 — no quote in this window starts the Sourcing Desk flow. */
export const QUOTE_WINDOW_HOURS = 72;

const MATCH_WEIGHTS = { category: 40, hs: 35, country: 25 };

export const SHIPPING_TERMS = ["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"];
export const PAYMENT_TERMS = [
  "Telegraphic transfer (T/T)",
  "Letter of credit (L/C)",
  "Documents against payment (D/P)",
  "Open account",
  "Cash against delivery",
  "To be agreed",
];

/* ------------------------------------------------------------------ *
 * Write
 * ------------------------------------------------------------------ */

export async function createRequirement(email, input = {}) {
  const key = String(email || "").toLowerCase();
  if (!key) return { ok: false, error: "Sign in to post a requirement." };

  const product = cleanText(input.product, 140);
  if (product.length < 4) return { ok: false, error: "Enter what you need to source." };

  const category = String(input.category || "").trim();
  if (!category) return { ok: false, error: "Choose a category." };

  const quantity = String(input.quantity ?? "").replace(/[^\d.,\s]/g, "").trim();
  if (!quantity) return { ok: false, error: "Enter the quantity you need." };

  const unit = String(input.unit || "kg").trim();
  const specs = cleanParagraph(input.specs ?? input.details, 4000);
  if (specs.length < 15) return { ok: false, error: "Add specifications so suppliers can quote." };

  const shippingTerms = String(input.shippingTerms || input.incoterm || "FOB").toUpperCase();
  if (!SHIPPING_TERMS.includes(shippingTerms)) {
    return { ok: false, error: "Choose a valid shipping term." };
  }

  const paymentTerms = cleanText(input.paymentTerms, 80) || PAYMENT_TERMS[PAYMENT_TERMS.length - 1];
  const preferredCountries = Array.isArray(input.preferredCountries)
    ? [...new Set(input.preferredCountries.map((value) => String(value).trim()).filter(Boolean))].slice(0, 8)
    : [];

  const createdAt = now();
  const requirement = {
    id: newRef("RQ"),
    email: key,
    product,
    category,
    subcategory: cleanText(input.subcategory, 80),
    specs,
    quantity,
    unit,
    hsCode: String(input.hsCode ?? "").replace(/\D/g, "").slice(0, 10),
    shippingTerms,
    destinationPort: cleanText(input.destinationPort || input.destination, 100),
    paymentTerms,
    preferredCountries,
    targetDate: cleanText(input.targetDate, 40),
    status: REQUIREMENT_STATUS.PENDING,
    moderationReason: "",
    moderationDueAt: addHours(createdAt, MODERATION_TARGET_HOURS),
    publishedAt: null,
    resolvedAt: null,
    escalated: false,
    matched: 0,
    createdAt,
    updatedAt: createdAt,
  };

  try {
    await db.collection(REQUIREMENTS).insertOne(requirement);
  } catch (error) {
    console.error("[requirements] insert failed", error.message);
    return { ok: false, error: "Could not save the requirement." };
  }

  return { ok: true, requirement };
}

/** Staff moderation (§7.3.2). Approving triggers the auto-match (§7.3.3). */
export async function publishRequirement(id, moderator) {
  const publishedAt = now();
  try {
    const result = await db.collection(REQUIREMENTS).updateOne(
      { id: String(id), status: REQUIREMENT_STATUS.PENDING },
      {
        $set: {
          status: REQUIREMENT_STATUS.PUBLISHED,
          publishedAt,
          updatedAt: publishedAt,
          moderatedBy: moderator,
          moderationReason: "",
        },
      },
    );
    if (result.matchedCount === 0) return { ok: false, error: "That requirement is not awaiting moderation." };
  } catch (error) {
    console.error("[requirements] publish failed", error.message);
    return { ok: false, error: "Could not publish the requirement." };
  }

  const requirement = await getRequirement(id);
  const matched = await matchRequirement(requirement);
  return { ok: true, matched };
}

export async function rejectRequirement(id, reason, moderator) {
  try {
    const result = await db.collection(REQUIREMENTS).updateOne(
      { id: String(id), status: REQUIREMENT_STATUS.PENDING },
      {
        $set: {
          status: REQUIREMENT_STATUS.REJECTED,
          moderationReason: cleanText(reason, 240) || "Rejected by moderation.",
          moderatedBy: moderator,
          updatedAt: now(),
        },
      },
    );
    return { ok: result.matchedCount === 1 };
  } catch (error) {
    console.error("[requirements] reject failed", error.message);
    return { ok: false };
  }
}

/** §7.3.6 — buyer decides; reviews open for both sides afterwards. */
export async function setRequirementOutcome(id, email, outcome, awardedTo = "") {
  const key = String(email || "").toLowerCase();
  const allowed = [REQUIREMENT_STATUS.AWARDED, REQUIREMENT_STATUS.CLOSED];
  if (!allowed.includes(outcome)) return { ok: false, error: "Unknown outcome." };

  try {
    const update = { status: outcome, resolvedAt: now(), updatedAt: now() };
    if (outcome === REQUIREMENT_STATUS.AWARDED && awardedTo) {
      update.awardedTo = String(awardedTo).toLowerCase();
    }
    const result = await db.collection(REQUIREMENTS).updateOne(
      { id: String(id), email: key, status: { $in: [REQUIREMENT_STATUS.PUBLISHED, REQUIREMENT_STATUS.AWARDED, REQUIREMENT_STATUS.CLOSED] } },
      { $set: update },
    );
    if (result.matchedCount === 0) {
      return { ok: false, error: "Only the buyer can close or award their own published requirement." };
    }
    return { ok: true, status: outcome };
  } catch (error) {
    console.error("[requirements] outcome failed", error.message);
    return { ok: false, error: "Could not update the requirement." };
  }
}

/* ------------------------------------------------------------------ *
 * Read
 * ------------------------------------------------------------------ */

export async function getRequirement(id) {
  try {
    return await db.collection(REQUIREMENTS).findOne({ id: String(id || "") });
  } catch (error) {
    console.error("[requirements] read failed", error.message);
    return null;
  }
}

export async function getRequirementsByBuyer(email) {
  const key = String(email || "").toLowerCase();
  try {
    return await db
      .collection(REQUIREMENTS)
      .find({ email: key })
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[requirements] buyer read failed", error.message);
    return [];
  }
}

export async function getPublishedRequirements({ category, q, limit = 60 } = {}) {
  const filter = {
    status: { $in: [REQUIREMENT_STATUS.PUBLISHED, REQUIREMENT_STATUS.AWARDED, REQUIREMENT_STATUS.CLOSED] },
  };
  if (category) filter.category = category;
  if (q) {
    const pattern = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ product: pattern }, { specs: pattern }];
  }
  try {
    return await db.collection(REQUIREMENTS).find(filter).sort({ publishedAt: -1 }).limit(limit).toArray();
  } catch (error) {
    console.error("[requirements] public read failed", error.message);
    return [];
  }
}

/** Every requirement, newest first — the admin moderation page's full list. */
export async function getAllRequirements(limit = 200) {
  try {
    return await db
      .collection(REQUIREMENTS)
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error("[requirements] admin read failed", error.message);
    return [];
  }
}

/** Requirements still inside the moderation SLA window (§7.3.2). */
export async function getRequirementsAwaitingModeration() {
  try {
    return await db
      .collection(REQUIREMENTS)
      .find({ status: REQUIREMENT_STATUS.PENDING })
      .sort({ createdAt: 1 })
      .toArray();
  } catch (error) {
    console.error("[requirements] queue read failed", error.message);
    return [];
  }
}

/** How many quotes a requirement has — one thread per quoting supplier. */
export async function quoteCount(requirementId) {
  try {
    return await db.collection("threads").countDocuments({ requirementId: String(requirementId) });
  } catch (error) {
    console.error("[requirements] quote count failed", error.message);
    return 0;
  }
}

export async function quoteCountByRequirement(ids = []) {
  const keys = ids.map((id) => String(id));
  if (!keys.length) return new Map();
  try {
    const rows = await db
      .collection("threads")
      .aggregate([{ $match: { requirementId: { $in: keys } } }, { $group: { _id: "$requirementId", n: { $sum: 1 } } }])
      .toArray();
    return new Map(rows.map((row) => [row._id, row.n]));
  } catch (error) {
    console.error("[requirements] quote counts failed", error.message);
    return new Map();
  }
}

/* ------------------------------------------------------------------ *
 * Rule-based matching (§7.3.3) + tier notification timing
 * ------------------------------------------------------------------ */

/**
 * When a matched supplier learns about the requirement, by their tier:
 *   Platinum → 12 hours early, Gold → instant, Silver → after 48 hours,
 *   Free → can view immediately but contact details stay hidden.
 */
export function notifyAtFor(tier, publishedAt) {
  const published = new Date(publishedAt || now());
  switch (tier) {
    case "platinum":
      return addHours(published, -12);
    case "gold":
      return published;
    case "silver":
      return addHours(published, 48);
    default:
      return published;
  }
}

function tierOf(user) {
  return user?.tier || "free";
}

/**
 * Rule-based matcher: category + HS Code + country.
 * Returns the suppliers to notify with a score and the reasons they matched.
 */
export async function findMatches(requirement) {
  if (!requirement) return [];
  const preferred = requirement.preferredCountries || [];
  const hs = requirement.hsCode || "";

  const [listings] = await Promise.all([getPublishedListings({ category: requirement.category, limit: 200 })]);

  // Suppliers who publish in the same category (or a matching HS heading).
  const byEmail = new Map();
  for (const listing of listings) {
    const categoryHit = listing.category === requirement.category;
    const hsHit = Boolean(hs && listing.hsCode && hs.startsWith(listing.hsCode.slice(0, 4)));
    const countryHit = preferred.length > 0 && preferred.includes(listing.originCountry);
    if (!categoryHit && !hsHit && !countryHit) continue;

    const entry = byEmail.get(listing.email) || { email: listing.email, score: 0, reasons: [] };
    if (categoryHit) {
      entry.score += MATCH_WEIGHTS.category;
      entry.reasons.push("category");
    }
    if (hsHit) {
      entry.score += MATCH_WEIGHTS.hs;
      entry.reasons.push("hs");
    }
    if (countryHit && !entry.reasons.includes("country")) {
      entry.score += MATCH_WEIGHTS.country;
      entry.reasons.push("country");
    }
    byEmail.set(listing.email, entry);
  }

  // Country-only rule: suppliers based in a preferred country with no
  // published listing in this category still get notified (§7.3.3).
  if (preferred.length) {
    const supplierEmails = [...byEmail.keys()];
    const extra = await db
      .collection("company_profiles")
      .find({ country: { $in: preferred }, email: { $nin: supplierEmails } })
      .limit(200)
      .toArray();
    for (const doc of extra) {
      if (!doc.categories?.length && !doc.legalName) continue;
      byEmail.set(doc.email, {
        email: doc.email,
        score: MATCH_WEIGHTS.country,
        reasons: ["country"],
      });
    }
  }

  // Never notify the buyer about their own requirement, and skip suspended
  // accounts — tier decides *when* they hear, not *whether* they do.
  const rows = [...byEmail.values()].filter((entry) => entry.email !== requirement.email);
  if (!rows.length) return [];

  const users = await db
    .collection("user")
    .find({ email: { $in: rows.map((row) => row.email) }, suspended: { $ne: true } })
    .project({ email: 1, tier: 1 })
    .toArray();
  const tierByEmail = new Map(users.map((user) => [user.email, tierOf(user)]));

  return rows
    .map((row) => ({
      ...row,
      tier: tierByEmail.get(row.email) || "free",
      notifyAt: notifyAtFor(tierByEmail.get(row.email) || "free", requirement.publishedAt),
    }))
    .sort((a, b) => b.score - a.score);
}

/** Upsert the match rows for a freshly published requirement. */
export async function matchRequirement(requirement) {
  if (!requirement) return 0;
  try {
    const matches = await findMatches(requirement);
    const at = now();
    for (const match of matches) {
      await db.collection(MATCHES).updateOne(
        { requirementId: requirement.id, email: match.email },
        {
          $set: {
            requirementId: requirement.id,
            email: match.email,
            score: match.score,
            reasons: match.reasons,
            tier: match.tier,
            notifyAt: match.notifyAt,
            updatedAt: at,
          },
          $setOnInsert: { createdAt: at, viewedAt: null },
        },
        { upsert: true },
      );
    }
    await db
      .collection(REQUIREMENTS)
      .updateOne({ id: requirement.id }, { $set: { matched: matches.length, updatedAt: at } });
    return matches.length;
  } catch (error) {
    console.error("[requirements] match failed", error.message);
    return 0;
  }
}

/**
 * Matches a supplier is allowed to see *now* — the tier timing gate
 * (§7.3.3) is applied on read so a tier change takes effect immediately.
 */
export async function getVisibleMatches(email) {
  const key = String(email || "").toLowerCase();
  if (!key) return [];
  try {
    const rows = await db.collection(MATCHES).find({ email: key }).sort({ notifyAt: -1 }).limit(100).toArray();
    // Tier timing gate: a match only becomes visible once its notifyAt has
    // passed (Platinum −12h, Gold instant, Silver +48h, Free at publish).
    const visible = rows.filter((row) => new Date(row.notifyAt).getTime() <= Date.now());
    const requirementIds = visible.map((row) => row.requirementId);
    const docs = requirementIds.length
      ? await db.collection(REQUIREMENTS).find({ id: { $in: requirementIds } }).toArray()
      : [];
    const byId = new Map(docs.map((doc) => [doc.id, doc]));
    return visible
      .map((row) => ({ ...row, requirement: byId.get(row.requirementId) || null }))
      .filter((row) => row.requirement && row.requirement.status !== REQUIREMENT_STATUS.REJECTED);
  } catch (error) {
    console.error("[requirements] matches read failed", error.message);
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Sourcing Desk trigger (§7.3.5)
 * ------------------------------------------------------------------ */

/**
 * Opens a Sourcing Desk request when a published requirement has been live
 * for 72 hours without a single quote. Idempotent — safe to call on every
 * page view. Buyers can also trigger it manually at any time.
 */
export async function ensureSourcingEscalation(requirement) {
  if (!requirement) return null;
  if (requirement.status !== REQUIREMENT_STATUS.PUBLISHED) return null;
  if (requirement.escalated) {
    try {
      return await db.collection(SOURCING).findOne({ requirementId: requirement.id });
    } catch {
      return null;
    }
  }
  const liveSince = requirement.publishedAt || requirement.createdAt;
  if (!liveSince || !isPast(addHours(liveSince, QUOTE_WINDOW_HOURS))) return null;

  try {
    const quotes = await quoteCount(requirement.id);
    if (quotes > 0) return null;

    const request = {
      id: newRef("SD"),
      requirementId: requirement.id,
      buyerEmail: requirement.email,
      title: requirement.product,
      reason: "no_quotes_72h",
      source: "auto",
      status: "open",
      createdAt: now(),
    };
    await db.collection(SOURCING).updateOne(
      { requirementId: requirement.id },
      { $set: request, $setOnInsert: { createdAt: request.createdAt } },
      { upsert: true },
    );
    await db
      .collection(REQUIREMENTS)
      .updateOne({ id: requirement.id }, { $set: { escalated: true, updatedAt: now() } });
    return request;
  } catch (error) {
    console.error("[requirements] escalation failed", error.message);
    return null;
  }
}

/** §7.3.5 — "Request Sourcing Help", available to the buyer at any time. */
export async function requestSourcingHelp(requirementId, email) {
  const key = String(email || "").toLowerCase();
  try {
    const requirement = await db.collection(REQUIREMENTS).findOne({ id: String(requirementId), email: key });
    if (!requirement) return { ok: false, error: "Requirement not found." };
    if (requirement.status !== REQUIREMENT_STATUS.PUBLISHED) {
      return { ok: false, error: "Only published requirements can go to the Sourcing Desk." };
    }
    const request = {
      id: newRef("SD"),
      requirementId: requirement.id,
      buyerEmail: key,
      title: requirement.product,
      reason: "buyer_requested",
      source: "buyer",
      status: "open",
      createdAt: now(),
    };
    await db.collection(SOURCING).updateOne(
      { requirementId: requirement.id },
      { $set: request, $setOnInsert: { createdAt: request.createdAt } },
      { upsert: true },
    );
    await db
      .collection(REQUIREMENTS)
      .updateOne({ id: requirement.id }, { $set: { escalated: true, updatedAt: now() } });
    return { ok: true, request };
  } catch (error) {
    console.error("[requirements] sourcing help failed", error.message);
    return { ok: false, error: "Could not open a sourcing request." };
  }
}

export async function getSourcingRequests(limit = 50) {
  try {
    return await db.collection(SOURCING).find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  } catch (error) {
    console.error("[requirements] sourcing read failed", error.message);
    return [];
  }
}

/**
 * Every match on the platform (staff view for /admin/leads) — each row
 * joined with its requirement document.
 */
export async function listAllMatches(limit = 200) {
  try {
    const rows = await db
      .collection(MATCHES)
      .find({})
      .sort({ notifyAt: -1 })
      .limit(limit)
      .toArray();
    const ids = [...new Set(rows.map((row) => row.requirementId))];
    const docs = ids.length
      ? await db.collection(REQUIREMENTS).find({ id: { $in: ids } }).toArray()
      : [];
    const byId = new Map(docs.map((doc) => [doc.id, doc]));
    return rows
      .map((row) => ({ ...row, requirement: byId.get(row.requirementId) || null }))
      .filter((row) => row.requirement);
  } catch (error) {
    console.error("[requirements] all-matches read failed", error.message);
    return [];
  }
}
