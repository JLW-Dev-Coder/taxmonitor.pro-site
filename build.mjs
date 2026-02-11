// build.mjs
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const PARTIALS_DIR = path.join(ROOT, "site", "partials");
const SITE_DIR = path.join(ROOT, "site");

const footer = await readFile(path.join(PARTIALS_DIR, "footer.html"), "utf8");
const header = await readFile(path.join(PARTIALS_DIR, "header.html"), "utf8");

const entries = await readdir(SITE_DIR, { withFileTypes: true });

await Promise.all(
  entries
    .filter((e) => e.isFile() && e.name.endsWith(".html"))
    .map(async (e) => {
      const filePath = path.join(SITE_DIR, e.name);
      const html = await readFile(filePath, "utf8");

      const out = html
        .replace("<!-- PARTIAL:footer -->", footer)
        .replace("<!-- PARTIAL:header -->", header);

      await writeFile(filePath, out, "utf8");
    })
);
