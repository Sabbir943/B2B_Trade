import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0, min: 0 },
    lastSentAt: { type: Date, default: Date.now, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Mongo deletes expired codes automatically.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = models.Otp || model("Otp", otpSchema, "email_otps");
