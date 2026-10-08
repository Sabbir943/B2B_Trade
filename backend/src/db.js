import mongoose from "mongoose";
import { config } from "./config.js";

// Cache the connection promise across hot reloads / serverless invocations.
let cached = globalThis.__otpMongoose;

export async function connectDb() {
  if (cached) return cached;
  if (!config.mongoUri) {
    throw new Error("MONGODB_URI is missing. Copy .env.example to .env and fill it in.");
  }
  cached = mongoose
    .connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 })
    .then(() => mongoose)
    .catch((error) => {
      cached = undefined;
      globalThis.__otpMongoose = undefined;
      throw error;
    });
  globalThis.__otpMongoose = cached;
  return cached;
}

export function users() {
  return mongoose.connection.collection("user");
}
