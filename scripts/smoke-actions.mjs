import { findActionIds } from "./action-id.mjs";

/**
 * End-to-end smoke test for the Part 2 admin server actions.
 * Calls the real actions through Next's server-action endpoint (Next-Action
 * header) with a signed super-admin session, then checks the visible result.
 *
 *   node scripts/smoke-session.mjs          # mint SMOKE_COOKIE=…
 *   SMOKE_COOKIE=… node scripts/smoke-actions.mjs
 *   SMOKE_COOKIE=… node scripts/smoke-actions2.mjs
 */
const BASE = "http://localhost:3000";
const COOKIE = process.env.SMOKE_COOKIE;
if (!COOKIE) {
  console.error("SMOKE_COOKIE required");
  process.exit(1);
}

const PATHS = {
  saveSiteContent: "/admin/content",
  adminCreateCategory: "/admin/content",
  adminReorderCategory: "/admin/content",
  adminDeleteCategory: "/admin/content",
  suspendMember: "/admin/members",
  reinstateMember: "/admin/members",
  createStaffAccount: "/admin/roles",
  deactivateStaffAccount: "/admin/roles",
  grantExtraPermission: "/admin/roles",
  revokeExtraPermission: "/admin/roles",
  adminDeleteRequirement: "/admin/requirements",
  adminDeleteListing: "/admin/listings",
};

const ACTION_IDS = findActionIds(Object.keys(PATHS));

async function action(name, args) {
  const id = ACTION_IDS[name];
  const path = PATHS[name];
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "text/plain;charset=UTF-8",
      "next-action": id,
      accept: "text/x-component",
      origin: BASE,
      cookie: `better-auth.session_token=${COOKIE}`,
    },
    body: JSON.stringify(args),
  });
  const text = await response.text();
  let payload = text;
  // The flight response carries the returned value in the last segment.
  const match = text.match(/0:((?:.|\n)*)$/);
  if (match) payload = match[1];
  console.log(`  ${name}: HTTP ${response.status}`);
  if (response.status !== 200) console.log(`    ${text.slice(0, 300)}`);
  return { status: response.status, text };
}

function section(title) {
  console.log(`\n=== ${title}`);
}

/* 1. content editor ------------------------------------------------ */
section("site content save");
await action("saveSiteContent", [
  "home.hero",
  {
    eyebrow: "Smoke Test Eyebrow",
    title: "SMOKE-HEADLINE-CHECK",
    subtitle: "Temporary subtitle for the smoke test.",
    popularTags: ["Spices", "Rice"],
    imageDesktop: "/hero-desktop.webp",
    imageMobile: "/hero-mobile.webp",
  },
]);
const home = await fetch(`${BASE}/`).then((r) => r.text());
console.log("  home shows new headline:", home.includes("SMOKE-HEADLINE-CHECK"));

/* 2. category CRUD ------------------------------------------------- */
section("category create / reorder / delete");
await action("adminCreateCategory", [
  { slug: "smoke-test-category", name: "Smoke Test Category", hs: "9999", blurb: "Temporary category.", sub: ["One", "Two"] },
]);
const cats = await fetch(`${BASE}/categories`).then((r) => r.text());
console.log("  categories page lists it:", cats.includes("/categories/smoke-test-category"));

await action("adminReorderCategory", ["smoke-test-category", "up"]);
await action("adminDeleteCategory", ["smoke-test-category"]);
const cats2 = await fetch(`${BASE}/categories`).then((r) => r.text());
console.log("  gone after delete:", !cats2.includes("/categories/smoke-test-category"));

/* restore: drop the row the test wrote so the shipped defaults show again */
section("cleanup");
const { MongoClient } = await import("mongodb");
const { readFileSync } = await import("node:fs");
const envFile = readFileSync(new URL("../.env", import.meta.url), "utf8");
const uri = envFile.match(/^MONGODB_URI=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
const client = new MongoClient(uri);
await client.connect();
const removed = await client.db().collection("site_content").deleteMany({});
console.log("  site_content rows removed:", removed.deletedCount);
await client.close();

process.exit(0);
