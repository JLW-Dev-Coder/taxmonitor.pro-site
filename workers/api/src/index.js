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
  const missing = missingEnv(env, [
    "CAL_WEBHOOK_SECRET",
    "CLICKUP_TOKEN",
    "CU_LIST_ORDERS_ID",
    "CU_LIST_SUPPORT_ID",
    "GOOGLE_CLIENT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
    "GOOGLE_TOKEN_URI",
    "GOOGLE_WORKSPACE_USER_INFO",
    "GOOGLE_WORKSPACE_USER_SUPPORT",
  ]);

  if (!env.R2_BUCKET) missing.push("R2_BUCKET(binding)");

  if (missing.length) return json({ error: `Missing ${missing.join(", ")}` }, 500);

  const rawBody = await request.text();

  const sigHeader =
    request.headers.get("x-cal-signature-256") ||
    request.headers.get("X-Cal-Signature-256");

  if (!sigHeader) return json({ error: "Missing x-cal-signature-256" }, 401);

  const computed = await hmacSha256Hex(env.CAL_WEBHOOK_SECRET, rawBody);
  if (!timingSafeEqualHex(computed, sigHeader)) return json({ error: "Invalid signature" }, 401);

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const eventType = normalizeCalEventType(body);
  const typeSlug = extractTypeSlug(body);
  const triggerEvent = String(body?.triggerEvent || "");

  // 1) Canonical receipt in R2
  const r2Key = `cal/${eventType}/${new Date().toISOString()}.json`;
  await env.R2_BUCKET.put(r2Key, rawBody, {
    httpMetadata: { contentType: "application/json" },
  });

  // 2) Receipt task in ClickUp
  let cuTask;
  try {
    cuTask = await createClickUpReceiptTask(body, env, {
      eventType,
      r2Key,
      typeSlug,
    });
  } catch (err) {
    console.error(err);
    return json(
      {
        ok: false,
        error: "ClickUp receipt task failed",
        event_type: eventType,
        r2_key: r2Key,
        type_slug: typeSlug,
        trigger_event: triggerEvent,
      },
      200
    );
  }

  // 3) Outbound email via Gmail API (Workspace)
  let emailResult = null;
  try {
    emailResult = await sendBookingEmailForEvent(body, env);
    // Optional: log to ClickUp as a comment
    await addClickUpComment(cuTask?.id, env, formatEmailLogComment(emailResult, body));
  } catch (err) {
    console.error(err);
    await addClickUpComment(cuTask?.id, env, `EMAIL SEND FAILED\n- Error: ${String(err?.message || err)}`);
  }

  return json(
    {
      ok: true,
      clickup_task_id: cuTask?.id || null,
      clickup_task_url: cuTask?.url || null,
      email: emailResult,
      event_type: eventType,
      r2_key: r2Key,
      type_slug: typeSlug,
      trigger_event: triggerEvent,
    },
    200
  );
}

async function createClickUpReceiptTask(body, env, meta) {
  const p = body?.payload || {};
  const attendees = Array.isArray(p.attendees) ? p.attendees : [];
  const organizer = p.organizer || {};
  const booker = attendees[0] || {};

  const triggerEvent = String(body?.triggerEvent || "");
  const createdAt = String(body?.createdAt || "");

  const uid = String(p.uid || p.bookingUid || "");
  const typeSlug = String(meta.typeSlug || "unknown");

  const startTime = String(p.startTime || "");
  const endTime = String(p.endTime || "");

  const locationRaw = String(p.location || "");
  const locationLabel = humanLocation(locationRaw);

  const cancelReason = String(p.cancellationReason || "");
  const cancelledBy = String(p.cancelledBy || "");
  const rescheduledBy = String(p.rescheduledBy || "");
  const rescheduleUid = String(p.rescheduleUid || "");
  const rescheduleStartTime = String(p.rescheduleStartTime || "");
  const rescheduleEndTime = String(p.rescheduleEndTime || "");

  const videoUrl =
    String(p?.metadata?.videoCallUrl || "") ||
    String(p?.videoCallData?.url || "") ||
    (locationRaw.startsWith("http") ? locationRaw : "");

  const organizerLine = personLine(organizer);
  const bookerLine = personLine(booker);

  const listId = isSupportSlug(typeSlug) ? env.CU_LIST_SUPPORT_ID : env.CU_LIST_ORDERS_ID;

  const taskName = `CAL ${triggerEvent || "EVENT"} — ${typeSlug}${uid ? ` — ${uid}` : ""}`;

  const description = buildStaffFriendlyDescription({
    bookerLine,
    cancelReason,
    cancelledBy,
    createdAt,
    endTime,
    locationLabel,
    organizerLine,
    r2Key: meta.r2Key,
    rescheduleEndTime,
    rescheduleStartTime,
    rescheduleUid,
    rescheduledBy,
    startTime,
    triggerEvent,
    typeSlug,
    uid,
    videoUrl,
  });

  const tags = uniqueStrings([
    slugTag(typeSlug),
    slugTag(triggerEvent || "event"),
    slugTag(locationLabel || locationRaw || "location"),
  ]).slice(0, 3);

  const startDateMs = toEpochMs(startTime);
  const dueDateMs = toEpochMs(endTime);

  const payload = {
    description,
    due_date: dueDateMs,
    due_date_time: Boolean(dueDateMs),
    name: taskName,
    start_date: startDateMs,
    start_date_time: Boolean(startDateMs),
    tags,
  };

  const url = `https://api.clickup.com/api/v2/list/${encodeURIComponent(listId)}/task`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: env.CLICKUP_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`ClickUp create task failed: ${resp.status} ${text}`);
  }

  return resp.json();
}

async function sendBookingEmailForEvent(body, env) {
  const p = body?.payload || {};
  const attendees = Array.isArray(p.attendees) ? p.attendees : [];
  const organizer = p.organizer || {};
  const booker = attendees[0] || {};

  const triggerEvent = String(body?.triggerEvent || "");
  const eventType = normalizeCalEventType(body);
  const typeSlug = extractTypeSlug(body);

  const from = isSupportSlug(typeSlug) ? env.GOOGLE_WORKSPACE_USER_SUPPORT : env.GOOGLE_WORKSPACE_USER_INFO;

  const to = String(booker?.email || "").trim();
  if (!to) {
    return {
      ok: false,
      error: "No booker email found in payload.attendees[0].email",
      from,
    };
  }

  const bookerName = String(booker?.name || "there").trim();
  const organizerName = String(organizer?.name || "Tax Monitor Pro").trim();

  const locationRaw = String(p.location || "");
  const locationLabel = humanLocation(locationRaw);
  const videoUrl =
    String(p?.metadata?.videoCallUrl || "") ||
    String(p?.videoCallData?.url || "") ||
    (locationRaw.startsWith("http") ? locationRaw : "");

  const startTime = String(p.startTime || "");
  const endTime = String(p.endTime || "");

  const subject = emailSubjectForEvent(eventType);
  const text = emailBodyForEvent({
    bookerName,
    endTime,
    eventType,
    locationLabel,
    organizerName,
    startTime,
    triggerEvent,
    typeSlug,
    videoUrl,
  });

  const raw = buildRfc2822({
    bodyText: text,
    from,
    subject,
    to,
  });

  const accessToken = await getGoogleAccessToken({
    clientEmail: env.GOOGLE_CLIENT_EMAIL,
    privateKeyPem: env.GOOGLE_PRIVATE_KEY,
    scope: "https://www.googleapis.com/auth/gmail.send",
    sub: from,
    tokenUri: env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token",
  });

  const sendUrl = `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(from)}/messages/send`;
  const sendResp = await fetch(sendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: base64UrlEncode(raw) }),
  });

  const sendBody = await safeJson(sendResp);

  return {
    ok: sendResp.ok,
    from,
    to,
    subject,
    gmail_id: sendBody?.id || null,
    gmail_thread_id: sendBody?.threadId || null,
    status: sendResp.status,
  };
}

function emailBodyForEvent(input) {
  const lines = [];

  lines.push(`Hi ${input.bookerName},`);
  lines.push("");
  lines.push(emailHeadlineForEvent(input.eventType));
  lines.push("");

  lines.push(`Organizer: ${input.organizerName}`);
  lines.push(`Start: ${input.startTime || "-"}`);
  lines.push(`End: ${input.endTime || "-"}`);
  lines.push(`Location: ${input.locationLabel || "-"}`);

  if (input.videoUrl) lines.push(`Zoom link: ${input.videoUrl}`);

  lines.push("");
  lines.push("If you need to reschedule or cancel, please use the link in your Cal.com confirmation.");
  lines.push("");
  lines.push("— Tax Monitor Pro");
  return lines.join("\n");
}

function emailHeadlineForEvent(eventType) {
  const map = {
    "booking.cancelled": "Your appointment has been cancelled.",
    "booking.created": "Your appointment is confirmed.",
    "booking.rescheduled": "Your appointment has been rescheduled.",
  };
  return map[eventType] || "Your appointment has been updated.";
}

function emailSubjectForEvent(eventType) {
  const map = {
    "booking.cancelled": "Tax Monitor Pro — Appointment Cancelled",
    "booking.created": "Tax Monitor Pro — Appointment Confirmed",
    "booking.rescheduled": "Tax Monitor Pro — Appointment Rescheduled",
  };
  return map[eventType] || "Tax Monitor Pro — Appointment Update";
}

function buildRfc2822(input) {
  // Minimal RFC 2822 (plain text)
  // Gmail API expects RFC 2822 email as base64url in "raw". :contentReference[oaicite:2]{index=2}
  const headers = [];
  headers.push(`From: ${input.from}`);
  headers.push(`To: ${input.to}`);
  headers.push(`Subject: ${input.subject}`);
  headers.push("MIME-Version: 1.0");
  headers.push("Content-Type: text/plain; charset=UTF-8");
  headers.push("Content-Transfer-Encoding: 7bit");
  return `${headers.join("\r\n")}\r\n\r\n${String(input.bodyText || "")}\r\n`;
}

async function getGoogleAccessToken(args) {
  // Service account JWT bearer flow. :contentReference[oaicite:3]{index=3}
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    aud: args.tokenUri,
    exp: now + 3600,
    iat: now,
    iss: args.clientEmail,
    scope: args.scope,
    sub: args.sub,
  };

  const jwt = await signJwtRs256(header, claim, args.privateKeyPem);

  const form = new URLSearchParams();
  form.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  form.set("assertion", jwt);

  const resp = await fetch(args.tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const data = await safeJson(resp);
  if (!resp.ok || !data?.access_token) {
    throw new Error(`Google token error: ${resp.status} ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function signJwtRs256(header, claim, privateKeyPem) {
  const enc = new TextEncoder();
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const claimB64 = base64UrlEncode(JSON.stringify(claim));
  const signingInput = `${headerB64}.${claimB64}`;

  const key = await importPkcs8PrivateKey(privateKeyPem);
  const sigBuf = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    enc.encode(signingInput)
  );

  const sigB64 = base64UrlEncodeBytes(new Uint8Array(sigBuf));
  return `${signingInput}.${sigB64}`;
}

async function importPkcs8PrivateKey(pem) {
  const pemBody = String(pem || "")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  const binary = atob(pemBody);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function addClickUpComment(taskId, env, commentText) {
  const id = String(taskId || "").trim();
  if (!id) return;

  const url = `https://api.clickup.com/api/v2/task/${encodeURIComponent(id)}/comment`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: env.CLICKUP_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment_text: String(commentText || "") }),
  });
}

function formatEmailLogComment(emailResult, body) {
  const triggerEvent = String(body?.triggerEvent || "");
  const lines = [];
  lines.push("EMAIL SEND ATTEMPT");
  lines.push(`- Trigger: ${triggerEvent || "-"}`);
  lines.push(`- From: ${emailResult?.from || "-"}`);
  lines.push(`- To: ${emailResult?.to || "-"}`);
  lines.push(`- Subject: ${emailResult?.subject || "-"}`);
  lines.push(`- Status: ${String(emailResult?.status || "-")}`);
  lines.push(`- OK: ${String(Boolean(emailResult?.ok))}`);
  lines.push(`- Gmail ID: ${emailResult?.gmail_id || "-"}`);
  lines.push(`- Thread ID: ${emailResult?.gmail_thread_id || "-"}`);
  return lines.join("\n");
}

function buildStaffFriendlyDescription(d) {
  const lines = [
    "CAL.COM WEBHOOK RECEIVED",
    "",
    "TRIGGER",
    `- Trigger type: ${d.triggerEvent || "-"}`,
    `- Type (slug): ${d.typeSlug || "-"}`,
    `- UID: ${d.uid || "-"}`,
    `- Received At (Cal): ${d.createdAt || "-"}`,
    "",
    "PEOPLE",
    `- Organizer: ${d.organizerLine || "-"}`,
    `- Booker: ${d.bookerLine || "-"}`,
    "",
    "SCHEDULE",
    `- Start: ${d.startTime || "-"}`,
    `- End: ${d.endTime || "-"}`,
    "",
    "LOCATION",
    `- Location: ${d.locationLabel || "-"}`,
    `- Video URL: ${d.videoUrl || "-"}`,
    "",
    "CHANGE INFO",
    `- Cancelled By: ${d.cancelledBy || "-"}`,
    `- Cancellation Reason: ${d.cancelReason || "-"}`,
    `- Rescheduled By: ${d.rescheduledBy || "-"}`,
    `- Reschedule UID: ${d.rescheduleUid || "-"}`,
    `- Reschedule Start: ${d.rescheduleStartTime || "-"}`,
    `- Reschedule End: ${d.rescheduleEndTime || "-"}`,
    "",
    "FORENSICS",
    `- R2 Key: ${d.r2Key || "-"}`,
    "",
    "NOTES",
    "- This task is the staff-visible receipt of the Cal.com webhook.",
    "- Canonical payload is stored in R2; retrieve it using the R2 Key above.",
  ];

  return lines.join("\n");
}

function extractTypeSlug(body) {
  const candidates = [
    body?.payload?.type,
    body?.payload?.eventType?.slug,
    body?.payload?.eventTypeSlug,
    body?.payload?.booking?.eventType?.slug,
    body?.payload?.booking?.eventTypeSlug,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "unknown";
}

function humanLocation(locationRaw) {
  const s = String(locationRaw || "");
  if (!s) return "";
  if (s.includes("integrations:zoom")) return "Zoom";
  if (s.includes("integrations:daily")) return "Cal Video";
  if (s.includes("integrations:google_meet")) return "Google Meet";
  if (s.startsWith("http")) return "Video Link";
  return s;
}

function isSupportSlug(typeSlug) {
  return String(typeSlug || "").toLowerCase().includes("support");
}

function missingEnv(env, keys) {
  const out = [];
  for (const k of keys) {
    if (!env[k]) out.push(k);
  }
  return out;
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

function personLine(p) {
  if (!p || typeof p !== "object") return "";
  const name = String(p.name || "").trim();
  const email = String(p.email || "").trim();
  const timeZone = String(p.timeZone || p.timezone || "").trim();

  const parts = [];
  if (name) parts.push(name);
  if (email) parts.push(`<${email}>`);
  if (timeZone) parts.push(`(${timeZone})`);
  return parts.join(" ");
}

function toEpochMs(iso) {
  const s = String(iso || "").trim();
  if (!s) return null;
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}

function uniqueStrings(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    const s = String(x || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function slugTag(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 45) || "tag";
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

function base64UrlEncode(str) {
  return base64UrlEncodeBytes(new TextEncoder().encode(String(str || "")));
}

function base64UrlEncodeBytes(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function safeJson(resp) {
  const ct = String(resp?.headers?.get("content-type") || "");
  const text = await resp.text();
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
    status,
  });
}
