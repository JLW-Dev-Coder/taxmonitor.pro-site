import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const templatePath = path.join(
  ROOT,
  "app",
  "contracts",
  "_templates",
  "base.contract.json"
);

const manifestPath = path.join(
  ROOT,
  "app",
  "contracts",
  "contract-manifest.json"
);

if (!fs.existsSync(templatePath)) {
  console.error("Missing base template:", templatePath);
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  console.error("Missing contract manifest:", manifestPath);
  process.exit(1);
}

const baseTemplate = JSON.parse(fs.readFileSync(templatePath, "utf8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function generateContract(entry) {
  const contract = clone(baseTemplate);

  // ----- contract metadata -----

  contract.contract.governs = entry.governs || "";
  contract.contract.title = entry.title || "";
  contract.contract.usedOnPages = entry.usedOnPages || [];
  contract.contract.path = entry.file;

  // ----- delivery -----

  contract.delivery.endpoint = entry.endpoint || "";
  contract.delivery.method = entry.method || "POST";
  contract.delivery.receiptSource = entry.receiptSource || "";

  // ----- effects -----

  contract.effects.writes = entry.writes || [];

  // ----- schema -----

  contract.schema.name = entry.schema || "";

  return contract;
}

let generated = 0;
let skipped = 0;

for (const entry of manifest) {

  if (!entry.file) {
    console.error("Manifest entry missing 'file' field:", entry);
    continue;
  }

  const outputPath = path.join(
    ROOT,
    "app",
    "contracts",
    entry.file
  );

  const contract = generateContract(entry);

  // ensure directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // ----- safety check (prevents clobbering existing contracts) -----

  if (!fs.existsSync(outputPath)) {

    fs.writeFileSync(
      outputPath,
      JSON.stringify(contract, null, 2)
    );

    console.log(`generated ${entry.file}`);
    generated++;

  } else {

    console.log(`skipped existing ${entry.file}`);
    skipped++;

  }

}

console.log("");
console.log("Contract generation complete");
console.log(`generated: ${generated}`);
console.log(`skipped:   ${skipped}`);