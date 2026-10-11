import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { db } from "./db";
import { cleanText } from "./refs";

/**
 * Editable site content (no-code panel, spec "Content editor").
 *
 * One document per key in the `site_content` collection. Public pages read
 * through the cached getter (tag `site-content`); every admin save calls
 * `revalidateTag` so home/footer copy updates without a redeploy.
 */

const COLLECTION = "site_content";

export const SITE_CONTENT_DEFAULTS = {
  "home.hero": {
    eyebrow: "Global B2B Trade Marketplace",
    title: "Find suppliers. Reach buyers. Trade worldwide.",
    subtitle:
      "Connect with importers, exporters and manufacturers across the globe — with sourcing support from search to shipment.",
    popularTags: ["Spices", "Industrial Chemicals", "Jute Products", "Rice", "Garment Accessories"],
    imageDesktop: "/hero-desktop.webp",
    imageMobile: "/hero-mobile.webp",
  },
  "home.stats": {
    enabled: true,
    lines: [
      "260+ suppliers in our sourcing network",
      "Supplier network across 25 countries",
      "14+ years of leadership experience in international trade",
    ],
  },
  "site.footer": {
    blurb:
      "An international B2B import and export marketplace — connecting buyers and suppliers across sourcing, verification, documentation and logistics.",
  },
};

export const SITE_CONTENT_SECTIONS = [
  {
    key: "home.hero",
    label: "Homepage hero",
    hint: "Main headline block on the homepage, including the popular-search chips.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", kind: "text" },
      { name: "title", label: "Headline", kind: "text" },
      { name: "subtitle", label: "Sub-headline", kind: "textarea" },
      { name: "popularTags", label: "Popular search chips (comma separated)", kind: "tags" },
      { name: "imageDesktop", label: "Desktop background image", kind: "image" },
      { name: "imageMobile", label: "Mobile background image", kind: "image" },
    ],
  },
  {
    key: "home.stats",
    label: "Trust stats strip",
    hint: "The three proof points under the hero.",
    fields: [
      { name: "enabled", label: "Show the strip", kind: "toggle" },
      { name: "lines", label: "Lines (one per row)", kind: "lines" },
    ],
  },
  {
    key: "site.footer",
    label: "Footer",
    hint: "Short description shown in the site footer.",
    fields: [{ name: "blurb", label: "Footer blurb", kind: "textarea" }],
  },
];

/** Uncached read used by the editor and the save action. */
export async function readSiteContent() {
  const merged = structuredClone(SITE_CONTENT_DEFAULTS);
  try {
    const rows = await db.collection(COLLECTION).find({}).toArray();
    for (const row of rows) {
      if (merged[row.key]) merged[row.key] = { ...merged[row.key], ...(row.value || {}) };
    }
  } catch (error) {
    console.error("[site-content] read failed", error.message);
  }
  return merged;
}

/** Cached read for public pages — refreshed by revalidateTag("site-content"). */
export async function getSiteContentSection(key) {
  "use cache";
  cacheTag("site-content");
  cacheLife("minutes");

  const fallback = SITE_CONTENT_DEFAULTS[key] || {};
  try {
    const row = await db.collection(COLLECTION).findOne({ key });
    return row?.value ? { ...fallback, ...row.value } : fallback;
  } catch (error) {
    console.error("[site-content] read failed", error.message);
    return fallback;
  }
}

function normalizeValue(key, value) {
  const fallback = SITE_CONTENT_DEFAULTS[key] || {};
  const out = { ...fallback };

  for (const [field, def] of Object.entries(fallback)) {
    const raw = value?.[field];
    if (typeof def === "boolean") {
      out[field] = Boolean(raw);
    } else if (Array.isArray(def)) {
      const list = Array.isArray(raw) ? raw : [];
      out[field] = list.map((item) => cleanText(String(item ?? ""), 120)).filter(Boolean).slice(0, 12);
    } else {
      out[field] = cleanText(String(raw ?? ""), 600) || def;
    }
  }
  return out;
}

/** Save one section; called from the staff-only server action. */
export async function writeSiteContentSection(key, value, actor) {
  if (!(key in SITE_CONTENT_DEFAULTS)) {
    return { ok: false, error: "Unknown content section." };
  }
  const normalized = normalizeValue(key, value);
  const now = new Date();
  try {
    await db.collection(COLLECTION).updateOne(
      { key },
      { $set: { key, value: normalized, updatedAt: now, updatedBy: actor } },
      { upsert: true },
    );
    revalidateTag("site-content");
    return { ok: true, value: normalized };
  } catch (error) {
    console.error("[site-content] write failed", error.message);
    return { ok: false, error: "Could not save the content." };
  }
}
