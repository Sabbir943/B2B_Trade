// Same-origin: the OTP endpoints are Next.js route handlers in this app
// (src/app/api/otp/*), so the browser always calls its own URL.
// Override only if you deliberately want to point at another host.
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

async function post(path, body) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new Error("Could not reach the verification service. Try again.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body; handled below.
  }

  if (!response.ok) {
    const error = new Error(data?.error || "Request failed. Try again.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data ?? {};
}

export function sendOtp(email) {
  return post("/api/otp/send", { email });
}

export function verifyOtp(email, code) {
  return post("/api/otp/verify", { email, code });
}
