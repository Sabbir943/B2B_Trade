"use client";

import { useRef, useState } from "react";
import { saveSiteContent } from "@/lib/content-actions";

/**
 * No-code site content editor: text fields + drag-and-drop image upload.
 * Images go to /api/upload (staff-only) and are stored outside public/,
 * served back through /api/files/<id>.
 */

function ImageField({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function upload(file) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Upload failed.");
      }
      onChange(data.url);
    } catch (cause) {
      setError(cause.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    upload(event.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</span>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex items-center gap-3 rounded-lg border-2 border-dashed p-3 transition ${
          dragging ? "border-primary bg-primary/5" : "border-slate-300"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-12 w-20 rounded-md border border-slate-200 object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="/hero-desktop.webp or /api/files/…"
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-[13px] outline-none focus:border-primary"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            {busy ? "Uploading…" : "Drop an image here, or"}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-[12px] font-bold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {busy ? "…" : "Choose"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => upload(event.target.files?.[0])}
        />
      </div>
      {error ? <p className="mt-1 text-[12px] text-red-600">{error}</p> : null}
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  if (field.kind === "image") {
    return <ImageField label={field.label} value={value || ""} onChange={onChange} />;
  }
  if (field.kind === "textarea" || field.kind === "lines" || field.kind === "tags") {
    const text =
      field.kind === "lines" || field.kind === "tags"
        ? (Array.isArray(value) ? value : []).join("\n")
        : String(value ?? "");
    return (
      <div>
        <span className="mb-1.5 block text-[13px] font-semibold text-ink">{field.label}</span>
        <textarea
          rows={field.kind === "textarea" ? 3 : 4}
          value={text}
          onChange={(event) =>
            onChange(
              field.kind === "textarea"
                ? event.target.value
                : event.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
            )
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {field.kind !== "textarea" ? (
          <p className="mt-1 text-[11px] text-slate-500">One item per line.</p>
        ) : null}
      </div>
    );
  }
  if (field.kind === "toggle") {
    return (
      <label className="flex items-center gap-2.5 text-[13px] font-semibold text-ink">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        {field.label}
      </label>
    );
  }
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">{field.label}</span>
      <input
        type="text"
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}

export default function SiteContentEditor({ sections }) {
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(
      sections.map((section) => [section.key, structuredClone(section.value)]),
    ),
  );
  const [busyKey, setBusyKey] = useState(null);
  const [message, setMessage] = useState(null);

  function setField(key, name, value) {
    setDrafts((current) => ({
      ...current,
      [key]: { ...current[key], [name]: value },
    }));
  }

  async function save(key) {
    setBusyKey(key);
    setMessage(null);
    try {
      const result = await saveSiteContent(key, drafts[key]);
      setMessage(
        result.ok
          ? { tone: "ok", text: "Saved. The public pages are already updated." }
          : { tone: "err", text: result.error || "Could not save." },
      );
    } catch {
      setMessage({ tone: "err", text: "Could not save." });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.key} className="panel p-5">
          <p className="label-xs">{section.label}</p>
          <p className="mt-1 text-[13px] leading-6 text-slate-600">{section.hint}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div
                key={field.name}
                className={field.kind === "textarea" || field.kind === "lines" ? "sm:col-span-2" : ""}
              >
                <FieldInput
                  field={field}
                  value={drafts[section.key]?.[field.name]}
                  onChange={(value) => setField(section.key, field.name, value)}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              disabled={busyKey === section.key}
              onClick={() => save(section.key)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {busyKey === section.key ? "Saving…" : "Save section"}
            </button>
            {message && busyKey === null ? (
              <span
                className={`text-[13px] font-semibold ${
                  message.tone === "ok" ? "text-success" : "text-red-600"
                }`}
              >
                {message.text}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
