import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";
import {
  DEFAULT_PRICING,
  PAID_TIERS,
  SETTINGS_KEY,
  normalizePricingSettings,
} from "./pricing";

/**
 * Storage layer for membership pricing settings (spec §9).
 *
 * `settings.key = "pricing"` holds the Super Admin's live copy. Reads used by
 * pages are cached and tagged `pricing`, so a console save (updateTag) is the
 * only thing needed to refresh every public price, limit and counter.
 */

const SETTINGS = "settings";
const USERS = "user";

/** Uncached read — used by the save action to record before/after values. */
export async function readPricingSettings() {
  try {
    const doc = await db.collection(SETTINGS).findOne({ key: SETTINGS_KEY });
    return normalizePricingSettings(doc?.value);
  } catch (error) {
    console.error("[pricing] failed to read settings", error.message);
    return normalizePricingSettings(DEFAULT_PRICING);
  }
}

export async function writePricingSettings(settings, actor) {
  const now = new Date();
  await db.collection(SETTINGS).updateOne(
    { key: SETTINGS_KEY },
    { $set: { value: settings, updatedAt: now, updatedBy: actor } },
    { upsert: true },
  );
  return settings;
}

/** Live settings for every server component (cached, tag: pricing). */
export async function getPricingSettings() {
  "use cache";
  cacheTag("pricing");
  cacheLife("hours");
  return readPricingSettings();
}

/**
 * Founding-offer counter: real paid sign-ups, not a seeded number.
 * A founding spot is claimed by a non-trial account on a paid tier — free
 * trials never consume one of the 200 spots.
 */
export async function getFoundingSpots() {
  "use cache";
  cacheTag("pricing");
  cacheLife("minutes");

  const settings = await getPricingSettings();
  let taken = 0;
  try {
    taken = await db.collection(USERS).countDocuments({
      tier: { $in: PAID_TIERS },
      trialGranted: { $ne: true },
    });
  } catch (error) {
    console.error("[pricing] founding spot count failed", error.message);
  }

  const total = settings.founding.totalSpots;
  return {
    enabled: settings.founding.enabled,
    total,
    taken,
    left: Math.max(0, total - taken),
    soldOut: settings.founding.enabled && taken >= total,
    percentUsed: total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0,
  };
}

/** Per-member membership facts (tier + active trial) for the dashboard. */
export async function getMemberMembership(email) {
  "use cache";
  cacheTag("pricing");
  cacheLife("minutes");

  if (!email) return null;
  try {
    const user = await db
      .collection(USERS)
      .findOne({ email: String(email).toLowerCase() }, { projection: { tier: 1, trialUntil: 1, trialGranted: 1 } });
    if (!user) return null;

    const trialUntil = user.trialUntil ? new Date(user.trialUntil) : null;
    return {
      tier: user.tier || "free",
      trialGranted: Boolean(user.trialGranted),
      trialUntil: trialUntil && !Number.isNaN(trialUntil.getTime()) ? trialUntil.toISOString() : null,
      trialActive: Boolean(trialUntil && trialUntil.getTime() > Date.now()),
    };
  } catch (error) {
    console.error("[pricing] member membership read failed", error.message);
    return null;
  }
}

/** ISO timestamp `months` from now — used by the Silver trial grant. */
export function trialExpiry(months, from = new Date()) {
  const until = new Date(from);
  until.setMonth(until.getMonth() + months);
  return until;
}
