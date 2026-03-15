import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const TEMPLATE_PATH = path.join(
  ROOT,
  "app",
  "contracts",
  "_templates",
  "base.contract.json"
);

const MANIFEST_PATH = path.join(
  ROOT,
  "app",
  "contracts",
  "contract-manifest.json"
);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing required file: ${filePath}`);
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Invalid JSON in ${filePath}\n${error.message}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setIfDefined(object, key, value) {
  if (value !== undefined) {
    object[key] = value;
  }
}

function ensureArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

function buildContract(baseTemplate, entry) {
  const contract = clone(baseTemplate);

  if (!entry.file) {
    fail(`Manifest entry is missing "file": ${JSON.stringify(entry, null, 2)}`);
  }

  if (!entry.title) {
    fail(`Manifest entry is missing "title" for ${entry.file}`);
  }

  if (!entry.schema) {
    fail(`Manifest entry is missing "schema" for ${entry.file}`);
  }

  if (!entry.endpoint) {
    fail(`Manifest entry is missing "endpoint" for ${entry.file}`);
  }

  // contract
  contract.contract = contract.contract || {};
  setIfDefined(contract.contract, "authority", entry.authority || contract.contract.authority);
  contract.contract.governs = entry.governs || "";
  contract.contract.path = entry.file;
  contract.contract.source = entry.source || contract.contract.source || "Tax Monitor Pro";
  contract.contract.title = entry.title;
  contract.contract.usedOnPages = ensureArray(entry.usedOnPages, []);

  contract.contract.validation = contract.contract.validation || {};
  if (entry.validation) {
    contract.contract.validation = {
      ...contract.contract.validation,
      ...entry.validation
    };
  }

  setIfDefined(contract.contract, "version", entry.contractVersion || contract.contract.version || 1);

  // schema
  contract.schema = contract.schema || {};
  contract.schema.name = entry.schema;
  setIfDefined(contract.schema, "version", entry.schemaVersion || contract.schema.version || 1);

  // auth
  contract.auth = contract.auth || {};
  if (entry.auth) {
    contract.auth = {
      ...contract.auth,
      ...entry.auth
    };
  }

  // delivery
  contract.delivery = contract.delivery || {};
  contract.delivery.endpoint = entry.endpoint;
  contract.delivery.method = entry.method || contract.delivery.method || "POST";
  setIfDefined(contract.delivery, "eventType", entry.eventType);
  setIfDefined(contract.delivery, "receiptKeyPattern", entry.receiptKeyPattern || contract.delivery.receiptKeyPattern || "");
  setIfDefined(contract.delivery, "receiptSource", entry.receiptSource || contract.delivery.receiptSource || "");
  setIfDefined(contract.delivery, "dedupeKey", entry.dedupeKey);
  setIfDefined(contract.delivery, "writes", ensureArray(entry.deliveryWrites, entry.writes));

  if (entry.signature) {
    contract.delivery.signature = {
      ...(contract.delivery.signature || {}),
      ...entry.signature
    };
  }

  // payload
  contract.payload = contract.payload || {};
  contract.payload.type = entry.payloadType || contract.payload.type || "object";
  setIfDefined(
    contract.payload,
    "additionalProperties",
    entry.additionalProperties !== undefined
      ? entry.additionalProperties
      : contract.payload.additionalProperties
  );
  contract.payload.required = ensureArray(entry.required, contract.payload.required || []);
  contract.payload.properties = entry.properties || contract.payload.properties || {};

  // effects
  contract.effects = contract.effects || {};
  if (entry.effects) {
    contract.effects = {
      ...contract.effects,
      ...entry.effects
    };
  }

  setIfDefined(contract.effects, "dedupeKey", entry.effectsDedupeKey);
  setIfDefined(contract.effects, "eventIdFrom", entry.eventIdFrom);
  setIfDefined(contract.effects, "writes", ensureArray(entry.writes, contract.effects.writes || []));

  if (entry.receiptTo) {
    contract.effects.receiptAppend = {
      ...(contract.effects.receiptAppend || {}),
      to: entry.receiptTo
    };
  }

  if (entry.canonicalTarget) {
    contract.effects.canonicalUpsert = {
      ...(contract.effects.canonicalUpsert || {}),
      target: entry.canonicalTarget
    };
  }

  if (entry.writeOrder) {
    contract.effects.writeOrder = entry.writeOrder;
  }

  // response
  if (entry.response) {
    contract.response = {
      ...(contract.response || {}),
      ...entry.response
    };
  }

  // optional top-level blocks for richer contracts
  if (entry.clickupProjection !== undefined) {
    contract.clickupProjection = entry.clickupProjection;
  }

  if (entry.indexProjection !== undefined) {
    contract.indexProjection = entry.indexProjection;
  }

  if (entry.notes !== undefined) {
    contract.notes = entry.notes;
  }

  return contract;
}

function validateManifest(manifest) {
  if (!Array.isArray(manifest)) {
    fail("contract-manifest.json must be a JSON array");
  }

  const seenFiles = new Set();
  const seenRouteKeys = new Set();
  const seenSchemas = new Set();

  for (const entry of manifest) {
    if (!entry.file) {
      fail(`Manifest entry missing "file": ${JSON.stringify(entry, null, 2)}`);
    }

    const routeKey = `${entry.method || "POST"} ${entry.endpoint || ""}`;

    if (seenFiles.has(entry.file)) {
      fail(`Duplicate manifest file entry: ${entry.file}`);
    }
    seenFiles.add(entry.file);

    if (entry.endpoint) {
      if (seenRouteKeys.has(routeKey)) {
        fail(`Duplicate manifest route entry: ${routeKey}`);
      }
      seenRouteKeys.add(routeKey);
    }

    if (entry.schema) {
      if (seenSchemas.has(entry.schema)) {
        fail(`Duplicate manifest schema entry: ${entry.schema}`);
      }
      seenSchemas.add(entry.schema);
    }
  }
}

const baseTemplate = readJson(TEMPLATE_PATH);
const manifest = readJson(MANIFEST_PATH);

validateManifest(manifest);

let generated = 0;

for (const entry of manifest) {
  const outputPath = path.join(ROOT, "app", "contracts", entry.file);
  const contract = buildContract(baseTemplate, entry);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(contract, null, 2) + "\n");

  console.log(`generated ${entry.file}`);
  generated++;
}

console.log("");
console.log("Contract generation complete");
console.log(`generated: ${generated}`);
console.log("skipped:   0");
console.log("mode:      overwrite");