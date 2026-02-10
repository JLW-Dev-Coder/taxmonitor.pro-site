// workers/api/src/index.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/cal/webhook") {
      return handleCalWebhook(request, env);
    }

    return json({ error: "Not found" }, 404);
  },
};

async function handleCalWebhook(request, env) {
  if (!env.CAL_WEBHOOK_SECRET) return json({ error: "Missing CAL_WEBHOOK_SECRET" }, 500);
  if (!env.R2_BUCKET) return json({ error: "Missing R2_BUCKET binding" }, 500);

  const rawBody = await request.text();

  const sigHeader =
    request.headers.get("x-cal-signature-256") ||
    request.headers.get("X-Cal-Signature-256");

  if (!sigHeader) return json({ error: "Missing x-cal-signature-256" }, 401);

  const computed = await hmacSha256Hex(env.CAL_WEBHOOK_SECRET, rawBody);

  if (!timingSafeEqualHex(computed, sigHeader)) {
    return json({ error: "Invalid signature" }, 401);
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const eventType = normalizeCalEventType(body);
  const eventSlug = extractEventSlug(body);

  const key = `cal/${eventType}/${new Date().toISOString()}.json`;
  await env.R2_BUCKET.put(key, rawBody, {
    httpMetadata: { contentType: "application/json" },
  });

  return json(
    {
      ok: true,
      event_slug: eventSlug,
      event_type: eventType,
      r2_key: key,
    },
    200
  );
}

function extractEventSlug(body) {
  const candidates = [
    body?.payload?.eventType?.slug,
    body?.payload?.eventTypeSlug,
    body?.payload?.booking?.eventType?.slug,
    body?.payload?.booking?.eventTypeSlug,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

function normalizeCalEventType(body) {
  const raw =
    body?.triggerEvent ||
    body?.type ||
    body?.event ||
    body?.name ||
    "";

  const s = String(raw).toLowerCase();

  if (s.includes("cancel")) return "booking.cancelled";
  if (s.includes("reschedule")) return "booking.rescheduled";
  if (s.includes("created")) return "booking.created";

  if (s === "booking.created") return "booking.created";
  if (s === "booking.cancelled") return "booking.cancelled";
  if (s === "booking.rescheduled") return "booking.rescheduled";

  return "unknown";
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return bufToHex(sig);
}

function bufToHex(buf) {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

function timingSafeEqualHex(a, b) {
  const aa = String(a || "").toLowerCase();
  const bb = String(b || "").toLowerCase();
  if (aa.length !== bb.length) return false;

  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa.charCodeAt(i) ^ bb.charCodeAt(i);
  return diff === 0;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
    status,
  });
}
