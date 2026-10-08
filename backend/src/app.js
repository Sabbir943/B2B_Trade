import express from "express";
import { config } from "./config.js";
import otpRoutes from "./routes/otp.js";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

// No cookies / credentials are used by these endpoints, so CORS is a plain
// origin reflection: allow the configured list, or anything when unset.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const allowed =
      config.allowedOrigins.length === 0 || config.allowedOrigins.includes(origin);
    if (allowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") return res.status(204).end();
  return next();
});

app.get("/api/health", (req, res) => res.json({ ok: true, service: "email-verification" }));
app.use("/api/otp", otpRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error("[backend]", error);
  res.status(error.status || 500).json({ error: "Server error" });
});

export default app;
