import { randomBytes } from "node:crypto";

/**
 * Small shared helpers for the workflow modules (spec §7):
 * human-readable reference codes, date maths used by the SLA rules
 * (12h moderation, 72h quote window, 30/7/1 day renewal reminders) and the
 * display formatters used across dashboard and admin tables.
 */

/** Short, sortable-enough public reference: `RQ-4F2K9C`. */
export function newRef(prefix) {
  const body = randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `${prefix}-${body}`;
}

export function now() {
  return new Date();
}

export function addHours(date, hours) {
  return new Date(new Date(date).getTime() + hours * 3_600_000);
}

export function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * 86_400_000);
}

export function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function addYears(date, years) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

export function isPast(date) {
  if (!date) return false;
  const value = new Date(date).getTime();
  return Number.isFinite(value) && value < Date.now();
}

/** `YYYY-MM-DD` in UTC — used for daily quotas and reminder keys. */
export function dayKey(date = new Date()) {
  const value = new Date(date);
  return value.toISOString().slice(0, 10);
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFmt.format(date);
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFmt.format(date);
}

/** "12 min ago" / "3 days ago" for inbox-style lists. */
export function timeAgo(value) {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

/** Trim + collapse whitespace, never returning more than `max` characters. */
export function cleanText(value, max = 2000) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max) : text;
}

export function cleanParagraph(value, max = 5000) {
  const text = String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.length > max ? text.slice(0, max) : text;
}

/**
 * Deep-copy a Mongo document into plain JSON-safe data for Client
 * Components: drops `_id` and turns ObjectId-like values into strings.
 * Dates and primitives are kept as-is (both are RSC-serializable).
 */
export function plain(value) {
  if (Array.isArray(value)) return value.map(plain);
  if (value instanceof Date) return value;
  if (value && typeof value === "object") {
    if (typeof value.toHexString === "function") return String(value);
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      if (key === "_id") continue;
      out[key] = plain(entry);
    }
    return out;
  }
  return value;
}
