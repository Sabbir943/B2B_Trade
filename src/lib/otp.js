import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import { db } from "./db";

/**
 * Email verification (OTP) — the whole service lives in this app now.
 *
 * Endpoints: POST /api/otp/send and POST /api/otp/verify (see
 * src/app/api/otp/*). Codes are stored in `email_otps` with a TTL index so
 * Mongo expires them, hashed with scrypt so the code is never readable.
 *
 * SMTP credentials (SMTP_*) enable real delivery. Without them the service
 * runs in DEV MODE: the code comes back in the API response instead of an
 * email — never allowed once NODE_ENV=production / VERCEL is set.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERS = "user";
const OTPS = "email_otps";

const number = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const smtpUser = (process.env.SMTP_USER || "").trim();
const smtpPass = (process.env.SMTP_PASS || "").trim();
const smtpPort = number(process.env.SMTP_PORT, 465);

export const otpConfig = {
  ttlMinutes: number(process.env.OTP_TTL_MINUTES, 10),
  resendSeconds: number(process.env.OTP_RESEND_SECONDS, 60),
  maxAttempts: number(process.env.OTP_MAX_ATTEMPTS, 5),
};

const smtp = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : smtpPort === 465,
  user: smtpUser,
  pass: smtpPass,
  from: process.env.SMTP_FROM || (smtpUser ? `"AlliedOne" <${smtpUser}>` : undefined),
};

const isProduction =
  process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

export const smtpConfigured = Boolean(smtp.user && smtp.pass);
export const devMode = !smtpConfigured && !isProduction;

/** Error that the route handler turns into a status + JSON body. */
function httpError(status, message, data) {
  const error = new Error(message);
  error.status = status;
  if (data) error.data = data;
  return error;
}

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const generateCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

/* ------------------------------------------------------------------ *
 * Code hashing (scrypt + per-code salt, constant-time compare)
 * ------------------------------------------------------------------ */

function hashCode(code) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(code, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function matchesCode(code, stored) {
  try {
    const [scheme, salt, expected] = String(stored || "").split("$");
    if (scheme !== "scrypt" || !salt || !expected) return false;
    const derived = scryptSync(code, salt, 64);
    const wanted = Buffer.from(expected, "hex");
    return derived.length === wanted.length && timingSafeEqual(derived, wanted);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * SMTP transport (cached across invocations / hot reloads)
 * ------------------------------------------------------------------ */

function getTransporter() {
  const store = globalThis;
  if (!store.__otpTransporter) {
    store.__otpTransporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
    });
  }
  return store.__otpTransporter;
}

function renderEmail(code) {
  const { ttlMinutes } = otpConfig;
  // Deliverability rules: no links, no images, plain-text alternative,
  // authenticated From identical to the SMTP account, short factual subject.
  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Your AlliedOne verification code</title>
      </head>
      <body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" style="max-width:440px;background:#ffffff;border-radius:12px;border:1px solid #e5e9ee;">
              <tr><td style="padding:28px 28px 8px;">
                <div style="font-size:14px;font-weight:bold;letter-spacing:1px;color:#0A5486;text-transform:uppercase;">AlliedOne</div>
                <h1 style="font-size:20px;color:#10202e;margin:18px 0 8px;">Verify your email</h1>
                <p style="font-size:14px;color:#4a5764;line-height:1.6;margin:0;">
                  Here is your one-time code. It expires in ${ttlMinutes} minutes.
                </p>
              </td></tr>
              <tr><td align="center" style="padding:16px 28px;">
                <div style="font-size:34px;font-weight:bold;letter-spacing:10px;color:#0A5486;background:#f1f7fb;border:1px dashed #0A5486;border-radius:8px;padding:16px 8px;text-align:center;">
                  ${code}
                </div>
              </td></tr>
              <tr><td style="padding:8px 28px 28px;">
                <p style="font-size:12px;color:#8a97a3;line-height:1.6;margin:12px 0 0;">
                  You received this email because someone requested a code for
                  this address. If it wasn't you, you can ignore this message —
                  no account changes happen without the code.
                </p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>`;

  const text = [
    "AlliedOne — verify your email",
    "",
    "Your one-time verification code:",
    "",
    `  ${code}`,
    "",
    `It expires in ${ttlMinutes} minutes.`,
    "If you didn't request this code, ignore this email.",
  ].join("\n");

  return { html, text };
}

async function sendOtpEmail({ to, code }) {
  if (!smtpConfigured) return false;
  const { html, text } = renderEmail(code);
  await getTransporter().sendMail({
    from: smtp.from || smtp.user,
    to,
    // Code stays out of the subject (spam-score + privacy on lock screens).
    subject: "Your AlliedOne verification code",
    text,
    html,
  });
  return true;
}

/* ------------------------------------------------------------------ *
 * Storage
 * ------------------------------------------------------------------ */

let indexReady = Boolean(globalThis.__otpIndexReady);

async function ensureIndexes() {
  if (indexReady) return;
  try {
    await db
      .collection(OTPS)
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    indexReady = true;
    globalThis.__otpIndexReady = true;
  } catch (error) {
    console.error("[otp] TTL index creation failed", error.message);
  }
}

/* ------------------------------------------------------------------ *
 * Best-effort per-IP throttle (in-memory). The per-email cooldown below is
 * the real guard; this just blunts address-rotation abuse locally.
 * ------------------------------------------------------------------ */

const SEND_WINDOW_MS = 10 * 60 * 1000;
const SEND_MAX_PER_WINDOW = 15;

function ipAllowed(ip) {
  const store = globalThis;
  const sendLog = store.__otpSendLog ?? new Map();
  store.__otpSendLog = sendLog;

  const now = Date.now();
  const hits = (sendLog.get(ip) || []).filter((t) => now - t < SEND_WINDOW_MS);
  if (hits.length >= SEND_MAX_PER_WINDOW) {
    sendLog.set(ip, hits);
    return false;
  }
  hits.push(now);
  sendLog.set(ip, hits);
  return true;
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

export async function sendOtp({ email, ip = "unknown" }) {
  const address = normalizeEmail(email);
  if (!EMAIL_RE.test(address)) {
    throw httpError(400, "Enter a valid email address.");
  }

  if (!devMode && !smtpConfigured) {
    throw httpError(503, "Email delivery is not configured on this server.");
  }

  if (!ipAllowed(ip)) {
    throw httpError(429, "Too many requests. Try again in a few minutes.");
  }

  await ensureIndexes();

  // Silent no-op for unknown addresses so the endpoint can't be used to
  // probe which emails are registered (matches better-auth sign-up).
  const user = await db
    .collection(USERS)
    .findOne({ email: address }, { projection: { _id: 1 } });
  if (!user) return { ok: true };

  const pending = await db.collection(OTPS).findOne({ email: address });
  if (pending?.lastSentAt) {
    const elapsed = (Date.now() - new Date(pending.lastSentAt).getTime()) / 1000;
    if (elapsed < otpConfig.resendSeconds) {
      const retryAfterSeconds = Math.ceil(otpConfig.resendSeconds - elapsed);
      throw httpError(
        429,
        `Please wait ${retryAfterSeconds}s before requesting a new code.`,
        { retryAfterSeconds },
      );
    }
  }

  const code = generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + otpConfig.ttlMinutes * 60_000);

  try {
    await sendOtpEmail({ to: address, code });
  } catch (error) {
    console.error("[otp] send failed:", error.message);
    await db.collection(OTPS).deleteOne({ email: address });
    throw httpError(502, "Could not send the verification email. Try again.");
  }

  await db.collection(OTPS).updateOne(
    { email: address },
    {
      $set: {
        codeHash: hashCode(code),
        attempts: 0,
        lastSentAt: now,
        expiresAt,
        updatedAt: now,
      },
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

export async function verifyOtp({ email, code }) {
  const address = normalizeEmail(email);
  const digits = String(code || "").trim();

  if (!EMAIL_RE.test(address)) {
    throw httpError(400, "Enter a valid email address.");
  }
  if (!/^\d{6}$/.test(digits)) {
    throw httpError(400, "Enter the 6-digit code.");
  }

  await ensureIndexes();

  const otp = await db.collection(OTPS).findOne({ email: address });
  if (!otp || new Date(otp.expiresAt).getTime() < Date.now()) {
    if (otp) await db.collection(OTPS).deleteOne({ _id: otp._id });
    throw httpError(400, "That code has expired. Request a new one.");
  }

  if (otp.attempts >= otpConfig.maxAttempts) {
    await db.collection(OTPS).deleteOne({ _id: otp._id });
    throw httpError(400, "Too many wrong attempts. Request a new code.");
  }

  if (!matchesCode(digits, otp.codeHash)) {
    const attempts = (otp.attempts || 0) + 1;
    const remaining = otpConfig.maxAttempts - attempts;
    if (remaining <= 0) {
      await db.collection(OTPS).deleteOne({ _id: otp._id });
      throw httpError(400, "Too many wrong attempts. Request a new code.");
    }
    await db.collection(OTPS).updateOne(
      { _id: otp._id },
      { $set: { attempts, updatedAt: new Date() } },
    );
    throw httpError(
      400,
      `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`,
    );
  }

  const result = await db.collection(USERS).updateOne(
    { email: address },
    { $set: { emailVerified: true, updatedAt: new Date() } },
  );
  if (result.matchedCount === 0) {
    await db.collection(OTPS).deleteOne({ _id: otp._id });
    throw httpError(400, "No account found for that email.");
  }

  await db.collection(OTPS).deleteMany({ email: address });
  return { ok: true };
}

/* Shared with the phone OTP service so both channels hash codes alike. */
export { hashCode as hashOtpCode, matchesCode as matchesOtpCode };
