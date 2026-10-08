import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// One shared .env for the Next.js frontend and this API: my-app/.env
// (dotenv does not override vars already set in process.env).
dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const number = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const smtpUser = (process.env.SMTP_USER || "").trim();
const smtpPass = (process.env.SMTP_PASS || "").trim();

export const config = {
  // BACKEND_PORT keeps PORT free for Next.js. `PORT` is still honoured as a
  // fallback (e.g. `vercel dev` injects it) — listen() is skipped on Vercel anyway.
  port: number(process.env.BACKEND_PORT ?? process.env.PORT, 4000),
  mongoUri: process.env.MONGODB_URI || "",
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: number(process.env.SMTP_PORT, 465),
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : number(process.env.SMTP_PORT, 465) === 465,
    user: smtpUser,
    pass: smtpPass,
    from: process.env.SMTP_FROM || (smtpUser ? `"AlliedOne" <${smtpUser}>` : undefined),
  },
  otp: {
    ttlMinutes: number(process.env.OTP_TTL_MINUTES, 10),
    resendSeconds: number(process.env.OTP_RESEND_SECONDS, 60),
    maxAttempts: number(process.env.OTP_MAX_ATTEMPTS, 5),
  },
  // Vercel always sets NODE_ENV=production.
  isProduction: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
};

// No SMTP credentials → local/dev mode: the OTP is returned in the API
// response instead of being emailed. Never allowed in production.
export const smtpConfigured = Boolean(config.smtp.user && config.smtp.pass);
export const devMode = !smtpConfigured && !config.isProduction;
