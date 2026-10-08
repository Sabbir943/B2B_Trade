import nodemailer from "nodemailer";
import { config, smtpConfigured } from "./config.js";

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

function renderEmail(code) {
  const { ttlMinutes } = config.otp;
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

export async function sendOtpEmail({ to, code }) {
  if (!smtpConfigured) return false;
  const { html, text } = renderEmail(code);
  await getTransporter().sendMail({
    from: config.smtp.from || config.smtp.user,
    to,
    // Code stays out of the subject (spam-score + privacy on lock screens).
    subject: "Your AlliedOne verification code",
    text,
    html,
  });
  return true;
}
