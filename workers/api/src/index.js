// workers/api/src/index.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/cal/webhook") {
      return handleCalWebhook(request, env);
    }

    // keep your existing endpoints if needed later (stripe, status, etc.)
    return json({ error: "Not found" }, 404);
  },
};

async function handleCalWebhook(request, env) {
  if (!env.CAL_WEBHOOK_SECRET) return json({ error: "Missing CAL_WEBHOOK_SECRET" }, 500);
  if (!env.R2_BUCKET) return json({ error: "Missing R2_BUCKET binding" }, 500);

  const rawBody = await request.text();

  // Cal.com signature header
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

function norma
