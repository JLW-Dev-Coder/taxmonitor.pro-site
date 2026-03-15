/* ------------------------------------------
 * Validation
 * ------------------------------------------ */

const REQUIRED_CANONICAL_TOP_LEVEL_SECTIONS = [
  "auth",
  "contract",
  "delivery",
  "effects",
  "payload",
  "response",
  "schema"
];

export async function loadContract(env, route) {
  if (!route?.contractKey) {
    return null;
  }

  const object = await env.R2_BUCKET.get(route.contractKey);

  if (!object) {
    return buildFallbackContract(route);
  }

  const json = await object.json();

  if (isCanonicalContract(json)) {
    assertCanonicalContract(json, route.contractKey);
    return json;
  }

  if (isLegacyContract(json)) {
    return normalizeLegacyContract(json, route);
  }

  return buildFallbackContract(route);
}

export async function normalizeRequest(request, route, url) {
  const contentType = request.headers.get("content-type") || "";
  const method = String(request.method || "").toUpperCase();
  const rawBody = method === "GET" || method === "HEAD" ? "" : await request.text();

  let body = {};

  if (rawBody) {
    if (contentType.includes("application/json")) {
      body = safeJsonParse(rawBody);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      body = Object.fromEntries(new URLSearchParams(rawBody).entries());
    } else {
      body = { raw: rawBody };
    }
  }

  const query = {};
  for (const [key, value] of url.searchParams.entries()) {
    query[key] = value;
  }

  return {
    body,
    headers: Object.fromEntries(request.headers.entries()),
    method,
    params: route?.params || {},
    query,
    rawBody,
    url: request.url
  };
}

export function validateAgainstContract({ contract, request, route }) {
  if (!contract) {
    return {
      ok: true,
      value: request
    };
  }

  const errors = [];

  validateContractMethod(contract, request, errors);
  validateContentType(contract, request, errors);
  validateEndpointParams(contract, request, errors);
  validatePayload(contract, request, errors);
  validateQuery(contract, request, errors);

  if (errors.length > 0) {
    return {
      errors,
      ok: false
    };
  }

  return {
    ok: true,
    value: {
      ...request,
      contract,
      route
    }
  };
}

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

function assertCanonicalContract(contract, contractKey) {
  const missing = REQUIRED_CANONICAL_TOP_LEVEL_SECTIONS.filter(
    (section) => !Object.prototype.hasOwnProperty.call(contract, section)
  );

  if (missing.length > 0) {
    throw new Error(
      `Contract ${contractKey} is missing required top-level sections: ${missing.join(", ")}`
    );
  }

  if (!Array.isArray(contract.contract?.usedOnPages)) {
    throw new Error(`Contract ${contractKey} is missing contract.usedOnPages array`);
  }

  if (!contract.delivery?.endpoint || !contract.delivery?.method) {
    throw new Error(`Contract ${contractKey} is missing delivery.endpoint or delivery.method`);
  }

  if (!Array.isArray(contract.payload?.required)) {
    throw new Error(`Contract ${contractKey} is missing payload.required array`);
  }

  if (typeof contract.payload?.properties !== "object" || contract.payload.properties === null) {
    throw new Error(`Contract ${contractKey} is missing payload.properties object`);
  }
}

function buildFallbackContract(route) {
  return {
    auth: {
      required: route.visibility !== "public",
      trustClientIdentityFields: false,
      type: route.visibility === "public" ? "none" : "session"
    },
    contract: {
      authority: ["R2_TMP_CANONICAL"],
      governs: `Fallback contract for ${route.method} ${route.path}`,
      path: route.contractKey || "",
      source: "Tax Monitor Pro",
      title: `Fallback — ${route.method} ${route.path}`,
      usedOnPages: [],
      validation: {
        enumStrict: false,
        rejectUnknownValues: false,
        requireJsonContentType: route.method !== "GET"
      },
      version: 1
    },
    delivery: {
      endpoint: route.path,
      method: route.method,
      receiptKeyPattern: `receipts/tmp/fallback/{eventId}.json`,
      receiptSource: "tmp_fallback",
      signature: {
        header: null,
        required: false,
        secretEnvVar: null
      }
    },
    effects: {
      dedupeKey: "system.requestId",
      eventIdFrom: "system.requestId",
      receiptAppend: {
        to: "receipts/tmp/fallback/{eventId}.json"
      },
      writeOrder: ["receiptAppend"],
      writes: []
    },
    payload: {
      additionalProperties: true,
      properties: {},
      required: [],
      type: "object"
    },
    response: {
      deduped: { ok: true },
      error: { ok: false },
      success: { ok: true }
    },
    schema: {
      name: sanitizeSchemaName(route.path),
      version: 1
    }
  };
}

function isCanonicalContract(value) {
  return REQUIRED_CANONICAL_TOP_LEVEL_SECTIONS.every((key) =>
    Object.prototype.hasOwnProperty.call(value || {}, key)
  );
}

function isLegacyContract(value) {
  return (
    Object.prototype.hasOwnProperty.call(value || {}, "request") &&
    Object.prototype.hasOwnProperty.call(value || {}, "response") &&
    Object.prototype.hasOwnProperty.call(value || {}, "storage")
  );
}

function normalizeLegacyContract(contract, route) {
  return {
    auth: {
      required: route.visibility !== "public",
      trustClientIdentityFields: false,
      type: route.visibility === "public" ? "none" : "session"
    },
    contract: {
      authority: ["R2_TMP_CANONICAL"],
      governs: `Legacy contract for ${route.method} ${route.path}`,
      path: route.contractKey,
      source: "Tax Monitor Pro",
      title: route.contractKey.split("/").pop(),
      usedOnPages: [],
      validation: {
        enumStrict: false,
        rejectUnknownValues: false,
        requireJsonContentType: String(contract.request?.content_type || "").includes("json")
      },
      version: 1
    },
    delivery: {
      endpoint: route.path,
      method: route.method,
      receiptKeyPattern: contract.storage?.receipt_r2 || "receipts/tmp/legacy/{eventId}.json",
      receiptSource: "tmp_legacy_contract",
      signature: {
        header: null,
        required: false,
        secretEnvVar: null
      }
    },
    effects: {
      dedupeKey: "payload.eventId",
      eventIdFrom: "payload.eventId",
      canonicalUpsert: {
        target: firstStorageTarget(contract.storage?.canonical_r2 || [])
      },
      receiptAppend: {
        to: contract.storage?.receipt_r2 || "receipts/tmp/legacy/{eventId}.json"
      },
      writeOrder: ["receiptAppend"],
      writes: []
    },
    payload: {
      additionalProperties: true,
      properties: {},
      required: arrayOrEmpty(contract.request?.body?.required),
      type: "object"
    },
    response: {
      deduped: { ok: true },
      error: { ok: false },
      success: { ok: true }
    },
    schema: {
      name: sanitizeSchemaName(route.path),
      version: 1
    }
  };
}

function validateContractMethod(contract, request, errors) {
  const actual = String(request.method || "").toUpperCase();
  const expected = String(contract.delivery?.method || "").toUpperCase();

  if (actual !== expected) {
    errors.push(`Request method ${actual} does not match contract method ${expected}.`);
  }
}

function validateContentType(contract, request, errors) {
  const requireJson = Boolean(contract.contract?.validation?.requireJsonContentType);
  const method = String(request.method || "").toUpperCase();

  if (!requireJson || method === "GET" || method === "HEAD") {
    return;
  }

  const contentType = String(request.headers?.["content-type"] || "");
  if (!contentType.includes("application/json")) {
    errors.push("Request content-type must be application/json.");
  }
}

function validateEndpointParams(contract, request, errors) {
  const endpoint = String(contract.delivery?.endpoint || "");
  const params = endpoint.match(/\{[^}]+\}/g) || [];

  for (const param of params) {
    const name = param.slice(1, -1);
    const value = request.params?.[name];

    if (value == null || String(value).trim() === "") {
      errors.push(`Missing required path param: ${name}`);
    }
  }
}

function validatePayload(contract, request, errors) {
  const payload = contract.payload || {};
  const body = normalizeCheckboxes(contract, request.body || {});
  const properties = payload.properties || {};
  const required = payload.required || [];

  request.body = body;

  for (const field of required) {
    if (body[field] == null || body[field] === "") {
      errors.push(`Missing required payload field: ${field}`);
    }
  }

  if (payload.additionalProperties === false) {
    for (const key of Object.keys(body)) {
      if (!Object.prototype.hasOwnProperty.call(properties, key)) {
        errors.push(`Unknown payload field: ${key}`);
      }
    }
  }

  for (const [field, rule] of Object.entries(properties)) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      continue;
    }

    validateValue(field, body[field], rule || {}, errors);
  }
}

function validateQuery(contract, request, errors) {
  const requiredQuery = contract.contract?.validation?.requiredQuery || [];

  for (const key of requiredQuery) {
    const value = request.query?.[key];
    if (value == null || String(value).trim() === "") {
      errors.push(`Missing required query field: ${key}`);
    }
  }
}

function validateValue(field, value, rule, errors) {
  if (value == null) {
    return;
  }

  if (rule.type === "boolean" && typeof value !== "boolean") {
    errors.push(`Field ${field} must be a boolean.`);
    return;
  }

  if (rule.type === "integer" && !Number.isInteger(value)) {
    errors.push(`Field ${field} must be an integer.`);
    return;
  }

  if (rule.type === "number" && typeof value !== "number") {
    errors.push(`Field ${field} must be a number.`);
    return;
  }

  if (rule.type === "string" && typeof value !== "string") {
    errors.push(`Field ${field} must be a string.`);
    return;
  }

  if (typeof value === "string") {
    if (typeof rule.minLength === "number" && value.length < rule.minLength) {
      errors.push(`Field ${field} must be at least ${rule.minLength} characters.`);
    }

    if (typeof rule.maxLength === "number" && value.length > rule.maxLength) {
      errors.push(`Field ${field} must be at most ${rule.maxLength} characters.`);
    }

    if (rule.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push(`Field ${field} must be a valid email address.`);
    }
  }

  if (Array.isArray(rule.enum) && rule.enum.length > 0) {
    const strict = rule.enumStrict ?? false;

    if (strict) {
      if (!rule.enum.includes(value)) {
        errors.push(`Field ${field} must be one of: ${rule.enum.join(", ")}.`);
      }
      return;
    }

    const allowed = rule.enum.map((item) => String(item).toLowerCase());
    if (!allowed.includes(String(value).toLowerCase())) {
      errors.push(`Field ${field} must be one of: ${rule.enum.join(", ")}.`);
    }
  }
}

function normalizeCheckboxes(contract, body) {
  const enabled = Boolean(contract.contract?.validation?.normalizeCheckboxToBoolean);

  if (!enabled || body == null || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }

  const next = { ...body };

  for (const [key, value] of Object.entries(next)) {
    if (value === "false") next[key] = false;
    if (value === "on") next[key] = true;
    if (value === "true") next[key] = true;
  }

  return next;
}

function firstStorageTarget(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return "";
  }

  return String(values[0] || "").replace(/^\/?r2\//, "");
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function sanitizeSchemaName(pathname) {
  return String(pathname || "")
    .replace(/[{}]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}
