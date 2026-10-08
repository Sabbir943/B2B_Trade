/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Same-origin OTP API: the browser only ever talks to this app's URL;
  // Next proxies /api/otp/* to the Express backend (server-side, no CORS).
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://localhost:4000";
    return [
      {
        source: "/api/otp/:path*",
        destination: `${backend}/api/otp/:path*`,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
