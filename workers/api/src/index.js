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
  if (!env.CLICKUP_TOKEN) return json({ error: "Missing CLICKUP_TOKEN" }, 500);
  if (!env.CU_LIST_ORDERS_ID) return json({ error: "Missing CU_LIST_ORDERS_ID" }, 500);
  if (!env.CU_LIST_SUPPORT_ID) return json({ error: "Missing CU_LIST_SUPPORT_ID" }, 500);
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

  // Canonical storage (receipt + debugging)
  const key = `cal/${eventType}/${new Date().toISOString()}.json`;
  await env.R2_BUCKET.put(key, rawBody, {
    httpMetadata: { contentType: "application/json" },
  });

  // Delivery receipt to ClickUp (staff-visible confirmation)
  let cuTask;
  try {
    cuTask = await createClickUpReceiptTask(body, env, { eventSlug, eventType, r2Key: key });
  } catch (err) {
    console.error(err);
    // Return 200 so Cal doesn’t retry forever; surface failure to caller
    return json(
      {
        ok: false,
        error: "ClickUp receipt task failed",
        event_slug: eventSlug,
        event_type: eventType,
        r2_key: key,
      },
      200
    );
  }

  return json(
    {
      ok: true,
      clickup_task_id: cuTask?.id || null,
      clickup_task_url: cuTask?.url || null,
      event_slug: eventSlug,
      event_type: eventType,
      r2_key: key,
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

  const eventTitle = String(p.eventTitle || "");
  const eventDescription = String(p.eventDescription || p.description || "");
  const meetingTitle = String(p.title || "");

  const locationRaw = String(p.location || "");
  const locationLabel = humanLocation(locationRaw);

  const startTime = String(p.startTime || "");
  const endTime = String(p.endTime || "");
  const length = p.length != null ? String(p.length) : "";

  const typeSlug = String(p.type || meta.eventSlug || "unknown");
  const uid = String(p.uid || p.bookingUid || "");
  const bookingId = p.bookingId != null ? String(p.bookingId) : "";
  const iCalUID = String(p.iCalUID || "");
  const status = String(p.status || "");

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
    bookingId,
    cancelReason,
    cancelledBy,
    createdAt,
    endTime,
    eventDescription,
    eventTitle,
    iCalUID,
    length,
    locationLabel,
    meetingTitle,
    organizerLine,
    r2Key: meta.r2Key,
    rescheduleEndTime,
    rescheduleStartTime,
    rescheduleUid,
    rescheduledBy,
    startTime,
    status,
    triggerEvent,
    typeSlug,
    uid,
    videoUrl,
  });

  const payload = {
    name: taskName,
    description,
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

function buildStaffFriendlyDescription(d) {
  const lines = [
    "CAL.COM WEBHOOK RECEIVED",
    "",
    `Trigger: ${d.triggerEvent || "-"}`,
    `Received At (Cal): ${d.createdAt || "-"}`,
    `Type (slug): ${d.typeSlug || "-"}`,
    `UID: ${d.uid || "-"}`,
    d.bookingId ? `Booking ID: ${d.bookingId}` : null,
    d.status ? `Status: ${d.status}` : null,
    "",
    "APPOINTMENT",
    "",
    d.meetingTitle ? `Calendar Title: ${d.meetingTitle}` : null,
    d.eventTitle ? `Event Title: ${d.eventTitle}` : null,
    d.eventDescription ? `Event Description: ${d.eventDescription}` : null,
    d.length ? `Duration (min): ${d.length}` : null,
    d.startTime ? `Start: ${d.startTime}` : null,
    d.endTime ? `End: ${d.endTime}` : null,
    d.locationLabel ? `Location: ${d.locationLabel}` : null,
    d.videoUrl ? `Video URL: ${d.videoUrl}` : null,
    "",
    "PEOPLE",
    "",
    d.organizerLine ? `Organizer: ${d.organizerLine}` : null,
    d.bookerLine ? `Booker: ${d.bookerLine}` : null,
    "",
    "CHANGE DETAILS",
    "",
    d.cancelledBy ? `Cancelled By: ${d.cancelledBy}` : null,
    d.cancelReason ? `Cancellation Reason: ${d.cancelReason}` : null,
    d.rescheduledBy ? `Rescheduled By: ${d.rescheduledBy}` : null,
    d.rescheduleUid ? `Reschedule UID: ${d.rescheduleUid}` : null,
    d.rescheduleStartTime ? `Reschedule Start: ${d.rescheduleStartTime}` : null,
    d.rescheduleEndTime ? `Reschedule End: ${d.rescheduleEndTime}` : null,
    "",
    "TRACE",
    "",
    d.iCalUID ? `iCal UID: ${d.iCalUID}` : null,
    d.r2Key ? `R2 Key: ${d.r2Key}` : null,
    "",
    "NOTES",
    "",
    "- This ClickUp task is the delivery receipt for the Cal.com webhook.",
    "- Canonical payload is stored in R2; use the R2 Key above to retrieve it.",
  ];

  return lines.filter((x) => x != null && String(x).trim() !== "").join("\n");
}

function extractEventSlug(body) {
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
  return null;
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
  const timeZone = String(p.timeZone || "").trim();

  const parts = [];
  if (name) parts.push(name);
  if (email) parts.push(`<${email}>`);
  if (timeZone) parts.push(`(${timeZone})`);
  return parts.join(" ");
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
