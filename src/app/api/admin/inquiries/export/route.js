import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { getSessionContext } from "@/lib/session";
import { staff2faFreshInDb } from "@/lib/staff-2fa";
import { recordAudit } from "@/lib/audit";
import { toCsv, toXlsx } from "@/lib/export";

/**
 * §7.4.4 export — downloads the inquiry data as CSV or Excel.
 *
 * GET /api/admin/inquiries/export?format=csv|xlsx&kind=inquiries|reports
 *
 * Route handlers cannot redirect nicely, so the guard answers with JSON
 * status codes; a stale staff session is asked to sign in again.
 */

const THREAD_COLUMNS = [
  { key: "id", label: "Ref" },
  { key: "subject", label: "Subject" },
  { key: "participants", label: "Participants" },
  { key: "stage", label: "Stage" },
  { key: "listingId", label: "Listing" },
  { key: "requirementId", label: "Requirement" },
  { key: "fraudFlags", label: "Fraud flags" },
  { key: "reported", label: "Reported" },
  { key: "lastMessagePreview", label: "Last message" },
  { key: "lastMessageAt", label: "Last message at" },
  { key: "createdAt", label: "Opened" },
];

const REPORT_COLUMNS = [
  { key: "id", label: "Report" },
  { key: "subject", label: "Thread" },
  { key: "participants", label: "Parties" },
  { key: "reportedBy", label: "Filed by" },
  { key: "reason", label: "Reason" },
  { key: "status", label: "Status" },
  { key: "resolvedBy", label: "Decided by" },
  { key: "createdAt", label: "Raised" },
];

function stamp(date) {
  return date.toISOString().slice(0, 10);
}

function text(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

function shape(columns, rows) {
  return rows.map((row) => {
    const flat = {};
    for (const column of columns) flat[column.key] = text(row[column.key]);
    return flat;
  });
}

async function guard() {
  const context = await getSessionContext();
  if (!context.session) return { status: 401, error: "Sign in to continue." };
  if (context.suspended) return { status: 403, error: "This account is suspended." };
  if (context.staffRole && !(await staff2faFreshInDb(context.user.email))) {
    return { status: 403, error: "Staff access needs a fresh sign-in code." };
  }
  const granted =
    can(context.role, "admin.inquiries") || context.extraPermissions.includes("admin.inquiries");
  if (!granted) return { status: 403, error: "Not authorised." };
  return { context };
}

export async function GET(request) {
  try {
    const access = await guard();
    if (access.status) {
      return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
    }

    const url = new URL(request.url);
    const format = (url.searchParams.get("format") || "csv").toLowerCase();
    const kind = (url.searchParams.get("kind") || "inquiries").toLowerCase();
    if (!["csv", "xlsx"].includes(format)) {
      return NextResponse.json(
        { ok: false, error: "Format must be csv or xlsx." },
        { status: 400 },
      );
    }

    const now = new Date();
    let columns;
    let rows;
    let name;

    if (kind === "reports") {
      const docs = await db
        .collection("inquiry_reports")
        .find({})
        .sort({ createdAt: -1 })
        .limit(5000)
        .toArray();
      columns = REPORT_COLUMNS;
      rows = shape(columns, docs);
      name = `inquiry-reports-${stamp(now)}.${format === "xlsx" ? "xlsx" : "csv"}`;
    } else {
      const docs = await db
        .collection("threads")
        .find({})
        .sort({ lastMessageAt: -1 })
        .limit(5000)
        .toArray();
      columns = THREAD_COLUMNS;
      rows = shape(columns, docs);
      name = `inquiries-${stamp(now)}.${format === "xlsx" ? "xlsx" : "csv"}`;
    }

    await recordAudit({
      action: `inquiry.export.${format}`,
      target: `kind:${kind}`,
      detail: { rows: rows.length, format },
      actor: access.context.user.email,
      actorRole: access.context.role,
    });

    if (format === "xlsx") {
      const buffer = toXlsx({ sheetName: kind === "reports" ? "Reports" : "Inquiries", columns, rows, now });
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${name}"`,
          "Cache-Control": "no-store",
          "Content-Length": String(buffer.length),
        },
      });
    }

    const csv = toCsv(columns, rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[export] failed", error.message);
    return NextResponse.json(
      { ok: false, error: "The export could not be created." },
      { status: 500 },
    );
  }
}
