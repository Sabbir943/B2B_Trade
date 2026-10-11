import { cacheTag, revalidateTag } from "next/cache";
import { db } from "./db";
import { categories as seedCategories } from "./catalog";
import { cleanText } from "./refs";

/**
 * No-code category manager (spec "Content editor → categories").
 *
 * The static list in catalog.js stays as the seed/fallback so client
 * components and builds never break; staff edits live in the `categories`
 * collection and public server pages read through `listCategories()`.
 */

const COLLECTION = "categories";

function normalizeCategory(input, order = 0) {
  const slug = cleanText(String(input?.slug ?? ""), 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const sub = Array.isArray(input?.sub) ? input.sub : [];
  return {
    slug,
    name: cleanText(String(input?.name ?? ""), 120) || slug,
    hs: cleanText(String(input?.hs ?? ""), 16),
    blurb: cleanText(String(input?.blurb ?? ""), 240),
    sub: sub.map((item) => cleanText(String(item ?? ""), 80)).filter(Boolean).slice(0, 20),
    order,
  };
}

async function readDbCategories() {
  try {
    const rows = await db.collection(COLLECTION).find({}).sort({ order: 1 }).toArray();
    return rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      hs: row.hs,
      blurb: row.blurb,
      sub: row.sub || [],
      order: row.order ?? 0,
    }));
  } catch (error) {
    console.error("[categories] read failed", error.message);
    return [];
  }
}

/**
 * Public read: DB rows when staff have saved any, otherwise the seed list.
 * Cached + tagged so the content save refreshes every catalogue page.
 */
export async function listCategories() {
  "use cache";
  cacheTag("categories");

  const rows = await readDbCategories();
  return rows.length ? rows : seedCategories.map((item, index) => ({ ...item, order: index }));
}

/** Same shape as the static map, for lookups by slug. */
export async function listCategoriesById() {
  const list = await listCategories();
  return Object.fromEntries(list.map((item) => [item.slug, item]));
}

/* ------------------------------------------------------------------ *
 * Staff mutations — each revalidates the cached public list.
 * ------------------------------------------------------------------ */

export async function createCategory(input) {
  const category = normalizeCategory(input, Date.now());
  if (!category.slug) return { ok: false, error: "A slug is required." };

  const existing = await db.collection(COLLECTION).findOne({ slug: category.slug });
  if (existing) return { ok: false, error: `Category “${category.slug}” already exists.` };

  try {
    // First DB write: persist the seed so later edits have a base list.
    const count = await db.collection(COLLECTION).countDocuments();
    if (count === 0) {
      const seed = seedCategories.map((item, index) => ({
        ...normalizeCategory(item, index),
        seeded: true,
      }));
      if (!seed.some((item) => item.slug === category.slug)) seed.push(category);
      else seed.forEach((item, i) => { if (item.slug === category.slug) seed[i] = category; });
      await db.collection(COLLECTION).insertMany(seed);
    } else {
      await db.collection(COLLECTION).insertOne({ ...category, createdAt: new Date() });
    }
    revalidateTag("categories");
    return { ok: true, category };
  } catch (error) {
    console.error("[categories] create failed", error.message);
    return { ok: false, error: "Could not create the category." };
  }
}

export async function updateCategory(slug, input) {
  const current = await db.collection(COLLECTION).findOne({ slug });
  if (!current) return { ok: false, error: "Category not found." };

  const next = normalizeCategory({ ...current, ...input, slug: current.slug }, current.order ?? 0);
  try {
    await db.collection(COLLECTION).updateOne({ slug: current.slug }, { $set: { ...next, updatedAt: new Date() } });
    revalidateTag("categories");
    return { ok: true, category: next };
  } catch (error) {
    console.error("[categories] update failed", error.message);
    return { ok: false, error: "Could not update the category." };
  }
}

export async function deleteCategory(slug) {
  const current = await db.collection(COLLECTION).findOne({ slug });
  if (!current) return { ok: false, error: "Category not found." };

  try {
    await db.collection(COLLECTION).deleteOne({ slug });
    revalidateTag("categories");
    return { ok: true };
  } catch (error) {
    console.error("[categories] delete failed", error.message);
    return { ok: false, error: "Could not delete the category." };
  }
}

/** Move a category up or down in the public ordering. */
export async function reorderCategory(slug, direction) {
  const rows = await readDbCategories();
  const index = rows.findIndex((row) => row.slug === slug);
  if (index < 0) return { ok: false, error: "Category not found." };

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= rows.length) return { ok: true, changed: false };

  const a = rows[index];
  const b = rows[swapWith];
  try {
    const col = db.collection(COLLECTION);
    // Ensure both rows exist (first reorder may act on seed-only data).
    const count = await col.countDocuments();
    if (count === 0) {
      const seed = rows.map((item, i) => ({ ...normalizeCategory(item, i), seeded: true }));
      await col.insertMany(seed);
    }
    await col.updateOne({ slug: a.slug }, { $set: { order: swapWith, updatedAt: new Date() } });
    await col.updateOne({ slug: b.slug }, { $set: { order: index, updatedAt: new Date() } });
    revalidateTag("categories");
    return { ok: true, changed: true };
  } catch (error) {
    console.error("[categories] reorder failed", error.message);
    return { ok: false, error: "Could not reorder the category." };
  }
}
