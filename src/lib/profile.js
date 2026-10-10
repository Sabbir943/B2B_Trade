import { db } from "./db";
import { cleanText } from "./refs";
import { BUSINESS_TYPES } from "./trade-constants";

/**
 * Company profile (spec §7.1 — Registration and onboarding).
 *
 * One document per account in `company_profiles` (keyed by email). It holds
 * the company details collected during onboarding and edited later from
 * /dashboard/profile:
 *
 *   legal name, country, city, business type, main categories,
 *   year established, website (+ phone, trade volume, about).
 *
 * Rules enforced here (not in the UI):
 *   §7.1.3  Country sets the currency automatically — Bangladesh → BDT,
 *           everything else USD. Members cannot change it themselves, so the
 *           currency is *never* read from client input.
 *   §7.1.4  A completeness meter drives search ranking: profiles under 70%
 *           are demoted (see `searchRank`).
 */

const PROFILES = "company_profiles";

/** §7.1.3 — the only currency rule on the platform. */
export function currencyForCountry(country) {
  return String(country || "").trim() === "Bangladesh" ? "BDT" : "USD";
}

export const CURRENCY_LABELS = { BDT: "BDT — Bangladeshi Taka", USD: "USD — US Dollar" };

/**
 * Completeness meter (§7.1.4). Weights sum to 100; each part is only worth
 * its weight once the field actually holds a value.
 */
const PARTS = [
  { key: "legalName", label: "Legal company name", weight: 15 },
  { key: "country", label: "Country", weight: 10 },
  { key: "city", label: "City", weight: 10 },
  { key: "businessType", label: "Business type", weight: 10 },
  { key: "categories", label: "Main categories", weight: 15, list: true },
  { key: "yearEstablished", label: "Year established", weight: 10 },
  { key: "website", label: "Website", weight: 10 },
  { key: "phone", label: "Phone number", weight: 10 },
  { key: "about", label: "Company description", weight: 10 },
];

export const PROFILE_PARTS = PARTS;
export const PROFILE_BUSINESS_TYPES = BUSINESS_TYPES;
/** §7.1.4 — below this the profile ranks lower in supplier search. */
export const COMPLETENESS_RANK_THRESHOLD = 70;

function has(profile, part) {
  if (part.list) return Array.isArray(profile[part.key]) && profile[part.key].length > 0;
  return Boolean(String(profile[part.key] ?? "").trim());
}

/** `{ percent, complete, parts: [{ key, label, weight, done }] }` */
export function completeness(profile) {
  const source = profile || {};
  const parts = PARTS.map((part) => ({ ...part, done: has(source, part) }));
  const percent = parts.reduce((total, part) => total + (part.done ? part.weight : 0), 0);
  return {
    percent,
    complete: percent >= COMPLETENESS_RANK_THRESHOLD,
    parts,
    missing: parts.filter((part) => !part.done).map((part) => part.label),
  };
}

/**
 * Search-rank multiplier for supplier / listing results (§7.1.4).
 * Under-complete profiles are demoted, complete ones get a small lift, and a
 * live verification badge adds on top (never enough to beat completeness).
 */
export function searchRank(profile, { verified = false } = {}) {
  const { percent } = completeness(profile);
  let factor = percent < COMPLETENESS_RANK_THRESHOLD ? 0.5 : 1;
  factor += Math.min(percent, 100) / 1000;
  if (verified) factor += 0.15;
  return factor;
}

/** Empty shape so pages can render a first-run profile safely. */
export function emptyProfile(email = "") {
  return {
    email: String(email || "").toLowerCase(),
    legalName: "",
    country: "",
    city: "",
    businessType: "",
    categories: [],
    yearEstablished: "",
    website: "",
    phone: "",
    phoneVerified: false,
    about: "",
    tradeVolume: "",
    currency: "USD",
    updatedAt: null,
  };
}

export async function getProfile(email) {
  const key = String(email || "").toLowerCase();
  if (!key) return emptyProfile();
  try {
    const doc = await db.collection(PROFILES).findOne({ email: key });
    if (!doc) return emptyProfile(key);
    const country = doc.country || "";
    return {
      ...emptyProfile(key),
      ...doc,
      email: key,
      categories: Array.isArray(doc.categories) ? doc.categories : [],
      // Currency always follows the stored country, never the stored value.
      currency: currencyForCountry(country),
    };
  } catch (error) {
    console.error("[profile] read failed", error.message);
    return emptyProfile(key);
  }
}

/** Bulk read for matching / directory pages. */
export async function getProfiles(emails = []) {
  const keys = [...new Set(emails.map((email) => String(email || "").toLowerCase()).filter(Boolean))];
  if (!keys.length) return new Map();
  try {
    const docs = await db.collection(PROFILES).find({ email: { $in: keys } }).toArray();
    return new Map(docs.map((doc) => [doc.email, { ...emptyProfile(doc.email), ...doc }]));
  } catch (error) {
    console.error("[profile] bulk read failed", error.message);
    return new Map();
  }
}

function validYear(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const year = Number(text);
  const current = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1800 || year > current) return "";
  return String(year);
}

/**
 * Persist company details. `input` comes from the onboarding or profile
 * form — country is validated against a list and the currency is derived.
 */
export async function saveProfile(email, input = {}) {
  const key = String(email || "").toLowerCase();
  if (!key) return { ok: false, error: "Not signed in." };

  const country = cleanText(input.country, 60);
  if (!country) return { ok: false, error: "Country is required." };

  const businessType = String(input.businessType ?? "").trim();
  if (businessType && !BUSINESS_TYPES.includes(businessType)) {
    return { ok: false, error: "Choose a valid business type." };
  }

  const categories = Array.isArray(input.categories)
    ? [...new Set(input.categories.map((value) => String(value).trim()).filter(Boolean))].slice(0, 5)
    : [];

  const doc = {
    email: key,
    legalName: cleanText(input.legalName, 120),
    country,
    city: cleanText(input.city, 80),
    businessType,
    categories,
    yearEstablished: validYear(input.yearEstablished),
    website: cleanText(input.website, 160),
    phone: cleanText(input.phone, 40),
    about: cleanText(input.about, 1200),
    tradeVolume: cleanText(input.tradeVolume, 40),
    // §7.1.3 — derived, never taken from the client.
    currency: currencyForCountry(country),
    updatedAt: new Date(),
  };

  try {
    await db.collection(PROFILES).updateOne(
      { email: key },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  } catch (error) {
    console.error("[profile] save failed", error.message);
    return { ok: false, error: "Could not save the company profile." };
  }

  return { ok: true, profile: doc, completeness: completeness(doc) };
}

export async function markPhoneVerified(email) {
  const key = String(email || "").toLowerCase();
  if (!key) return { ok: false, error: "Not signed in." };
  try {
    await db.collection(PROFILES).updateOne(
      { email: key },
      { $set: { phoneVerified: true, updatedAt: new Date() } },
      { upsert: true },
    );
    return { ok: true };
  } catch (error) {
    console.error("[profile] phone verify failed", error.message);
    return { ok: false, error: "Could not save the phone number." };
  }
}
