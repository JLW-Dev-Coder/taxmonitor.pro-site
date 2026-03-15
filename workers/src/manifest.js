/* ------------------------------------------
 * Router
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

const HANDLER_BY_CONTRACT = {
  "tmp.auth.session.get.v1.json": "getAuthSession",
  "tmp.inquiry.create.v1.json": "createInquiry",
  "tmp.inquiry.get.v1.json": "getInquiry",
  "tmp.membership.free.create.v1.json": "createFreeMembership",
  "tmp.membership.pricing.get.v1.json": "getPricing",
  "tmp.taxpayer-account.get.v1.json": "getTaxpayerAccount",
  "tmp.taxpayer-account.update.v1.json": "patchTaxpayerAccount"
};

export async function buildManifest(env) {
  const objects = await env.R2_BUCKET.list({ prefix: "contracts/" });

  const routes = [];

  for (const object of objects.objects) {
    if (!object.key.endsWith(".json")) continue;

    const contract = await loadContractFromR2(env, object.key);
    assertCanonicalContract(contract, object.key);

    const filename = object.key.split("/").pop();
    const handler = HANDLER_BY_CONTRACT[filename];

    if (!handler) {
      continue;
    }

    routes.push({
      auth: contract.auth,
      contract,
      contractKey: object.key,
      contractName: filename,
      handler,
      method: String(contract.delivery.method || "").toUpperCase(),
      path: normalizeContractPath(contract.delivery.endpoint),
      source: contract.contract.source,
      title: contract.contract.title,
      usedOnPages: contract.contract.usedOnPages || []
    });
  }

  routes.sort((a, b) => {
    const left = `${a.method} ${a.path}`;
    const right = `${b.method} ${b.path}`;
    return left.localeCompare(right);
  });

  return routes;
}

export function findRoute(routes, method, pathname) {
  for (const route of routes) {
    const match = matchPath(route.path, pathname);
    if (route.method === method && match.matched) {
      return {
        ...route,
        params: match.params
      };
    }
  }

  return null;
}

export function listRoutes(routes) {
  return [...routes];
}

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

async function loadContractFromR2(env, key) {
  const object = await env.R2_BUCKET.get(key);

  if (!object) {
    throw new Error(`Missing contract object: ${key}`);
  }

  return await object.json();
}

function assertCanonicalContract(contract, key) {
  const missing = REQUIRED_TOP_LEVEL_SECTIONS.filter(
    (section) => !Object.prototype.hasOwnProperty.call(contract, section)
  );

  if (missing.length > 0) {
    throw new Error(
      `Contract ${key} is missing required top-level sections: ${missing.join(", ")}`
    );
  }

  if (!contract.contract?.usedOnPages) {
    throw new Error(`Contract ${key} is missing contract.usedOnPages`);
  }

  if (!contract.delivery?.endpoint || !contract.delivery?.method) {
    throw new Error(`Contract ${key} is missing delivery.endpoint or delivery.method`);
  }
}

function matchPath(routePath, actualPath) {
  const routeParts = normalizePath(routePath).split("/");
  const actualParts = normalizePath(actualPath).split("/");

  if (routeParts.length !== actualParts.length) {
    return { matched: false, params: {} };
  }

  const params = {};

  for (let i = 0; i < routeParts.length; i += 1) {
    const routePart = routeParts[i];
    const actualPart = actualParts[i];

    if (routePart.startsWith("{") && routePart.endsWith("}")) {
      params[routePart.slice(1, -1)] = actualPart;
      continue;
    }

    if (routePart !== actualPart) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}

function normalizeContractPath(pathname) {
  return normalizePath(String(pathname || ""));
}

function normalizePath(pathname) {
  const value = String(pathname || "")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");

  return value || "/";
}