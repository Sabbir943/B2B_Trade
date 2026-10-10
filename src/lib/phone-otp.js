import { randomInt } from "node:crypto";
import { db } from "./db";
import { hashOtpCode, matchesOtpCode, otpConfig } from "./otp";

/**
 * Phone OTP verification (spec §7.1.1 — "Email and phone OTP verification").
 *
 * Mirrors the email service in ./otp.js: the code is hashed, short-lived and
 * throttled, and stored in `phone_otps` with a TTL index.
 *
 * Delivery uses an SMS gateway configured with SMS_API_URL / SMS_API_KEY /
 * SMS_SENDER. Without those variables the service runs in DEV MODE and the
 * code comes back in the response instead of an SMS — the same contract the
 * email OTP uses (never allowed once NODE_ENV=production / VERCEL is set).
 */

const PHONES = "phone_otps";
const SMS_URL = (process.env.SMS_API_URL || "").trim();
const SMS_KEY = (process.env.SMS_API_KEY || "").trim();
const SMS_SENDER = (process.env.SMS_SENDER || "").trim();

const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

export const smsConfigured = Boolean(SMS_URL && SMS_KEY);
export const phoneDevMode = !smsConfigured && !isProduction;

/** Keep digits plus a leading `+` — max 15 digits (E.164). */
export function normalizePhone(value) {
  const raw = String(value || "").trim();
  const plus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "").slice(0, 15);
  if (digits.length < 8) return "";
  return plus ? `+${digits}` : digits;
}

let indexReady = Boolean(globalThis.__phoneOtpIndexReady);

async function ensureIndexes() {
  if (indexReady) return;
  try {
    await db.collection(PHONES).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    indexReady = true;
    globalThis.__phoneOtpIndexReady = true;
  } catch (error) {
    console.error("[phone-otp] TTL index creation failed", error.message);
  }
}

function httpError(status, message, data) {
  const error = new Error(message);
  error.status = status;
  if (data) error.data = data;
  return error;
}

const generateCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

async function deliver({ to, code }) {
  if (!smsConfigured) return false;
  const response = await fetch(SMS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SMS_KEY}` },
    body: JSON.stringify({ to, sender: SMS_SENDER, text: `AlliedOne verification code: ${code}` }),
  });
  if (!response.ok) throw new Error(`SMS gateway responded ${response.status}`);
  return true;
}

export async function sendPhoneOtp({ email, phone }) {
  const key = String(email || "").toLowerCase().trim();
  const target = normalizePhone(phone);
  if (!key) throw httpError(401, "Sign in first.");
  if (!target) throw httpError(400, "Enter a valid phone number.");
  if (!phoneDevMode && !smsConfigured) {
    throw httpError(503, "SMS delivery is not configured on this server.");
  }

  await ensureIndexes();

  const pending = await db.collection(PHONES).findOne({ email: key });
  if (pending?.lastSentAt) {
    const elapsed = (Date.now() - new Date(pending.lastSentAt).getTime()) / 1000;
    if (elapsed < otpConfig.resendSeconds) {
      const retryAfterSeconds = Math.ceil(otpConfig.resendSeconds - elapsed);
      throw httpError(429, `Please wait ${retryAfterSeconds}s before requesting a new code.`, { retryAfterSeconds });
    }
  }

  const code = generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + otpConfig.ttlMinutes * 60_000);

  try {
    await deliver({ to: target, code });
  } catch (error) {
    console.error("[phone-otp] send failed:", error.message);
    throw httpError(502, "Could not send the SMS. Try again.");
  }

  await db.collection(PHONES).updateOne(
    { email: key },
    {
      $set: {
        phone: target,
        codeHash: hashOtpCode(code),
        attempts: 0,
        lastSentAt: now,
        expiresAt,
        updatedAt: now,
      },
      $setOnInsert: { email: key, createdAt: now },
    },
    { upsert: true },
  );

  const payload = {
    ok: true,
    phone: target,
    expiresInSeconds: otpConfig.ttlMinutes * 60,
    resendAfterSeconds: otpConfig.resendSeconds,
  };
  if (phoneDevMode) payload.devOtp = code;
  return payload;
}

export async function verifyPhoneOtp({ email, code }) {
  const key = String(email || "").toLowerCase().trim();
  const digits = String(code || "").trim();
  if (!key) throw httpError(401, "Sign in first.");
  if (!/^\d{6}$/.test(digits)) throw httpError(400, "Enter the 6-digit code.");

  await ensureIndexes();

  const otp = await db.collection(PHONES).findOne({ email: key });
  if (!otp || new Date(otp.expiresAt).getTime() < Date.now()) {
    if (otp) await db.collection(PHONES).deleteOne({ _id: otp._id });
    throw httpError(400, "That code has expired. Request a new one.");
  }
  if (otp.attempts >= otpConfig.maxAttempts) {
    await db.collection(PHONES).deleteOne({ _id: otp._id });
    throw httpError(400, "Too many wrong attempts. Request a new code.");
  }
  if (!matchesOtpCode(digits, otp.codeHash)) {
    const attempts = (otp.attempts || 0) + 1;
    if (attempts >= otpConfig.maxAttempts) {
      await db.collection(PHONES).deleteOne({ _id: otp._id });
      throw httpError(400, "Too many wrong attempts. Request a new code.");
    }
    await db.collection(PHONES).updateOne({ _id: otp._id }, { $set: { attempts, updatedAt: new Date() } });
    const remaining = otpConfig.maxAttempts - attempts;
    throw httpError(400, `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`);
  }

  const { markPhoneVerified, saveProfile, getProfile } = await import("./profile");
  const profile = await getProfile(key);
  const saved = await saveProfile(key, { ...profile, phone: otp.phone });
  if (!saved.ok) throw httpError(500, "Could not save the phone number.");
  await markPhoneVerified(key);

  await db.collection(PHONES).deleteMany({ email: key });
  return { ok: true, phone: otp.phone };
}
