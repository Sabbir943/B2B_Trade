"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "./brand-logo";
import { Avatar } from "./ui";
import {
  canAccessPath,
  ROLES,
  roleLabel,
  TIER_LABELS,
} from "../lib/permissions";
import {
  AlertIcon,
  BoxIcon,
  ChartIcon,
  ClipboardIcon,
  CreditCardIcon,
  FileTextIcon,
  GlobeIcon,
  InboxIcon,
  LayersIcon,
  LifeBuoyIcon,
  MenuIcon,
  CloseIcon,
  SettingsIcon,
  ShieldIcon,
  TagIcon,
  UsersIcon,
  XIcon,
} from "./icons";

const NAV = {
  member: [
    {
      group: "Workspace",
      items: [
        { label: "Overview", href: "/dashboard", icon: ChartIcon },
        { label: "Market entry", href: "/dashboard/market-entry", icon: GlobeIcon },
        { label: "Verification tasks", href: "/dashboard/tasks", icon: ShieldIcon },
      ],
    },
    {
      group: "Buying",
      mode: "buying",
      items: [
        { label: "My requirements", href: "/dashboard/requirements", icon: ClipboardIcon },
        { label: "Inquiries", href: "/dashboard/inquiries", icon: InboxIcon },
        { label: "Matched leads", href: "/dashboard/leads", icon: TagIcon },
      ],
    },
    {
      group: "Selling",
      mode: "selling",
      items: [
        { label: "Products", href: "/dashboard/products", icon: BoxIcon },
        { label: "Verification", href: "/dashboard/verification", icon: ShieldIcon },
        { label: "Membership", href: "/dashboard/membership", icon: CreditCardIcon },
      ],
    },
    {
      group: "Account",
      items: [
        { label: "Company profile", href: "/dashboard/profile", icon: UsersIcon },
        { label: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
      ],
    },
  ],
  admin: [
    {
      group: "Operations",
      items: [
        { label: "Overview", href: "/admin", icon: ChartIcon },
        { label: "Members", href: "/admin/members", icon: UsersIcon },
        { label: "Verification queue", href: "/admin/verification-queue", icon: ShieldIcon },
        { label: "Listings", href: "/admin/listings", icon: BoxIcon },
      ],
    },
    {
      group: "Trade",
      items: [
        { label: "Leads", href: "/admin/leads", icon: TagIcon },
        { label: "Inquiries", href: "/admin/inquiries", icon: InboxIcon },
        { label: "Payments", href: "/admin/payments", icon: CreditCardIcon },
        { label: "Market Entry", href: "/admin/market-entry", icon: GlobeIcon },
      ],
    },
    {
      group: "Platform",
      items: [
        { label: "Content", href: "/admin/content", icon: FileTextIcon },
        { label: "Reports", href: "/admin/reports", icon: LayersIcon },
        { label: "Roles", href: "/admin/roles", icon: AlertIcon },
      ],
    },
  ],
  console: [
    {
      group: "Super-Admin",
      items: [
        { label: "Overview", href: "/console", icon: ChartIcon },
        { label: "Sourcing Desk", href: "/console/sourcing-desk", icon: LifeBuoyIcon },
        { label: "Revenue", href: "/console/revenue", icon: CreditCardIcon },
        { label: "Pricing & offers", href: "/console/pricing", icon: TagIcon },
        { label: "Audit log", href: "/console/audit-log", icon: FileTextIcon },
      ],
    },
  ],
};

function isActive(pathname, href) {
  if (href === "/dashboard" || href === "/admin" || href === "/console") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({
  variant = "member",
  role = ROLES.COMPANY_MEMBER,
  tier = "free",
  user,
  notice,
  children,
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("selling");

  // Cosmetic only: the server re-checks every route (see src/lib/session.js).
  const groups = NAV[variant]
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessPath(role, item.href)),
    }))
    .filter((group) => group.items.length > 0);

  const showModeSwitch = variant === "member" && role === ROLES.COMPANY_MEMBER;
  const roleLine =
    role === ROLES.COMPANY_MEMBER
      ? `${roleLabel(role)} · ${TIER_LABELS[tier] ?? "Free"}`
      : roleLabel(role);

  const nav = (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {showModeSwitch ? (
        <div className="flex rounded-lg bg-surface p-1">
          {[
            ["buying", "Buying"],
            ["selling", "Selling"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-[12px] font-bold transition ${
                mode === key
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {groups.map((group) => {
        if (group.mode && group.mode !== mode) return null;
        return (
          <div key={group.group}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {group.group}
            </p>
            <ul className="mt-2 space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-primary text-white"
                          : "text-slate-600 hover:bg-surface hover:text-primary"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${active ? "text-white/80" : "text-secondary"}`}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {open ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </button>

          <BrandLogo className="shrink-0" />

          <span className="hidden h-5 w-px bg-slate-200 sm:block" />
          <p className="hidden text-[13px] font-semibold text-slate-500 sm:block">
            {variant === "member"
              ? "Member dashboard"
              : variant === "admin"
                ? "Staff admin"
                : "Super-Admin console"}
          </p>

          <div className="ml-auto flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/8 text-primary">
              <LifeBuoyIcon className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-2">
              <Avatar name={user?.name ?? "Guest User"} className="h-8 w-8" />
              <div className="hidden leading-tight sm:block">
                <p className="text-[13px] font-bold text-ink">{user?.name ?? "Guest"}</p>
                <p className="text-[11px] text-slate-500">{roleLine}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          {nav}
          <div className="border-t border-slate-100 p-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition hover:bg-surface hover:text-primary"
            >
              <XIcon className="h-3.5 w-3.5" />
              Back to marketplace
            </Link>
          </div>
        </aside>

        {open ? (
          <div className="fixed inset-0 top-14 z-30 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink/40"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
              {nav}
              <div className="border-t border-slate-100 p-3">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition hover:bg-surface hover:text-primary"
                >
                  <XIcon className="h-3.5 w-3.5" />
                  Back to marketplace
                </Link>
              </div>
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {notice ? (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[13px] leading-6 text-amber-800">{notice}</p>
            </div>
          ) : null}
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
