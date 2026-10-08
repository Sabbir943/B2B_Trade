/**
 * Role & permission model — the single source of truth for access control.
 *
 * Seven platform roles (spec §4):
 *   1. Visitor                    → visitor
 *   2. Company Member (tiered)    → company_member   (tier: free | silver | gold | platinum)
 *   3. Brand Partner Applicant    → brand_partner
 *   4. Verification Partner       → verification_partner
 *   5. Staff: Verifier            → staff_verifier
 *   6. Staff: Support/Content/Sales → staff_support | staff_content | staff_sales
 *   7. Super Admin                → super_admin       (exactly one account at launch)
 *
 * Every check that matters is enforced on the server via `requirePermission()`
 * (src/lib/session.js) in layouts, pages and server actions. The client only
 * uses these helpers to hide links the user cannot use — never as the guard.
 * This file is intentionally free of server imports so it is safe to ship to
 * the browser bundle for nav filtering.
 */

export const ROLES = {
  VISITOR: "visitor",
  COMPANY_MEMBER: "company_member",
  BRAND_PARTNER: "brand_partner",
  VERIFICATION_PARTNER: "verification_partner",
  STAFF_VERIFIER: "staff_verifier",
  STAFF_SUPPORT: "staff_support",
  STAFF_CONTENT: "staff_content",
  STAFF_SALES: "staff_sales",
  SUPER_ADMIN: "super_admin",
};

export const ROLE_LABELS = {
  visitor: "Visitor",
  company_member: "Company Member",
  brand_partner: "Brand Partner Applicant",
  verification_partner: "Verification Partner",
  staff_verifier: "Staff — Verifier",
  staff_support: "Staff — Support",
  staff_content: "Staff — Content",
  staff_sales: "Staff — Sales",
  super_admin: "Super Admin",
};

export const TIER_LABELS = {
  free: "Free",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

export const STAFF_ROLES = [
  ROLES.STAFF_VERIFIER,
  ROLES.STAFF_SUPPORT,
  ROLES.STAFF_CONTENT,
  ROLES.STAFF_SALES,
];

export const WORKSPACE_ROLES = [
  ROLES.COMPANY_MEMBER,
  ROLES.BRAND_PARTNER,
  ROLES.VERIFICATION_PARTNER,
];

const MEMBER_PERMISSIONS = [
  "dashboard.home",
  "member.requirements",
  "member.inquiries",
  "member.leads",
  "member.products",
  "member.verification",
  "member.membership",
  "member.profile",
  "member.settings",
];

const GRANTS = {
  visitor: ["marketplace.browse"],

  company_member: [
    "marketplace.browse",
    ...MEMBER_PERMISSIONS,
    // buying mode: post requirements + send inquiries (unlimited on Free)
    // selling mode: list products, answer leads — within tier limits
  ],

  brand_partner: [
    "marketplace.browse",
    "dashboard.home",
    "member.profile",
    "member.settings",
    "market_entry.apply",
    "market_entry.track",
    "market_entry.message",
    // explicitly no marketplace admin data
  ],

  verification_partner: [
    "marketplace.browse",
    "dashboard.home",
    "member.profile",
    "member.settings",
    "verification.assigned.view",
    "verification.assigned.update",
    // explicitly nothing beyond tasks assigned to them
  ],

  // Staff: Verifier — Dhaka office. Verification queue only; no payments,
  // no Sourcing Desk, no platform settings, no role management.
  staff_verifier: ["admin.overview", "admin.verification_queue"],

  // Staff: Support — members, member inquiries, brand-partner applications.
  staff_support: [
    "admin.overview",
    "admin.members",
    "admin.inquiries",
    "admin.market_entry",
    "admin.reports",
  ],

  // Staff: Content — CMS/blog and listing moderation.
  staff_content: [
    "admin.overview",
    "admin.content",
    "admin.listings",
    "admin.reports",
  ],

  // Staff: Sales — leads, inquiries, invoices.
  staff_sales: [
    "admin.overview",
    "admin.leads",
    "admin.inquiries",
    "admin.payments",
    "admin.reports",
  ],

  // Super Admin — everything, including the Sourcing Desk private console,
  // revenue, pricing, tier settings and staff role assignment.
  super_admin: null,
};

/** Longest-prefix route → permission map. Used for server checks and nav filtering. */
export const PATH_PERMISSIONS = [
  ["/dashboard/market-entry", "market_entry.track"],
  ["/dashboard/tasks", "verification.assigned.view"],
  ["/dashboard/requirements", "member.requirements"],
  ["/dashboard/inquiries", "member.inquiries"],
  ["/dashboard/leads", "member.leads"],
  ["/dashboard/products", "member.products"],
  ["/dashboard/verification", "member.verification"],
  ["/dashboard/membership", "member.membership"],
  ["/dashboard/profile", "member.profile"],
  ["/dashboard/settings", "member.settings"],
  ["/dashboard", "dashboard.home"],
  ["/admin/verification-queue", "admin.verification_queue"],
  ["/admin/market-entry", "admin.market_entry"],
  ["/admin/members", "admin.members"],
  ["/admin/listings", "admin.listings"],
  ["/admin/leads", "admin.leads"],
  ["/admin/inquiries", "admin.inquiries"],
  ["/admin/payments", "admin.payments"],
  ["/admin/content", "admin.content"],
  ["/admin/reports", "admin.reports"],
  ["/admin/roles", "admin.roles"],
  ["/admin", "admin.overview"],
  ["/console/sourcing-desk", "console.sourcing_desk"],
  ["/console/revenue", "console.revenue"],
  ["/console/pricing", "console.pricing"],
  ["/console/audit-log", "console.audit_log"],
  ["/console", "console.overview"],
];

export function can(role, permission) {
  if (role === ROLES.SUPER_ADMIN) return true;
  const grants = GRANTS[role];
  if (!grants) return false;
  return grants.includes(permission);
}

export function isStaff(role) {
  return STAFF_ROLES.includes(role) || role === ROLES.SUPER_ADMIN;
}

export function roleLabel(role) {
  return ROLE_LABELS[role] ?? ROLE_LABELS.company_member;
}

/** Where a denied/unauthenticated user is sent instead. */
export function homeFor(role) {
  if (role === ROLES.SUPER_ADMIN) return "/console";
  if (STAFF_ROLES.includes(role)) return "/admin";
  if (WORKSPACE_ROLES.includes(role)) return "/dashboard";
  return "/";
}

export function permissionForPath(pathname) {
  for (const [prefix, permission] of PATH_PERMISSIONS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return permission;
    }
  }
  return null;
}

export function canAccessPath(role, pathname) {
  const permission = permissionForPath(pathname);
  if (!permission) return true;
  return can(role, permission);
}

export function allowedPaths(role) {
  return PATH_PERMISSIONS.filter(([, permission]) => can(role, permission)).map(
    ([prefix]) => prefix,
  );
}

/** Human-readable matrix shown on /admin/roles — mirrors the GRANTS above. */
export const ROLE_MATRIX = [
  [
    "Visitor",
    "Browse products, suppliers, buy requirements and content pages. No contact details, no inquiries.",
  ],
  [
    "Company Member (Free / Silver / Gold / Platinum)",
    "One account with Buying and Selling modes. Buying: post requirements, send inquiries (unlimited, free). Selling: list products, answer leads — within tier limits. No Sourcing Desk data.",
  ],
  [
    "Brand Partner Applicant",
    "Submit and track a Bangladesh market-entry application, message the assigned staff member. No marketplace admin data.",
  ],
  [
    "Verification Partner",
    "See and update only the verification tasks assigned to them. Nothing else.",
  ],
  [
    "Staff — Verifier",
    "Verification queue, visit reports, badge awards. No payments, no Sourcing Desk, no platform settings.",
  ],
  [
    "Staff — Support / Content / Sales",
    "Sub-roles: Members & inquiries & market-entry applications (Support) · CMS and listing moderation (Content) · Leads & invoices (Sales). No Sourcing Desk private console, no platform settings.",
  ],
  [
    "Super Admin",
    "Everything: Sourcing Desk private console, revenue, pricing and tier settings, staff roles, audit log. Exactly one account at launch.",
  ],
];
