import { Router } from "express";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { config, devMode, smtpConfigured } from "../config.js";
import { connectDb, users } from "../db.js";
import { sendOtpEmail } from "../mailer.js";
import { Otp } from "../models/otp.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Best-effort per-IP throttle (in-memory). The per-email cooldown below is
// the real guard; this just blunts address-rotation abuse locally.
const SEND_WINDOW_MS = 10 * 60 * 1000;
const SEND_MAX_PER_WINDOW = 15;
const sendLog = new Map();

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function ipAllowed(ip) {
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

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const generateCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

router.post("/send", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    if (!devMode && !smtpConfigured) {
      return res
        .status(503)
        .json({ error: "Email delivery is not configured on this server." });
    }

    if (!ipAllowed(clientIp(req))) {
      return res
        .status(429)
        .json({ error: "Too many requests. Try again in a few minutes." });
    }

    await connectDb();

    // Silent no-op for unknown addresses so the endpoint can't be used to
    // probe which emails are registered (matches better-auth sign-up).
    const user = await users().findOne({ email }, { projection: { _id: 1 } });
    if (!user) return res.json({ ok: true });

    const pending = await Otp.findOne({ email });
    if (pending?.lastSentAt) {
      const elapsed = (Date.now() - pending.lastSentAt.getTime()) / 1000;
      if (elapsed < config.otp.resendSeconds) {
        const retryAfterSeconds = Math.ceil(config.otp.resendSeconds - elapsed);
        return res.status(429).json({
          error: `Please wait ${retryAfterSeconds}s before requesting a new code.`,
          retryAfterSeconds,
        });
      }
    }

    const code = generateCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.otp.ttlMinutes * 60_000);

    try {
      await sendOtpEmail({ to: email, code });
    } catch (error) {
      console.error("[otp] send failed:", error.message);
      await Otp.deleteOne({ email });
      return res
        .status(502)
        .json({ error: "Could not send the verification email. Try again." });
    }

    await Otp.updateOne(
      { email },
      {
        $set: { codeHash: bcrypt.hashSync(code, 10), attempts: 0, lastSentAt: now, expiresAt },
        $setOnInsert: { email },
      },
      { upsert: true },
    );

    const payload = {
      ok: true,
      expiresInSeconds: config.otp.ttlMinutes * 60,
      resendAfterSeconds: config.otp.resendSeconds,
    };
    if (devMode) payload.devOtp = code;
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Enter the 6-digit code." });
    }

    await connectDb();

    const otp = await Otp.findOne({ email });
    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      if (otp) await Otp.deleteOne({ _id: otp._id });
      return res
        .status(400)
        .json({ error: "That code has expired. Request a new one." });
    }

    if (otp.attempts >= config.otp.maxAttempts) {
      await Otp.deleteOne({ _id: otp._id });
      return res
        .status(400)
        .json({ error: "Too many wrong attempts. Request a new code." });
    }

    if (!bcrypt.compareSync(code, otp.codeHash)) {
      const attempts = otp.attempts + 1;
      const remaining = config.otp.maxAttempts - attempts;
      if (remaining <= 0) {
        await Otp.deleteOne({ _id: otp._id });
        return res
          .status(400)
          .json({ error: "Too many wrong attempts. Request a new code." });
      }
      await Otp.updateOne({ _id: otp._id }, { $set: { attempts } });
      return res.status(400).json({
        error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`,
      });
    }

    const result = await users().updateOne(
      { email },
      { $set: { emailVerified: true, updatedAt: new Date() } },
    );
    if (result.matchedCount === 0) {
      await Otp.deleteOne({ _id: otp._id });
      return res.status(400).json({ error: "No account found for that email." });
    }

    await Otp.deleteMany({ email });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
