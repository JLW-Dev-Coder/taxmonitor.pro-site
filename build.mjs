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

async function copyDirIfExists(srcDir, destSubdir) {
  if (!(await exists(srcDir))) return;
  const destDir = path.join(DIST_DIR, destSubdir);
  await mkdir(destDir, { recursive: true });
  await cp(srcDir, destDir, { recursive: true });
}

async function copySiteAssetsToDistRoot() {
  // Copy everything in /site into dist root EXCEPT /site/partials
  const entries = await readdir(SITE_DIR, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "partials") continue;
    const src = path.join(SITE_DIR, e.name);
    const dest = path.join(DIST_DIR, e.name);
    await cp(src, dest, { recursive: e.isDirectory() });
  }
}

async function injectSitePartials() {
  const footer = await readFile(path.join(PARTIALS_DIR, "footer.html"), "utf8");
  const header = await readFile(path.join(PARTIALS_DIR, "header.html"), "utf8");

  const files = (await walk(SITE_DIR)).filter((f) => f.endsWith(".html"));

  for (const filePath of files) {
    if (filePath.includes(`${path.sep}partials${path.sep}`)) continue;

    const html = await readFile(filePath, "utf8");
    const out = html
      .replace("<!-- PARTIAL:footer -->", footer)
      .replace("<!-- PARTIAL:header -->", header);

    // IMPORTANT: write to dist root (not dist/site)
    const relative = path.relative(SITE_DIR, filePath);
    const destPath = path.join(DIST_DIR, relative);
    await mkdir(path.dirname(destPath), { recursive: true });
    await writeFile(destPath, out, "utf8");
  }
}

async function main() {
  await mkdir(DIST_DIR, { recursive: true });

  await copyDirIfExists(APP_DIR, "app");
  await copyDirIfExists(ASSETS_DIR, "assets");
  await copyDirIfExists(LEGAL_DIR, "legal");
  await copyDirIfExists(PUBLIC_DIR, "public");
  await copyDirIfExists(STYLES_DIR, "styles");

  // Site assets (site.js, etc.) -> dist root
  await copySiteAssetsToDistRoot();

  // Then overwrite site HTML with injected header/footer
  await injectSitePartials();

  // Redirects -> dist root
  if (await exists(REDIRECTS_SRC)) await cp(REDIRECTS_SRC, REDIRECTS_DEST);
}

await main();
