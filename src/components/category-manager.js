"use client";

import { useState } from "react";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminReorderCategory,
  adminUpdateCategory,
} from "@/lib/content-actions";
import ConfirmDialog from "./confirm-dialog";

/**
 * No-code category manager: add, edit, reorder (up/down) and delete
 * categories. Delete asks for confirmation in a modal; every action runs a
 * staff-only server action that writes the audit log.
 */

const EMPTY = { slug: "", name: "", hs: "", blurb: "", sub: "" };

function toDraft(category) {
  return {
    slug: category.slug || "",
    name: category.name || "",
    hs: category.hs || "",
    blurb: category.blurb || "",
    sub: (category.sub || []).join("\n"),
  };
}

export default function CategoryManager({ categories }) {
  const [rows, setRows] = useState(categories);
  const [editing, setEditing] = useState(null); // slug being edited | "new"
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  function payload() {
    return {
      ...draft,
      slug: draft.slug.trim(),
      sub: draft.sub
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };
  }

  async function execute(action) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error || "Action failed.");
        return null;
      }
      return result;
    } catch {
      setError("Action failed.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function saveNew() {
    const body = payload();
    const result = await execute(() => adminCreateCategory(body));
    if (result?.ok) {
      setNotice(`“${body.name}” created.`);
      setEditing(null);
      setDraft(EMPTY);
      setRows((current) =>
        [...current, { ...result.category, order: current.length }].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        ),
      );
    }
  }

  async function saveEdit(originalSlug) {
    const body = payload();
    const result = await execute(() => adminUpdateCategory(originalSlug, body));
    if (result?.ok) {
      setNotice(`“${body.name}” updated.`);
      setEditing(null);
      setRows((current) =>
        current.map((row) =>
          row.slug === originalSlug ? { ...row, ...result.category } : row,
        ),
      );
    }
  }

  async function move(slug, direction) {
    const result = await execute(() => adminReorderCategory(slug, direction));
    if (result?.ok && result.changed) {
      setRows((current) => {
        const index = current.findIndex((row) => row.slug === slug);
        const swapWith = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || swapWith < 0 || swapWith >= current.length) return current;
        const next = [...current];
        [next[index], next[swapWith]] = [next[swapWith], next[index]];
        return next;
      });
    }
  }

  async function confirmDelete() {
    const slug = pendingDelete;
    const result = await execute(() => adminDeleteCategory(slug));
    setPendingDelete(null);
    if (result?.ok) {
      setNotice(`Category “${slug}” deleted.`);
      setRows((current) => current.filter((row) => row.slug !== slug));
    }
  }

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-xs">Categories</p>
          <p className="mt-1 text-[13px] leading-6 text-slate-600">
            Add, edit, reorder or remove the categories buyers browse. Changes
            appear on the public catalogue immediately.
          </p>
        </div>
        <button
          type="button"
          disabled={busy || editing !== null}
          onClick={() => {
            setDraft(EMPTY);
            setEditing("new");
            setError(null);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          Add category
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}
      {notice ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <ul className="mt-4 divide-y divide-slate-100">
        {rows.map((category, index) => (
          <li key={category.slug} className="py-3">
            {editing === category.slug ? (
              <CategoryForm
                draft={draft}
                setDraft={setDraft}
                busy={busy}
                onCancel={() => setEditing(null)}
                onSave={() => saveEdit(category.slug)}
                saveLabel="Save changes"
              />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-ink">{category.name}</span>
                  <span className="text-[12px] text-slate-500">
                    {category.slug} · HS {category.hs || "—"} ·{" "}
                    {(category.sub || []).length} subcategories
                  </span>
                </span>
                <span className="ml-auto flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => move(category.slug, "up")}
                    aria-label={`Move ${category.name} up`}
                    className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-bold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-40"
                  >
                    ↑ Up
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === rows.length - 1}
                    onClick={() => move(category.slug, "down")}
                    aria-label={`Move ${category.name} down`}
                    className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-bold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-40"
                  >
                    ↓ Down
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setDraft(toDraft(category));
                      setEditing(category.slug);
                      setError(null);
                    }}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPendingDelete(category.slug)}
                    className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      {editing === "new" ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <CategoryForm
            draft={draft}
            setDraft={setDraft}
            busy={busy}
            onCancel={() => setEditing(null)}
            onSave={saveNew}
            saveLabel="Create category"
          />
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this category?"
        body={`“${pendingDelete}” will be removed from the public catalogue. Products tagged with it will keep their own data but stop appearing under this category.`}
        confirmLabel="Delete category"
        busy={busy}
        error={error}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function CategoryForm({ draft, setDraft, busy, onCancel, onSave, saveLabel }) {
  const set = (name) => (event) =>
    setDraft((current) => ({ ...current, [name]: event.target.value }));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-[12px] font-bold text-ink">Name</span>
        <input
          type="text"
          value={draft.name}
          onChange={set("name")}
          placeholder="Spices & Seasonings"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-bold text-ink">
          Slug (URL id)
        </span>
        <input
          type="text"
          value={draft.slug}
          onChange={set("slug")}
          placeholder="spices"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-bold text-ink">HS chapter</span>
        <input
          type="text"
          value={draft.hs}
          onChange={set("hs")}
          placeholder="0910"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-[12px] font-bold text-ink">Blurb</span>
        <input
          type="text"
          value={draft.blurb}
          onChange={set("blurb")}
          placeholder="Short description shown on the category card."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-[12px] font-bold text-ink">
          Subcategories (one per line)
        </span>
        <textarea
          rows={3}
          value={draft.sub}
          onChange={set("sub")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="button"
          disabled={busy || !draft.name.trim() || !draft.slug.trim()}
          onClick={onSave}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? "Saving…" : saveLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
