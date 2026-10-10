import { randomInt } from "node:crypto";
import { db } from "./db";
import { hashOtpCode, matchesOtpCode, otpConfig, smtpConfigured, devMode } from "./otp";
import { isStaff } from "./permissions";

/**
 * Mandatory two-factor (email OTP) for staff logins (spec: every Admin and
 * Super-Admin login requires 2FA).
 *
 * Flow — driven by /secure-admin-login:
 *   1. Password sign-in through better-auth (sets the normal session).
 *   2. POST /api/staff-2fa/send  → 6-digit code emailed (dev mode returns it).
 *   3. POST /api/staff-2fa/verify → stamps `staff2faAt` on the user document.
 *   4. Admin/console layouts reject any staff session whose `staff2faAt`
 *      is missing or older than STAFF_2FA_WINDOW_HOURS.
 *
 * The stamp lives in Mongo (not a client cookie) so it can be revoked by
 * suspending the account, and it survives server restarts.
 */

const CODES = "staff_2fa_codes";
const USERS = "user";

export const STAFF_2FA_WINDOW_HOURS = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let indexReady = Boolean(globalThis.__staff2faIndexReady);

async function ensureIndexes() {
  if (indexReady) return;
  try {
    await db.collection(CODES).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    indexReady = true;
    globalThis.__staff2faIndexReady = true;
  } catch (error) {
    console.error("[staff-2fa] TTL index creation failed", error.message);
  }
}

function httpError(status, message, data) {
  const error = new Error(message);
  error.status = status;
  if (data) error.data = data;
  return error;
}

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

/** Only staff roles get 2FA; members never hit this path. */
export function requiresStaff2fa(role) {
  return isStaff(role) || role === "super_admin";
}

/** True when the user's most recent staff 2FA stamp is still inside the window. */
export function staff2faFresh(user) {
  if (!user?.staff2faAt) return false;
  const at = new Date(user.staff2faAt).getTime();
  return Number.isFinite(at) && Date.now() - at < STAFF_2FA_WINDOW_HOURS * 3_600_000;
}

/**
 * DB-backed freshness check for server gates. better-auth sessions may not
 * carry custom user fields, so the stamp is read straight from the user
 * collection (indexed by email).
 */
export async function staff2faFreshInDb(email) {
  const address = normalizeEmail(email);
  if (!address) return false;
  try {
    const user = await db
      .collection(USERS)
      .findOne({ email: address }, { projection: { staff2faAt: 1 } });
    return staff2faFresh(user);
  } catch (error) {
    console.error("[staff-2fa] freshness read failed", error.message);
    return false;
  }
}

/** Sends a login code. Throws 403 unless the signed-in account is staff. */
export async function sendStaffLoginCode({ email, role }) {
  const address = normalizeEmail(email);
  if (!EMAIL_RE.test(address)) throw httpError(400, "Enter a valid email address.");
  if (!requiresStaff2fa(role)) {
    throw httpError(403, "This sign-in is for staff accounts only.");
  }
  if (!devMode && !smtpConfigured) {
    throw httpError(503, "Email delivery is not configured on this server.");
  }

  await ensureIndexes();

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + otpConfig.ttlMinutes * 60_000);

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });
    if (smtpConfigured) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: address,
        subject: "Your AlliedOne staff login code",
        text: [
          "AlliedOne — staff login code",
          "",
          `Your one-time code: ${code}`,
          "",
          `It expires in ${otpConfig.ttlMinutes} minutes.`,
          "If you didn't request this code, ignore this email and change your password.",
        ].join("\n"),
      });
    }
  } catch (error) {
    console.error("[staff-2fa] send failed:", error.message);
    await db.collection(CODES).deleteOne({ email: address });
    throw httpError(502, "Could not send the login code. Try again.");
  }

  await db.collection(CODES).updateOne(
    { email: address },
    {
      $set: { codeHash: hashOtpCode(code), attempts: 0, lastSentAt: now, expiresAt, updatedAt: now },
      $setOnInsert: { email: address, createdAt: now },
    },
    { upsert: true },
  );

  const payload = {
    ok: true,
    expiresInSeconds: otpConfig.ttlMinutes * 60,
    resendAfterSeconds: otpConfig.resendSeconds,
  };
  if (devMode) payload.devOtp = code;
  return payload;
}

/** Verifies the code and stamps `staff2faAt` on the user. */
export async function verifyStaffLoginCode({ email, role, code }) {
  const address = normalizeEmail(email);
  const digits = String(code || "").trim();

  if (!EMAIL_RE.test(address)) throw httpError(400, "Enter a valid email address.");
  if (!requiresStaff2fa(role)) {
    throw httpError(403, "This sign-in is for staff accounts only.");
  }
  if (!/^\d{6}$/.test(digits)) throw httpError(400, "Enter the 6-digit code.");

  await ensureIndexes();

  const stored = await db.collection(CODES).findOne({ email: address });
  if (!stored || new Date(stored.expiresAt).getTime() < Date.now()) {
    if (stored) await db.collection(CODES).deleteOne({ _id: stored._id });
    throw httpError(400, "That code has expired. Request a new one.");
  }
  if (stored.attempts >= otpConfig.maxAttempts) {
    await db.collection(CODES).deleteOne({ _id: stored._id });
    throw httpError(400, "Too many wrong attempts. Request a new code.");
  }
  if (!matchesOtpCode(digits, stored.codeHash)) {
    const attempts = (stored.attempts || 0) + 1;
    await db.collection(CODES).updateOne({ _id: stored._id }, { $set: { attempts } });
    if (attempts >= otpConfig.maxAttempts) {
      await db.collection(CODES).deleteOne({ _id: stored._id });
      throw httpError(400, "Too many wrong attempts. Request a new code.");
    }
    throw httpError(400, `Wrong code. ${otpConfig.maxAttempts - attempts} attempts left.`);
  }

  await db.collection(CODES).deleteOne({ _id: stored._id });
  await db
    .collection(USERS)
    .updateOne({ email: address }, { $set: { staff2faAt: new Date(), updatedAt: new Date() } });

  return { ok: true };
}
