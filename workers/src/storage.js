/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

export async function executeWritePipeline({
  contract,
  env,
  requestContext
}) {
  const effects = contract.effects || {};
  const writeOrder = effects.writeOrder || [];

  const result = {
    canonicalRecord: null,
    receiptKey: null
  };

  for (const step of writeOrder) {

    if (step === "receiptAppend") {
      const receipt = await appendReceipt({
        contract,
        env,
        requestContext
      });

      result.receiptKey = receipt.key;
    }

    if (step === "canonicalUpsert") {
      const canonical = await upsertCanonicalRecord({
        contract,
        env,
        requestContext
      });

      result.canonicalRecord = canonical;
    }
  }

  return result;
}

/* ------------------------------------------
 * Receipt Storage
 * ------------------------------------------ */

async function appendReceipt({
  contract,
  env,
  requestContext
}) {

  const pattern = contract.delivery?.receiptKeyPattern;
  if (!pattern) {
    throw new Error("Contract missing delivery.receiptKeyPattern");
  }

  const key = resolveTemplate(pattern, requestContext);

  const receipt = {
    body: requestContext.body,
    method: requestContext.method,
    params: requestContext.params,
    query: requestContext.query,
    receivedAt: new Date().toISOString(),
    route: contract.delivery.endpoint
  };

  await env.R2_BUCKET.put(
    key,
    JSON.stringify(receipt, null, 2),
    {
      httpMetadata: {
        contentType: "application/json"
      }
    }
  );

  return { key };
}

/* ------------------------------------------
 * Canonical Storage
 * ------------------------------------------ */

async function upsertCanonicalRecord({
  contract,
  env,
  requestContext
}) {

  const canonical = contract.effects?.canonicalUpsert;
  if (!canonical) {
    throw new Error("Contract missing effects.canonicalUpsert");
  }

  const targetPattern = canonical.target;
  const recordKey = resolveTemplate(targetPattern, requestContext);

  let existing = null;

  const existingObject = await env.R2_BUCKET.get(recordKey);
  if (existingObject) {
    existing = await existingObject.json();
  }

  const patch = resolvePatch(
    contract.effects?.canonicalPatch || {},
    requestContext
  );

  const nextRecord = {
    ...(existing || {}),
    ...patch
  };

  await env.R2_BUCKET.put(
    recordKey,
    JSON.stringify(nextRecord, null, 2),
    {
      httpMetadata: {
        contentType: "application/json"
      }
    }
  );

  return {
    key: recordKey,
    record: nextRecord
  };
}

/* ------------------------------------------
 * Template Resolution
 * ------------------------------------------ */

function resolveTemplate(template, ctx) {
  if (!template) return "";

  return template
    .replace("{payload.eventId}", ctx.body?.eventId || "")
    .replace("{params.account_id}", ctx.params?.account_id || "")
    .replace("{params.inquiry_id}", ctx.params?.inquiry_id || "")
    .replace("{recordId}", ctx.body?.eventId || "")
    .replace("{system.nowIso}", new Date().toISOString());
}

function resolvePatch(patch, ctx) {

  const resolved = {};

  for (const [key, value] of Object.entries(patch)) {

    if (typeof value !== "string") {
      resolved[key] = value;
      continue;
    }

    resolved[key] = value
      .replace("{payload.accountId}", ctx.body?.accountId || "")
      .replace("{payload.email}", ctx.body?.email || "")
      .replace("{payload.eventId}", ctx.body?.eventId || "")
      .replace("{payload.message}", ctx.body?.message || "")
      .replace("{payload.name}", ctx.body?.name || "")
      .replace("{payload.phone}", ctx.body?.phone || "")
      .replace("{payload.professionalId}", ctx.body?.professionalId || "")
      .replace("{payload.sourcePage}", ctx.body?.sourcePage || "")
      .replace("{system.nowIso}", new Date().toISOString());
  }

  return resolved;
}