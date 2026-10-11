import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import path from "node:path";
import { can } from "@/lib/permissions";
import { getSessionContext } from "@/lib/session";
import { staff2faFreshInDb } from "@/lib/staff-2fa";
import { recordAudit } from "@/lib/audit";
import { errorResponse } from "../otp/response";

/**
 * Staff image upload for the no-code content editor.
 *
 * Files are written to `.uploads/` (outside `public/`, never executed) and
 * served back through `/api/files/[id]` with a locked-down content type.
 *
 * Route handlers cannot redirect, so the guard answers with JSON status codes
 * and runs the same checks as a server action: signed in, not suspended,
 * fresh staff 2FA stamp, and `admin.content` (role grant or extra permission).
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/svg+xml", ".svg"],
]);

export async function POST(request) {
  try {
    const context = await getSessionContext();
    if (!context.session) {
      return NextResponse.json({ ok: false, error: "Sign in to continue." }, { status: 401 });
    }
    if (context.suspended) {
      return NextResponse.json({ ok: false, error: "This account is suspended." }, { status: 403 });
    }
    if (context.staffRole && !(await staff2faFreshInDb(context.user.email))) {
      return NextResponse.json(
        { ok: false, error: "Staff access needs a fresh sign-in code." },
        { status: 403 },
      );
    }
    const granted =
      can(context.role, "admin.content") || context.extraPermissions.includes("admin.content");
    if (!granted) {
      return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "Choose an image to upload." }, { status: 400 });
    }

    const type = file.type || "";
    const ext = ALLOWED.get(type);
    if (!ext) {
      return NextResponse.json(
        { ok: false, error: "Only PNG, JPEG, WebP, GIF or SVG images are allowed." },
        { status: 415 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Image is too large — the limit is 5 MB." },
        { status: 413 },
      );
    }

    const id = randomUUID();
    const dir = path.join(process.cwd(), ".uploads");
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, `${id}${ext}`), buffer);

    await recordAudit({
      action: "content.upload",
      target: `file:${id}`,
      detail: { name: file.name, type, bytes: file.size },
      actor: context.user.email,
      actorRole: context.role,
    });

    return NextResponse.json({
      ok: true,
      id,
      url: `/api/files/${id}`,
      name: file.name,
      bytes: file.size,
    });
  } catch (error) {
    return errorResponse(error, "Upload failed. Try again.");
  }
}
