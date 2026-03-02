import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');

const SOURCE_SCOPES = [
  { dir: 'site', type: 'site' },
  { dir: 'app', type: 'app' },
  { dir: 'legal', type: 'legal' },
  { dir: 'styles', type: 'styles' },
  { dir: 'assets', type: 'assets' },
  { dir: 'public', type: 'public' },
  { dir: '_redirects', type: 'redirects', file: true },
];

const INTERNAL_REF_ATTR_RE = /\b(?:href|src|action)\s*=\s*(["'])(.*?)\1/gi;
const CSS_URL_RE = /url\(([^)]+)\)/gi;
const FORM_TAG_RE = /<form\b[^>]*>/gi;

function toPosix(p) {
  return p.split(path.sep).join('/');
}

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
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function isExternalRef(ref) {
  const lower = ref.toLowerCase();
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('//') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('#')
  );
}

function cleanRef(rawRef) {
  return rawRef.trim().replace(/^['"]|['"]$/g, '').split('#')[0].split('?')[0].trim();
}

function normalizeDirRef(ref) {
  if (!ref) return ref;
  if (ref.endsWith('/')) return `${ref}index.html`;
  if (path.extname(ref)) return ref;
  return `${ref}.html`;
}

function resolveSourceRef(ref, sourceFile) {
  const sourceDir = path.dirname(sourceFile);
  if (ref.startsWith('/')) {
    const absolute = normalizeDirRef(ref.slice(1));
    return path.join(ROOT, absolute);
  }
  const relative = normalizeDirRef(ref);
  return path.resolve(sourceDir, relative);
}

function resolveDistRef(ref, distOrigin) {
  if (ref.startsWith('/')) return path.join(DIST_DIR, normalizeDirRef(ref.slice(1)));
  return path.resolve(path.dirname(distOrigin), normalizeDirRef(ref));
}

async function collectSourceFiles() {
  const files = [];
  for (const scope of SOURCE_SCOPES) {
    if (scope.file) {
      const f = path.join(ROOT, scope.dir);
      if (await exists(f)) files.push(f);
      continue;
    }
    const dir = path.join(ROOT, scope.dir);
    if (!(await exists(dir))) continue;
    files.push(...(await walk(dir)));
  }
  return files;
}

function expectedDistPathFromSource(rel) {
  if (rel.startsWith('site/')) return rel.slice('site/'.length);
  if (rel.startsWith('app/')) return path.posix.join('app', rel.slice('app/'.length));
  if (rel.startsWith('legal/')) return path.posix.join('legal', rel.slice('legal/'.length));
  return null;
}

function isRoutableHtml(rel) {
  if (!rel.endsWith('.html')) return false;
  if (rel.startsWith('site/partials/')) return false;
  if (rel.startsWith('app/partials/')) return false;
  return rel.startsWith('site/') || rel.startsWith('app/') || rel.startsWith('legal/');
}

async function runBuild() {
  const { spawn } = await import('node:child_process');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['build.mjs'], { stdio: 'inherit', cwd: ROOT });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build failed (${code})`))));
  });
}

function extractFormIssues(content, fileRel) {
  const issues = [];
  for (const formTag of content.match(FORM_TAG_RE) || []) {
    const methodMatch = /\bmethod\s*=\s*(["'])(.*?)\1/i.exec(formTag);
    const actionMatch = /\baction\s*=\s*(["'])(.*?)\1/i.exec(formTag);
    const method = methodMatch?.[2]?.toLowerCase() ?? '';
    if (method !== 'post') continue;
    const action = actionMatch?.[2] ?? '';
    const valid = action.startsWith('https://api.taxmonitor.pro/forms/');
    if (!valid) {
      issues.push({
        file: fileRel,
        formTag,
        method: method || null,
        action: action || null,
        reason: 'POST form action must be absolute https://api.taxmonitor.pro/forms/*',
      });
    }
  }
  return issues;
}

async function main() {
  await mkdir(path.join(ROOT, 'audit'), { recursive: true });
  await runBuild();

  const sourceFilesAbs = await collectSourceFiles();
  const sourceFilesRel = sourceFilesAbs.map((f) => toPosix(path.relative(ROOT, f))).sort();

  const distFilesAbs = (await exists(DIST_DIR)) ? await walk(DIST_DIR) : [];
  const distFilesRel = distFilesAbs.map((f) => toPosix(path.relative(ROOT, f))).sort();

  const expectedPages = sourceFilesRel.filter(isRoutableHtml).map((rel) => ({
    source: rel,
    dist: expectedDistPathFromSource(rel),
  }));

  const missingDistPages = [];
  for (const page of expectedPages) {
    if (!page.dist) continue;
    const distRel = toPosix(path.join('dist', page.dist));
    if (!distFilesRel.includes(distRel)) missingDistPages.push(page);
  }

  const references = [];
  const missingReferences = [];
  const formIssues = [];

  for (const abs of sourceFilesAbs) {
    const rel = toPosix(path.relative(ROOT, abs));
    const ext = path.extname(abs).toLowerCase();
    if (!['.html', '.css', '.js', '.mjs'].includes(ext)) continue;

    const content = await readFile(abs, 'utf8');
    if (ext === '.html') formIssues.push(...extractFormIssues(content, rel));

    const refMatches = [];
    if (ext === '.css') {
      for (const match of content.matchAll(CSS_URL_RE)) {
        const raw = (match[1] || '').trim().replace(/^['"]|['"]$/g, '');
        refMatches.push({ attr: 'url()', raw });
      }
    } else {
      for (const match of content.matchAll(INTERNAL_REF_ATTR_RE)) {
        refMatches.push({ attr: 'attr', raw: match[2] });
      }
      for (const match of content.matchAll(CSS_URL_RE)) {
        const raw = (match[1] || '').trim().replace(/^['"]|['"]$/g, '');
        refMatches.push({ attr: 'url()', raw });
      }
    }

    for (const m of refMatches) {
      const cleaned = cleanRef(m.raw);
      if (!cleaned || isExternalRef(cleaned)) continue;

      const srcTarget = resolveSourceRef(cleaned, abs);
      const distOrigin = path.join(DIST_DIR, expectedDistPathFromSource(rel) || rel);
      const distTarget = resolveDistRef(cleaned, distOrigin);
      const sourceExists = await exists(srcTarget);
      const distExists = await exists(distTarget);

      const row = {
        file: rel,
        ref: cleaned,
        sourceTarget: toPosix(path.relative(ROOT, srcTarget)),
        distTarget: toPosix(path.relative(ROOT, distTarget)),
        sourceExists,
        distExists,
      };
      references.push(row);
      if (!sourceExists && !distExists) missingReferences.push(row);
    }
  }

  const redirectsPath = path.join(ROOT, '_redirects');
  const redirectsContent = (await exists(redirectsPath)) ? await readFile(redirectsPath, 'utf8') : '';
  const redirectLines = redirectsContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  const redirectBlockers = redirectLines
    .filter((line) => /^(\/\*\s+\S+\s+200|\/app\/\*\s+\S+\s+200)$/i.test(line))
    .map((line) => ({ line, reason: 'Catch-all rewrite may swallow valid pages' }));

  const blockers = [];
  if (missingReferences.length) blockers.push({ type: 'missing_references', count: missingReferences.length });
  if (missingDistPages.length) blockers.push({ type: 'missing_dist_pages', count: missingDistPages.length });
  if (formIssues.length) blockers.push({ type: 'form_endpoint_violations', count: formIssues.length });
  if (redirectBlockers.length) blockers.push({ type: 'redirect_catch_all', count: redirectBlockers.length });

  const filesJson = {
    generatedAt: new Date().toISOString(),
    sourceFileCount: sourceFilesRel.length,
    distFileCount: distFilesRel.length,
    sourceFiles: sourceFilesRel,
    distFiles: distFilesRel,
  };

  const pagesJson = {
    generatedAt: new Date().toISOString(),
    expectedPages,
    missingDistPages,
  };

  const referencesJson = {
    generatedAt: new Date().toISOString(),
    referenceCount: references.length,
    missingReferenceCount: missingReferences.length,
    missingReferences,
    formIssues,
    redirectBlockers,
  };

  const distCoverage = {
    generatedAt: new Date().toISOString(),
    expectedPageCount: expectedPages.length,
    presentPageCount: expectedPages.length - missingDistPages.length,
    missingPageCount: missingDistPages.length,
    blockerCount: blockers.length,
    blockers,
    status: blockers.length ? 'BLOCKED' : 'READY',
  };

  await writeFile(path.join(ROOT, 'audit', 'files.json'), `${JSON.stringify(filesJson, null, 2)}\n`);
  await writeFile(path.join(ROOT, 'audit', 'pages.json'), `${JSON.stringify(pagesJson, null, 2)}\n`);
  await writeFile(path.join(ROOT, 'audit', 'references.json'), `${JSON.stringify(referencesJson, null, 2)}\n`);
  await writeFile(path.join(ROOT, 'audit', 'dist-coverage.json'), `${JSON.stringify(distCoverage, null, 2)}\n`);

  const lines = [
    '# LAUNCH_READINESS',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Status: **${distCoverage.status}**`,
    '',
    '## Summary',
    `- Source files scanned: ${filesJson.sourceFileCount}`,
    `- Dist files scanned: ${filesJson.distFileCount}`,
    `- Expected routable pages: ${distCoverage.expectedPageCount}`,
    `- Missing routable pages in dist: ${distCoverage.missingPageCount}`,
    `- Missing internal references: ${referencesJson.missingReferenceCount}`,
    `- Form endpoint violations: ${formIssues.length}`,
    `- Redirect catch-all blockers: ${redirectBlockers.length}`,
    '',
    '## Blockers',
  ];

  if (!blockers.length) {
    lines.push('- None');
  } else {
    for (const b of blockers) lines.push(`- ${b.type}: ${b.count}`);
  }

  await writeFile(path.join(ROOT, 'LAUNCH_READINESS.md'), `${lines.join('\n')}\n`);

  console.log(`Audit complete: ${distCoverage.status}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
