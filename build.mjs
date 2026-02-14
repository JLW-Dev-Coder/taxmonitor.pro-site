// build.mjs
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const APP_DIR = path.join(process.cwd(), "app");
const APP_PARTIALS_DIR = path.join(APP_DIR, "partials");
const ASSETS_DIR = path.join(process.cwd(), "assets");
const BUILD_TARGET = (process.env.BUILD_TARGET || "site").toLowerCase(); // "app" | "site"
const DIST_DIR = path.join(process.cwd(), "dist");
const LEGAL_DIR = path.join(process.cwd(), "legal");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const REDIRECTS_DEST = path.join(DIST_DIR, "_redirects");
const REDIRECTS_SRC = path.join(process.cwd(), "_redirects");
const SITE_DIR = path.join(process.cwd(), "site");
const SITE_PARTIALS_DIR = path.join(SITE_DIR, "partials");
const STYLES_DIR = path.join(process.cwd(), "styles");

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

async function cleanDist() {
  if (await exists(DIST_DIR)) await rm(DIST_DIR, { force: true, recursive: true });
  await mkdir(DIST_DIR, { recursive: true });
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

function injectSite(html, header, footer) {
  return html
    .replace(/<!--\s*PARTIAL:header\s*-->/g, header)
    .replace(/<!--\s*PARTIAL:footer\s*-->/g, footer);
}

function injectApp(html, sidebar, topbar) {
  return html
    .replace(/<!--\s*APP_SIDEBAR\s*-->/g, sidebar)
    .replace(/<!--\s*APP_TOPBAR\s*-->/g, topbar);
}

async function injectSitePartialsIntoTree({ distBaseDir, skipPartialsDirName, sourceDir }) {
  if (!(await exists(SITE_PARTIALS_DIR))) return;

  const footerPath = path.join(SITE_PARTIALS_DIR, "footer.html");
  const headerPath = path.join(SITE_PARTIALS_DIR, "header.html");

  if (!(await exists(footerPath)) || !(await exists(headerPath))) return;

  const footer = await readFile(footerPath, "utf8");
  const header = await readFile(headerPath, "utf8");

  const files = (await walk(sourceDir)).filter((f) => f.endsWith(".html"));

  for (const filePath of files) {
    if (skipPartialsDirName && filePath.includes(`${path.sep}${skipPartialsDirName}${path.sep}`)) continue;

    const html = await readFile(filePath, "utf8");
    const out = injectSite(html, header, footer);

    const relative = path.relative(sourceDir, filePath);
    const destPath = path.join(distBaseDir, relative);

    await mkdir(path.dirname(destPath), { recursive: true });
    await writeFile(destPath, out, "utf8");
  }
}

async function injectAppPartialsIntoTree({ distBaseDir, skipPartialsDirName, sourceDir }) {
  if (!(await exists(APP_PARTIALS_DIR))) return;

  const sidebarPath = path.join(APP_PARTIALS_DIR, "sidebar.html");
  const topbarPath = path.join(APP_PARTIALS_DIR, "topbar.html");

  if (!(await exists(sidebarPath)) || !(await exists(topbarPath))) return;

  const sidebar = await readFile(sidebarPath, "utf8");
  const topbar = await readFile(topbarPath, "utf8");

  const files = (await walk(sourceDir)).filter((f) => f.endsWith(".html"));

  for (const filePath of files) {
    if (skipPartialsDirName && filePath.includes(`${path.sep}${skipPartialsDirName}${path.sep}`)) continue;

    const html = await readFile(filePath, "utf8");
    const out = injectApp(html, sidebar, topbar);

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

async function main() {
  await cleanDist();

  // Always copy public root stuff (/_sdk, etc.)
  await copyDirContentsToDistRoot(PUBLIC_DIR);

  // Always copy shared top-level folders
  await copyDirIfExists(ASSETS_DIR, "assets");
  await copyDirIfExists(LEGAL_DIR, "legal");
  await copyDirIfExists(STYLES_DIR, "styles");

  // Redirects -> dist root
  if (await exists(REDIRECTS_SRC)) await cp(REDIRECTS_SRC, REDIRECTS_DEST);

  if (BUILD_TARGET === "app") {
    // Build APP into dist root so app.taxmonitor.pro/ loads the app
    await copyDirIfExists(APP_DIR, null);

    // ✅ FIX: inject into DIST_DIR (not dist/app) because app is at dist root
    await injectAppPartialsIntoTree({
      distBaseDir: DIST_DIR,
      skipPartialsDirName: "partials",
      sourceDir: APP_DIR,
    });

    return;
  }

  // Default: build SITE into dist root so taxmonitor.pro/ loads marketing
  await copySiteNonHtmlToDistRoot();

  // Inject site partials into site HTML (skip site/partials/)
  await injectSitePartialsIntoTree({
    distBaseDir: DIST_DIR,
    skipPartialsDirName: "partials",
    sourceDir: SITE_DIR,
  });

  // Also include app under /app for the marketing domain (keeps old paths working)
  const distAppDir = path.join(DIST_DIR, "app");
  await copyDirIfExists(APP_DIR, "app");

  // Inject app partials into the copied app HTML (skip app/partials/)
  await injectAppPartialsIntoTree({
    distBaseDir: distAppDir,
    skipPartialsDirName: "partials",
    sourceDir: APP_DIR,
  });
}

await main();