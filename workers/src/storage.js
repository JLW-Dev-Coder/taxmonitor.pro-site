/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

export async function appendReceipt({ contract, env, requestContext, route }) {
  const pattern =
    contract?.delivery?.receiptKeyPattern ||
    contract?.effects?.receiptAppend?.to ||
    "receipts/tmp/fallback/{eventId}.json";

  const key = resolveTemplate(pattern, requestContext, route);

  const receipt = {
    body: requestContext.body || {},
    contractPath: contract?.contract?.path || null,
    method: requestContext.method,
    params: requestContext.params || {},
    query: requestContext.query || {},
    receivedAt: new Date().toISOString(),
    route: route?.path || contract?.delivery?.endpoint || null
  };

  await putJson(env, key, receipt);

  return {
    key,
    receipt
  };
}

export async function executeWritePipeline({ contract, env, requestContext, route }) {
  const result = {
    canonicalRecord: null,
    projections: [],
    receipt: null
  };

  const writeOrder = contract?.effects?.writeOrder || [];

  for (const step of writeOrder) {
    if (step === "receiptAppend") {
      result.receipt = await appendReceipt({
        contract,
        env,
        requestContext,
        route
      });
    }

    if (step === "canonicalUpsert") {
      result.canonicalRecord = await upsertCanonicalRecord({
        contract,
        env,
        requestContext,
        route
      });
    }

    if (step === "projection") {
      result.projections.push({
        ok: true,
        skipped: true
      });
    }
  }

  return result;
}

export async function getJson(env, key) {
  const object = await env.R2_BUCKET.get(stripLeadingSlash(key));

  if (!object) {
    return null;
  }

  return await object.json();
}

export async function listByField(env, prefix, fieldName, fieldValue) {
  const items = [];
  let cursor;

  do {
    const page = await env.R2_BUCKET.list({
      cursor,
      prefix: stripLeadingSlash(prefix)
    });

    for (const object of page.objects) {
      if (!object.key.endsWith(".json")) {
        continue;
      }

      const value = await getJson(env, object.key);
      if (!value) {
        continue;
      }

      if (String(readField(value, fieldName) || "") === String(fieldValue || "")) {
        items.push(value);
      }
    }

    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  return items;
}

export async function listByPrefix(env, prefix) {
  const items = [];
  let cursor;

  do {
    const page = await env.R2_BUCKET.list({
      cursor,
      prefix: stripLeadingSlash(prefix)
    });

    for (const object of page.objects) {
      if (!object.key.endsWith(".json")) {
        continue;
      }

      const value = await getJson(env, object.key);
      if (value) {
        items.push(value);
      }
    }

    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  return items;
}

export async function putJson(env, key, value) {
  await env.R2_BUCKET.put(
    stripLeadingSlash(key),
    JSON.stringify(value, null, 2),
    {
      httpMetadata: {
        contentType: "application/json; charset=utf-8"
      }
    }
  );
}

export async function upsertCanonicalRecord({ contract, env, requestContext, route }) {
  const target = contract?.effects?.canonicalUpsert?.target;
  const patch = contract?.effects?.canonicalPatch || {};

  if (!target) {
    return null;
  }

  const key = resolveTemplate(target, requestContext, route);
  const existing = (await getJson(env, key)) || {};
  const resolvedPatch = resolveObject(patch, requestContext, route);
  const record = {
    ...existing,
    ...resolvedPatch
  };

  await putJson(env, key, record);

  return {
    key,
    record
  };
}

export function mergeAccountNotificationPreferences(account, patch) {
  const current = account?.notificationPreferences || {};

  return {
    ...account,
    notificationPreferences: {
      ...current,
      ...patch
    },
    updatedAt: new Date().toISOString()
  };
}

export function resolveTemplate(value, requestContext, route) {
  if (typeof value !== "string") {
    return value;
  }

  const params = requestContext?.params || {};
  const body = requestContext?.body || {};
  const query = requestContext?.query || {};
  const systemNow = new Date().toISOString();
  const systemRequestId =
    body.eventId ||
    body.membershipId ||
    body.ticketId ||
    body.notificationId ||
    body.messageId ||
    params.account_id ||
    params.inquiry_id ||
    params.membership_id ||
    params.ticket_id ||
    query.session_id ||
    crypto.randomUUID();

  return value
    .replaceAll("{eventId}", body.eventId || systemRequestId)
    .replaceAll("{recordId}", body.eventId || body.recordId || params.account_id || params.inquiry_id || params.membership_id || params.ticket_id || systemRequestId)
    .replaceAll("{system.nowIso}", systemNow)
    .replaceAll("{system.requestId}", systemRequestId)
    .replaceAll("{params.account_id}", params.account_id || "")
    .replaceAll("{params.inquiry_id}", params.inquiry_id || "")
    .replaceAll("{params.membership_id}", params.membership_id || "")
    .replaceAll("{params.professional_id}", params.professional_id || "")
    .replaceAll("{params.ticket_id}", params.ticket_id || "")
    .replaceAll("{payload.accountId}", body.accountId || "")
    .replaceAll("{payload.billingPeriod}", body.billingPeriod || "")
    .replaceAll("{payload.displayName}", body.displayName || "")
    .replaceAll("{payload.email}", body.email || "")
    .replaceAll("{payload.eventId}", body.eventId || systemRequestId)
    .replaceAll("{payload.membershipId}", body.membershipId || "")
    .replaceAll("{payload.message}", body.message || "")
    .replaceAll("{payload.messageId}", body.messageId || "")
    .replaceAll("{payload.name}", body.name || "")
    .replaceAll("{payload.notificationId}", body.notificationId || "")
    .replaceAll("{payload.phone}", body.phone || "")
    .replaceAll("{payload.plan}", body.plan || "")
    .replaceAll("{payload.professionalId}", body.professionalId || "")
    .replaceAll("{payload.sourcePage}", body.sourcePage || "")
    .replaceAll("{payload.ticketId}", body.ticketId || "")
    .replaceAll("{query.session_id}", query.session_id || "")
    .replaceAll("{route.path}", route?.path || "");
}

export function resolveObject(value, requestContext, route) {
  if (Array.isArray(value)) {
    return value.map((item) => resolveObject(item, requestContext, route));
  }

  if (value && typeof value === "object") {
    const next = {};
    for (const [key, inner] of Object.entries(value)) {
      next[key] = resolveObject(inner, requestContext, route);
    }
    return next;
  }

  return resolveTemplate(value, requestContext, route);
}

/* ------------------------------------------
 * Internal Utilities
 * ------------------------------------------ */

function readField(record, fieldName) {
  const parts = String(fieldName || "").split(".");
  let cursor = record;

  for (const part of parts) {
    if (cursor == null || typeof cursor !== "object") {
      return undefined;
    }

    cursor = cursor[part];
  }

  return cursor;
}

function stripLeadingSlash(value) {
  return String(value || "").replace(/^\/+/, "");
}
