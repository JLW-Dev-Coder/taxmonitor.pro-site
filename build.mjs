// build.mjs
import { cp, mkdir, readFile, readdir, stat, writeFile, rm } from "node:fs/promises";
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

const BUILD_TARGET = (process.env.BUILD_TARGET || "site").toLowerCase(); // "app" | "site"

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
  if (!(await exists(SITE_DIR))) return;
  const entries = await readdir(SITE_DIR, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "partials") continue;
    const src = path.join(SITE_DIR, e.name);
    const dest = path.join(DIST_DIR, e.name);

    if (e.isFile() && e.name.endsWith(".html")) continue;

    await cp(src, dest, { recursive: e.isDirectory() });
  }
}

async function cleanDist() {
  if (await exists(DIST_DIR)) await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });
}

async function main() {
  await cleanDist();

  // Always copy public root stuff (/_sdk, favicon, etc.)
  await copyDirContentsToDistRoot(PUBLIC_DIR);

  // Always copy shared top-level folders
  await copyDirIfExists(ASSETS_DIR, "assets");
  await copyDirIfExists(LEGAL_DIR, "legal");
  await copyDirIfExists(STYLES_DIR, "styles");

  // Redirects -> dist root (same file for both projects; keep as-is)
  if (await exists(REDIRECTS_SRC)) await cp(REDIRECTS_SRC, REDIRECTS_DEST);

  if (BUILD_TARGET === "app") {
    // Build APP into dist root so app.taxmonitor.pro/ loads the app
    await copyDirIfExists(APP_DIR, null);
    await injectPartialsIntoTree({
      sourceDir: APP_DIR,
      distBaseDir: DIST_DIR,
      skipPartialsDirName: null,
    });
    return;
  }

  // Default: build SITE into dist root so taxmonitor.pro/ loads marketing
  await copySiteNonHtmlToDistRoot();
  await injectPartialsIntoTree({
    sourceDir: SITE_DIR,
    distBaseDir: DIST_DIR,
    skipPartialsDirName: "partials",
  });

  // Also include app under /app for the marketing domain (optional but keeps old paths working)
  const distAppDir = path.join(DIST_DIR, "app");
  await copyDirIfExists(APP_DIR, "app");
  await injectPartialsIntoTree({
    sourceDir: APP_DIR,
    distBaseDir: distAppDir,
    skipPartialsDirName: null,
  });
}

await main();
