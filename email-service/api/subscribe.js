import { createHmac } from "node:crypto";
import { head, put } from "@vercel/blob";

const site = "https://thenewjournal.org";
const messages = {
  saved: "You’re on the list.",
  invalid: "Enter a valid email address.",
  busy: "Please wait a minute and try again.",
  unavailable: "Your signup couldn’t be saved. Please try again.",
};

// Limit bursts on a warm instance. Never retain IP addresses with signups.
const attempts = new Map();
let resetAt = 0;
function tooManyRequests(ip) {
  const now = Date.now();
  if (now >= resetAt) {
    attempts.clear();
    resetAt = now + 60000;
  }
  const count = attempts.get(ip) || 0;
  if (count >= 12) return true;
  attempts.set(ip, count + 1);
  return false;
}

export default async function subscribe(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Origin");
  const origin = req.headers.origin;
  if (origin !== site && origin !== "https://www.thenewjournal.org") return res.status(403).end();
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Allow", "POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") return res.status(405).end();
  const type = req.headers["content-type"]?.split(";")[0];
  const nativeForm = type === "application/x-www-form-urlencoded";
  if (!nativeForm && type !== "application/json") return res.status(415).end();

  function reply(status, result) {
    if (!nativeForm) return res.status(status).json({ result });
    res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors " + origin);
    return res.status(status).setHeader("Content-Type", "text/html; charset=utf-8")
      .send('<!doctype html><html lang="en"><title>Email signup</title><style>body{margin:0;background:#f7f1e1;color:#302a22;font:16px/1.5 Georgia,serif}</style><body>' + messages[result] + '</body></html>');
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  if (email.length > 254 || !/^[^\s@\p{C}]+@[^\s@\p{C}]+\.[^\s@\p{C}]+$/u.test(email)) return reply(400, "invalid");
  if (tooManyRequests(req.headers["x-vercel-forwarded-for"] || req.socket.remoteAddress)) {
    res.setHeader("Retry-After", "60");
    return reply(429, "busy");
  }

  try {
    const id = createHmac("sha256", process.env.SIGNUP_KEY).update(email.toLowerCase()).digest("hex");
    const path = "signups/" + id + ".json";
    const record = { email, signedUpAt: new Date().toISOString(), list: "new-issues", verified: false };
    try {
      await put(path, JSON.stringify(record), {
        access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json",
      });
    } catch {
      // Concurrent and repeat requests succeed only if the record already exists.
      await head(path);
    }
    return reply(200, "saved");
  } catch {
    return reply(503, "unavailable");
  }
}
