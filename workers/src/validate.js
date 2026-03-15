/* ------------------------------------------
 * Validation
 * ------------------------------------------ */

const REQUIRED_TOP_LEVEL_SECTIONS = [
  "auth",
  "contract",
  "delivery",
  "effects",
  "payload",
  "response",
  "schema"
];

export async function loadContract(env, contractKey) {
  if (!contractKey) {
    throw new Error("Missing contract key.");
  }

  const object = await env.R2_BUCKET.get(contractKey);

  if (!object) {
    throw new Error(`Missing contract object: ${contractKey}`);
  }

  const contract = await object.json();
  assertCanonicalContract(contract, contractKey);

  return contract;
}

export async function normalizeRequest(request, route, url) {
  const contentType = request.headers.get("content-type") || "";
  const method = String(request.method || "").toUpperCase();

  let body = {};

  if (method !== "GET" && method !== "HEAD") {
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      body = {};
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
    url: request.url
  };
}

export function validateAgainstContract({ contract, request }) {
  const errors = [];

  if (!contract) {
    errors.push("Missing contract.");
    return {
      errors,
      ok: false
    };
  }

  validateDelivery(contract, request, errors);
  validateContentType(contract, request, errors);
  validatePayloadShape(contract, request, errors);
  validatePathParams(contract, request, errors);

  if (errors.length > 0) {
    return {
      errors,
      ok: false
    };
  }

  return {
    ok: true,
    value: {
      body: request.body || {},
      headers: request.headers || {},
      method: request.method,
      params: request.params || {},
      query: request.query || {},
      url: request.url
    }
  };
}

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

function assertCanonicalContract(contract, contractKey) {
  const missing = REQUIRED_TOP_LEVEL_SECTIONS.filter(
    (section) => !Object.prototype.hasOwnProperty.call(contract, section)
  );

  if (missing.length > 0) {
    throw new Error(
      `Contract ${contractKey} is missing required top-level sections: ${missing.join(", ")}`
    );
  }

  if (!contract.contract?.usedOnPages) {
    throw new Error(`Contract ${contractKey} is missing contract.usedOnPages`);
  }

  if (!contract.delivery?.endpoint) {
    throw new Error(`Contract ${contractKey} is missing delivery.endpoint`);
  }

  if (!contract.delivery?.method) {
    throw new Error(`Contract ${contractKey} is missing delivery.method`);
  }

  if (!contract.payload?.type) {
    throw new Error(`Contract ${contractKey} is missing payload.type`);
  }

  if (!Array.isArray(contract.payload?.required)) {
    throw new Error(`Contract ${contractKey} is missing payload.required array`);
  }

  if (typeof contract.payload?.properties !== "object" || contract.payload.properties === null) {
    throw new Error(`Contract ${contractKey} is missing payload.properties object`);
  }
}

function validateContentType(contract, request, errors) {
  const requireJsonContentType = Boolean(
    contract?.contract?.validation?.requireJsonContentType
  );

  const method = String(request.method || "").toUpperCase();
  const contentType = String(request.headers?.["content-type"] || "");

  if (!requireJsonContentType) {
    return;
  }

  if (method === "GET" || method === "HEAD") {
    return;
  }

  if (!contentType.includes("application/json")) {
    errors.push("Request content-type must be application/json.");
  }
}

function validateDelivery(contract, request, errors) {
  const expectedMethod = String(contract?.delivery?.method || "").toUpperCase();
  const actualMethod = String(request.method || "").toUpperCase();

  if (expectedMethod !== actualMethod) {
    errors.push(
      `Request method ${actualMethod} does not match contract method ${expectedMethod}.`
    );
  }
}

function validatePathParams(contract, request, errors) {
  const endpoint = String(contract?.delivery?.endpoint || "");
  const pathParamNames = getEndpointParamNames(endpoint);

  for (const name of pathParamNames) {
    const value = request?.params?.[name];
    if (value == null || String(value).trim() === "") {
      errors.push(`Missing required path param: ${name}`);
    }
  }
}

function validatePayloadShape(contract, request, errors) {
  const payload = contract?.payload || {};
  const body = request?.body || {};
  const additionalProperties = Boolean(payload.additionalProperties);
  const properties = payload.properties || {};
  const required = payload.required || [];
  const normalizedBody = normalizeCheckboxesIfEnabled(contract, body);

  request.body = normalizedBody;

  for (const field of required) {
    if (normalizedBody[field] == null || normalizedBody[field] === "") {
      errors.push(`Missing required payload field: ${field}`);
    }
  }

  if (!additionalProperties) {
    for (const key of Object.keys(normalizedBody)) {
      if (!Object.prototype.hasOwnProperty.call(properties, key)) {
        errors.push(`Unknown payload field: ${key}`);
      }
    }
  }

  for (const [field, rule] of Object.entries(properties)) {
    if (!Object.prototype.hasOwnProperty.call(normalizedBody, field)) {
      continue;
    }

    validateField(field, normalizedBody[field], rule || {}, errors);
  }
}

function validateField(field, value, rule, errors) {
  if (value == null) {
    return;
  }

  if (rule.type === "string" && typeof value !== "string") {
    errors.push(`Field ${field} must be a string.`);
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

  if (typeof value === "string") {
    if (typeof rule.minLength === "number" && value.length < rule.minLength) {
      errors.push(`Field ${field} must be at least ${rule.minLength} characters.`);
    }

    if (typeof rule.maxLength === "number" && value.length > rule.maxLength) {
      errors.push(`Field ${field} must be at most ${rule.maxLength} characters.`);
    }

    if (rule.format === "email" && !isValidEmail(value)) {
      errors.push(`Field ${field} must be a valid email address.`);
    }
  }

  if (Array.isArray(rule.enum) && rule.enum.length > 0) {
    const enumStrict = Boolean(rule.enumStrict);

    if (enumStrict) {
      if (!rule.enum.includes(value)) {
        errors.push(`Field ${field} must be one of: ${rule.enum.join(", ")}.`);
      }
      return;
    }

    const lower = String(value).toLowerCase();
    const allowed = rule.enum.map((item) => String(item).toLowerCase());

    if (!allowed.includes(lower)) {
      errors.push(`Field ${field} must be one of: ${rule.enum.join(", ")}.`);
    }
  }
}

function normalizeCheckboxesIfEnabled(contract, body) {
  const enabled = Boolean(
    contract?.contract?.validation?.normalizeCheckboxToBoolean
  );

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

function getEndpointParamNames(endpoint) {
  const matches = String(endpoint || "").match(/\{[^}]+\}/g) || [];
  return matches.map((token) => token.slice(1, -1));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}