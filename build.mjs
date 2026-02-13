// build.mjs
import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");

const APP_DIR = path.join(ROOT, "app");
const ASSETS_DIR = path.join(ROOT, "assets");
const LEGAL_DIR = path.join(ROOT, "legal");
const PUBLIC_DIR = path.join(ROOT, "public");
const SITE_DIR = path.join(ROOT, "site");
const STYLES_DIR = path.join(ROOT, "styles");

const PARTIALS_DIR = path.join(SITE_DIR, "partials");
const REDIRECTS_SRC = path.join(ROOT, "_redirects");
const REDIRECTS_DEST = path.join(DIST_DIR, "_redirects");

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    if (e.isFile()) out.push(full);
  }
  return out;
}

async function copyDirContentsToDistRoot(srcDir) {
  if (!(await exists(srcDir))) return;
  // Copy *contents* of srcDir into dist root
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const e of entries) {
    const src = path.join(srcDir, e.name);
    const dest = path.join(DIST_DIR, e.name);
    await cp(src, dest, { recursive: e.isDirectory() });
  }
}

async function copyDirIfExists(srcDir, destSubdir) {
  if (!(await exists(srcDir))) return;
  const destDir = destSubdir ? path.join(DIST_DIR, destSubdir) : DIST_DIR;
  await mkdir(destDir, { recursive: true });
  await cp(srcDir, destDir, { recursive: true });
}

function inject(html, header, footer) {
  return html
    .replace(/<!--\s*PARTIAL:header\s*-->/g, header)
    .replace(/<!--\s*PARTIAL:footer\s*-->/g, footer);
}

async function injectPartialsIntoTree({ sourceDir, distBaseDir, skipPartialsDirName }) {
  const footer = await readFile(path.join(PARTIALS_DIR, "footer.html"), "utf8");
  const header = await readFile(path.join(PARTIALS_DIR, "header.html"), "utf8");

  const files = (await walk(sourceDir)).filter((f) => f.endsWith(".html"));

  for (const filePath of files) {
    if (skipPartialsDirName && filePath.includes(`${path.sep}${skipPartialsDirName}${path.sep}`)) continue;

    const html = await readFile(filePath, "utf8");
    const out = inject(html, header, footer);

    const relative = path.relative(sourceDir, filePath);
    const destPath = path.join(distBaseDir, relative);

    await mkdir(path.dirname(destPath), { recursive: true });
    await writeFile(destPath, out, "utf8");
  }
}

async function copySiteNonHtmlToDistRoot() {
  // Copy everything in /site into dist root EXCEPT /site/partials and EXCEPT .html files
  const entries = await readdir(SITE_DIR, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "partials") continue;
    const src = path.join(SITE_DIR, e.name);
    const dest = path.join(DIST_DIR, e.name);

    if (e.isFile() && e.name.endsWith(".html")) continue;

    await cp(src, dest, { recursive: e.isDirectory() });
  }
}

async function main() {
  await mkdir(DIST_DIR, { recursive: true });

  // Put root-served stuff in the dist root (/_sdk, /favicon.ico, etc.)
  await copyDirContentsToDistRoot(PUBLIC_DIR);

  // Copy top-level folders as-is
  await copyDirIfExists(ASSETS_DIR, "assets");
  await copyDirIfExists(LEGAL_DIR, "legal");
  await copyDirIfExists(STYLES_DIR, "styles");

  // Copy site non-html assets to dist root (site.js, images, etc.)
  await copySiteNonHtmlToDistRoot();

  // Inject partials into SITE html -> dist root
  await injectPartialsIntoTree({
    sourceDir: SITE_DIR,
    distBaseDir: DIST_DIR,
    skipPartialsDirName: "partials",
  });

  // Inject partials into APP html -> dist/app
  const distAppDir = path.join(DIST_DIR, "app");
  await copyDirIfExists(APP_DIR, "app");
  await injectPartialsIntoTree({
    sourceDir: APP_DIR,
    distBaseDir: distAppDir,
    skipPartialsDirName: null,
  });

  // Redirects -> dist root
  if (await exists(REDIRECTS_SRC)) await cp(REDIRECTS_SRC, REDIRECTS_DEST);
}

await main();
