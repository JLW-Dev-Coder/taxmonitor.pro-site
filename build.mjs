// build.mjs
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const APP_DIR = path.join(process.cwd(), "app");
const APP_PARTIALS_DIR = path.join(APP_DIR, "partials");
const ASSETS_DIR = path.join(process.cwd(), "assets");
const BUILD_TARGET = (process.env.BUILD_TARGET || "site").toLowerCase(); // "app" | "site"
const CONTRACTS_DIR = path.join(process.cwd(), "contracts");
const DIRECTORY_DIR = path.join(process.cwd(), "directory");
const DIST_DIR = path.join(process.cwd(), "dist");
const LEGAL_DIR = path.join(process.cwd(), "legal");
const PAGES_PARTIALS_DIR = path.join(process.cwd(), "partials", "pages");
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

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  if (await exists(DIST_DIR)) {
    await rm(DIST_DIR, { force: true, recursive: true });
  }

  await mkdir(DIST_DIR, { recursive: true });
}

async function copyDirContentsToDistRoot(srcDir) {
  if (!(await exists(srcDir))) return;

  const entries = await readdir(srcDir, { withFileTypes: true });

  for (const e of entries) {
    const dest = path.join(DIST_DIR, e.name);
    const src = path.join(srcDir, e.name);
    await cp(src, dest, { recursive: e.isDirectory() });
  }
}

async function copyDirIfExists(srcDir, destSubdir) {
  if (!(await exists(srcDir))) return;

  const destDir = destSubdir ? path.join(DIST_DIR, destSubdir) : DIST_DIR;
  await mkdir(destDir, { recursive: true });
  await cp(srcDir, destDir, { recursive: true });
}

function injectApp(html, sidebar, topbar) {
  return html
    .replace(/<!--\s*APP_SIDEBAR\s*-->/g, sidebar)
    .replace(/<!--\s*APP_TOPBAR\s*-->/g, topbar);
}

function injectPagePartials(html, pagePartials) {
  if (!pagePartials || pagePartials.size === 0) return html;

  for (const [key, partialHtml] of pagePartials.entries()) {
    const re1 = new RegExp(`<!--\\s*PARTIAL:pages\\/${escapeRegExp(key)}\\s*-->`, "g");
    const re2 = new RegExp(`<!--\\s*PARTIAL:page:${escapeRegExp(key)}\\s*-->`, "g");
    html = html.replace(re1, partialHtml).replace(re2, partialHtml);
  }

  return html;
}

function injectSite(html, footer, header) {
  return html
    .replace(/<!--\s*PARTIAL:footer\s*-->/g, footer)
    .replace(/<!--\s*PARTIAL:header\s*-->/g, header);
}

async function loadPagePartials() {
  const map = new Map();

  if (!(await exists(PAGES_PARTIALS_DIR))) return map;

  const entries = await readdir(PAGES_PARTIALS_DIR, { withFileTypes: true });

  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.endsWith(".html")) continue;

    const full = path.join(PAGES_PARTIALS_DIR, e.name);
    const html = await readFile(full, "utf8");
    const key = path.basename(e.name, ".html");

    map.set(key, html);
  }

  return map;
}

async function injectAppPartialsIntoTree({ distBaseDir, pagePartials, skipPartialsDirName, sourceDir }) {
  if (!(await exists(APP_PARTIALS_DIR))) return;

  const sidebarPath = path.join(APP_PARTIALS_DIR, "sidebar.html");
  const topbarPath = path.join(APP_PARTIALS_DIR, "topbar.html");

  if (!(await exists(sidebarPath)) || !(await exists(topbarPath))) return;

  const files = (await walk(sourceDir)).filter((f) => f.endsWith(".html"));
  const sidebar = await readFile(sidebarPath, "utf8");
  const topbar = await readFile(topbarPath, "utf8");

  for (const filePath of files) {
    if (skipPartialsDirName && filePath.includes(`${path.sep}${skipPartialsDirName}${path.sep}`)) {
      continue;
    }

    const html = await readFile(filePath, "utf8");
    const out = injectPagePartials(injectApp(html, sidebar, topbar), pagePartials);
    const relative = path.relative(sourceDir, filePath);
    const destPath = path.join(distBaseDir, relative);

    await mkdir(path.dirname(destPath), { recursive: true });
    await writeFile(destPath, out, "utf8");
  }
}

async function injectSitePartialsIntoTree({ distBaseDir, pagePartials, skipPartialsDirName, sourceDir }) {
  if (!(await exists(SITE_PARTIALS_DIR))) return;

  const footerPath = path.join(SITE_PARTIALS_DIR, "footer.html");
  const headerPath = path.join(SITE_PARTIALS_DIR, "header.html");

  if (!(await exists(footerPath)) || !(await exists(headerPath))) return;

  const files = (await walk(sourceDir)).filter((f) => f.endsWith(".html"));
  const footer = await readFile(footerPath, "utf8");
  const header = await readFile(headerPath, "utf8");

  for (const filePath of files) {
    if (skipPartialsDirName && filePath.includes(`${path.sep}${skipPartialsDirName}${path.sep}`)) {
      continue;
    }

    const html = await readFile(filePath, "utf8");
    const out = injectPagePartials(injectSite(html, footer, header), pagePartials);
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

    const dest = path.join(DIST_DIR, e.name);
    const src = path.join(SITE_DIR, e.name);

    if (e.isFile() && e.name.endsWith(".html")) continue;

    await cp(src, dest, { recursive: e.isDirectory() });
  }
}

async function main() {
  await cleanDist();

  const pagePartials = await loadPagePartials();

  // Always copy shared root/public assets.
  // This includes the full /assets tree recursively, including /assets/images/*
  await copyDirContentsToDistRoot(PUBLIC_DIR);
  await copyDirIfExists(ASSETS_DIR, "assets");
  await copyDirIfExists(CONTRACTS_DIR, "contracts");
  await copyDirIfExists(LEGAL_DIR, "legal");
  await copyDirIfExists(STYLES_DIR, "styles");

  if (await exists(REDIRECTS_SRC)) {
    await cp(REDIRECTS_SRC, REDIRECTS_DEST);
  }

  if (BUILD_TARGET === "app") {
    // Build /app into dist root
    await copyDirIfExists(APP_DIR, null);

    await injectAppPartialsIntoTree({
      distBaseDir: DIST_DIR,
      pagePartials,
      skipPartialsDirName: "partials",
      sourceDir: APP_DIR,
    });

    return;
  }

  // Default SITE build:
  // - site HTML goes to dist root
  // - site non-HTML assets go to dist root
  // - app remains available under /app
  // - directory remains available under /directory
  await copySiteNonHtmlToDistRoot();

  await injectSitePartialsIntoTree({
    distBaseDir: DIST_DIR,
    pagePartials,
    skipPartialsDirName: "partials",
    sourceDir: SITE_DIR,
  });

  // Copy and render /app
  const distAppDir = path.join(DIST_DIR, "app");
  await copyDirIfExists(APP_DIR, "app");

  await injectAppPartialsIntoTree({
    distBaseDir: distAppDir,
    pagePartials,
    skipPartialsDirName: "partials",
    sourceDir: APP_DIR,
  });

  // Copy and render /directory
  const distDirectoryDir = path.join(DIST_DIR, "directory");
  await copyDirIfExists(DIRECTORY_DIR, "directory");

  await injectSitePartialsIntoTree({
    distBaseDir: distDirectoryDir,
    pagePartials,
    skipPartialsDirName: null,
    sourceDir: DIRECTORY_DIR,
  });
}

await main();
