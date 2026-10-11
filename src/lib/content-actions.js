"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "./session";
import { recordAudit } from "./audit";
import { writeSiteContentSection, readSiteContent } from "./site-content";
import {
  createCategory,
  deleteCategory,
  reorderCategory,
  updateCategory,
} from "./categories-db";

/**
 * No-code admin panel server actions (spec "Project Refactoring & Security
 * Hardening", Part 2). Every action re-checks the caller's permission on the
 * server, writes an audit entry and revalidates the affected public pages.
 */

/* ------------------------------------------------------------------ *
 * Content editor
 * ------------------------------------------------------------------ */

export async function saveSiteContent(key, value) {
  const { user, role } = await requirePermission("admin.content");

  const all = await readSiteContent();
  const before = all[key] ?? null;
  const result = await writeSiteContentSection(key, value, user.email);
  if (!result.ok) return result;

  await recordAudit({
    action: "content.site.update",
    target: `content:${key}`,
    detail: { key, before, after: result.value },
    actor: user.email,
    actorRole: role,
  });

  revalidatePath("/");
  revalidatePath("/(public)");
  return { ok: true };
}

/* ------------------------------------------------------------------ *
 * Category CRUD + reorder
 * ------------------------------------------------------------------ */

async function auditCategory(action, slug, detail, user, role) {
  await recordAudit({
    action,
    target: `category:${slug}`,
    detail,
    actor: user.email,
    actorRole: role,
  });
}

function revalidateCategoryPages() {
  revalidatePath("/categories");
  revalidatePath("/");
  revalidatePath("/(public)");
}

export async function adminCreateCategory(input) {
  const { user, role } = await requirePermission("admin.content");
  const result = await createCategory(input);
  if (!result.ok) return result;

  await auditCategory("content.category.create", result.category.slug, { input }, user, role);
  revalidateCategoryPages();
  return { ok: true, category: result.category };
}

export async function adminUpdateCategory(slug, input) {
  const { user, role } = await requirePermission("admin.content");
  const result = await updateCategory(slug, input);
  if (!result.ok) return result;

  await auditCategory("content.category.update", slug, { input }, user, role);
  revalidateCategoryPages();
  return { ok: true, category: result.category };
}

export async function adminDeleteCategory(slug) {
  const { user, role } = await requirePermission("admin.content");
  const result = await deleteCategory(slug);
  if (!result.ok) return result;

  await auditCategory("content.category.delete", slug, {}, user, role);
  revalidateCategoryPages();
  return { ok: true };
}

export async function adminReorderCategory(slug, direction) {
  const { user, role } = await requirePermission("admin.content");
  const result = await reorderCategory(slug, direction);
  if (!result.ok) return result;

  await auditCategory("content.category.reorder", slug, { direction }, user, role);
  revalidateCategoryPages();
  return result;
}
