import { db } from "./db";
import { cleanText, newRef, now } from "./refs";

/**
 * Product listings (spec §7.2 — Product listing).
 *
 *   1. Seller submits title, category, HS Code, description, MOQ, price range,
 *      Incoterms, supply capacity, origin country and up to 5 images.
 *   2. Staff moderation (approve / reject with reason) → `admin.listings`.
 *   3. Published; the number of active listings is checked against the
 *      membership tier's listing limit before every submission.
 *
 * Statuses: draft → pending → approved | rejected (rejected can be resubmitted).
 */

const LISTINGS = "listings";

export const LISTING_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

/** Listings that occupy a slot in the tier's limit. */
export const LIMIT_COUNTED = [LISTING_STATUS.PENDING, LISTING_STATUS.APPROVED];

export { INCOTERMS } from "./trade-constants";
import { INCOTERMS } from "./trade-constants";
export const MAX_IMAGES = 5;

export const LISTING_LIMIT_HINTS = {
  free: "Free plan includes 5 active listings.",
  silver: "Silver plan includes 25 active listings.",
  gold: "Gold plan includes 100 active listings.",
  platinum: "Platinum plan includes unlimited listings.",
};

function normalizeHs(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.slice(0, 10);
}

function normalizeImages(input) {
  const list = Array.isArray(input) ? input : [];
  return list
    .map((value) => String(value || "").trim())
    .filter((value) => value.length > 0 && value.length < 500)
    .slice(0, MAX_IMAGES);
}

/**
 * Tier listing allowance (§7.2.3) — reads the live pricing settings so a
 * console price change takes effect immediately.
 */
export async function listingAllowance(email, tier = "free") {
  const { getPricingSettings } = await import("./membership");
  const settings = await getPricingSettings();
  const plan = settings.tiers.find((item) => item.key === tier) || settings.tiers[0];
  const unlimited = Boolean(plan.limits.productListingsUnlimited);
  const limit = unlimited ? Infinity : Number(plan.limits.productListings) || 0;

  let used = 0;
  try {
    used = await db.collection(LISTINGS).countDocuments({
      email: String(email || "").toLowerCase(),
      status: { $in: LIMIT_COUNTED },
    });
  } catch (error) {
    console.error("[listings] count failed", error.message);
  }

  return {
    unlimited,
    limit,
    used,
    remaining: unlimited ? Infinity : Math.max(0, limit - used),
    allowed: unlimited || used < limit,
    label: unlimited ? "Unlimited" : `${limit}`,
  };
}

/** Full validation for §7.2.1 — returns `{ ok, error }` or `{ ok, listing }`. */
export async function createListing(email, input = {}, tier = "free") {
  const key = String(email || "").toLowerCase();
  if (!key) return { ok: false, error: "Sign in to list a product." };

  const title = cleanText(input.title, 140);
  if (title.length < 4) return { ok: false, error: "Enter a product title of at least 4 characters." };

  const category = String(input.category || "").trim();
  if (!category) return { ok: false, error: "Choose a category." };

  const description = cleanText(input.description, 4000);
  if (description.length < 20) {
    return { ok: false, error: "Describe the product in at least 20 characters." };
  }

  const moq = cleanText(input.moq, 80);
  if (!moq) return { ok: false, error: "Minimum order quantity (MOQ) is required." };

  const priceMin = Number(input.priceMin);
  const priceMax = Number(input.priceMax);
  if (!Number.isFinite(priceMin) || priceMin < 0 || !Number.isFinite(priceMax) || priceMax < 0) {
    return { ok: false, error: "Enter a valid price range." };
  }
  if (priceMax && priceMin > priceMax) {
    return { ok: false, error: "The maximum price cannot be below the minimum." };
  }

  const incoterm = String(input.incoterm || "FOB").toUpperCase();
  if (!INCOTERMS.includes(incoterm)) return { ok: false, error: "Choose a valid Incoterm." };

  const allowance = await listingAllowance(key, tier);
  if (!allowance.allowed) {
    return {
      ok: false,
      error: `Your ${tier} plan allows ${allowance.limit} active listings and you have ${allowance.used}. Upgrade to add more.`,
    };
  }

  const listing = {
    id: newRef("LS"),
    email: key,
    title,
    category,
    subcategory: cleanText(input.subcategory, 80),
    hsCode: normalizeHs(input.hsCode),
    description,
    moq,
    priceMin,
    priceMax,
    currency: input.currency === "BDT" ? "BDT" : "USD",
    incoterm,
    capacity: cleanText(input.capacity, 120),
    originCountry: cleanText(input.originCountry, 60),
    images: normalizeImages(input.images),
    status: input.draft ? LISTING_STATUS.DRAFT : LISTING_STATUS.PENDING,
    rejectionReason: "",
    views: 0,
    inquiries: 0,
    createdAt: now(),
    updatedAt: now(),
    moderatedAt: null,
    moderatedBy: null,
  };

  try {
    await db.collection(LISTINGS).insertOne(listing);
  } catch (error) {
    console.error("[listings] insert failed", error.message);
    return { ok: false, error: "Could not save the listing." };
  }

  return { ok: true, listing };
}

export async function getListing(id) {
  try {
    return await db.collection(LISTINGS).findOne({ id: String(id || "") });
  } catch (error) {
    console.error("[listings] read failed", error.message);
    return null;
  }
}

export async function getListingsBySeller(email) {
  const key = String(email || "").toLowerCase();
  try {
    return await db
      .collection(LISTINGS)
      .find({ email: key })
      .sort({ updatedAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[listings] seller read failed", error.message);
    return [];
  }
}

/** Every listing, optionally filtered by status — staff moderation view. */
export async function getAllListings({ status, limit = 200 } = {}) {
  const filter = {};
  if (status) filter.status = status;
  try {
    return await db
      .collection(LISTINGS)
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error("[listings] all read failed", error.message);
    return [];
  }
}

/** Published catalogue for public pages and search (§7.2.3). */
export async function getPublishedListings({ category, q, hsCode, email, limit = 60 } = {}) {
  const filter = { status: LISTING_STATUS.APPROVED };
  if (category) filter.category = category;
  if (email) filter.email = String(email).toLowerCase();
  if (hsCode) filter.hsCode = new RegExp(`^${String(hsCode).replace(/\D/g, "")}`);
  if (q) {
    const pattern = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: pattern }, { description: pattern }, { moq: pattern }];
  }
  try {
    return await db.collection(LISTINGS).find(filter).sort({ updatedAt: -1 }).limit(limit).toArray();
  } catch (error) {
    console.error("[listings] public read failed", error.message);
    return [];
  }
}

/** Approved listings grouped by seller — the supplier directory source. */
export async function getSellersWithListings() {
  try {
    const rows = await db
      .collection(LISTINGS)
      .aggregate([
        { $match: { status: LISTING_STATUS.APPROVED } },
        {
          $group: {
            _id: "$email",
            listings: { $push: "$$ROOT" },
            count: { $sum: 1 },
            updatedAt: { $max: "$updatedAt" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 60 },
      ])
      .toArray();
    return rows.map((row) => ({ email: row._id, listings: row.listings, count: row.count, updatedAt: row.updatedAt }));
  } catch (error) {
    console.error("[listings] sellers read failed", error.message);
    return [];
  }
}

export async function recordListingView(id) {
  try {
    await db.collection(LISTINGS).updateOne({ id: String(id) }, { $inc: { views: 1 } });
  } catch (error) {
    console.error("[listings] view increment failed", error.message);
  }
}

export async function recordListingInquiry(id) {
  try {
    await db.collection(LISTINGS).updateOne({ id: String(id) }, { $inc: { inquiries: 1 } });
  } catch (error) {
    console.error("[listings] inquiry increment failed", error.message);
  }
}

/** §7.2.2 — staff moderation result, including the rejection reason. */
export async function setListingStatus(id, status, { reason = "", moderator = "" } = {}) {
  if (![LISTING_STATUS.APPROVED, LISTING_STATUS.REJECTED].includes(status)) {
    return { ok: false, error: "Unknown listing status." };
  }
  try {
    const result = await db.collection(LISTINGS).updateOne(
      { id: String(id) },
      {
        $set: {
          status,
          rejectionReason: status === LISTING_STATUS.REJECTED ? cleanText(reason, 240) || "Rejected by moderation." : "",
          moderatedBy: moderator,
          moderatedAt: now(),
          updatedAt: now(),
        },
      },
    );
    if (result.matchedCount === 0) return { ok: false, error: "Listing not found." };
    return { ok: true };
  } catch (error) {
    console.error("[listings] moderation failed", error.message);
    return { ok: false, error: "Could not update the listing." };
  }
}

export async function deleteListing(id, email) {
  try {
    const result = await db.collection(LISTINGS).deleteOne({
      id: String(id),
      email: String(email || "").toLowerCase(),
      status: { $in: [LISTING_STATUS.DRAFT, LISTING_STATUS.REJECTED] },
    });
    return { ok: result.deletedCount === 1 };
  } catch (error) {
    console.error("[listings] delete failed", error.message);
    return { ok: false };
  }
}
