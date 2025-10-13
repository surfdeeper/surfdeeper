#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
console.warn(
  "[deprecation] validate-threads.ts is deprecated. Use scripts/validate-paths.ts instead.",
);
const GUIDES_DIR = path.join(ROOT, "src/content/guides");
const THREADS_DIR = path.join(ROOT, "src/content/threads");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.isFile() && e.name.endsWith(".md")) files.push(full);
  }
  return files;
}

function collectGuideThreadsWithSources() {
  const files = walk(GUIDES_DIR);
  const map = new Map<string, Set<string>>();
  for (const f of files) {
    const fm = matter.read(f);
    const list = Array.isArray((fm.data as any).threads)
      ? ((fm.data as any).threads as string[])
      : [];
    for (const t of list) {
      const key = String(t);
      if (!map.has(key)) map.set(key, new Set());
      // store relative path for cleaner output
      map.get(key)!.add(path.relative(ROOT, f));
    }
  }
  return map;
}

function collectExistingThreadSlugs() {
  if (!fs.existsSync(THREADS_DIR)) return new Set<string>();
  const files = fs
    .readdirSync(THREADS_DIR)
    .filter((n) => n.endsWith(".md"))
    .map((n) => n.replace(/\.md$/, ""));
  return new Set(files);
}

/**
 * Extract [[guide-id]] references from thread content
 */
function extractLearningLinks(content: string) {
  const links = new Set<string>();
  const regex = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const guideId = match[1]!.trim();
    links.add(guideId);
  }

  return links;
}

/**
 * Build a map of guide ID -> guide metadata
 */
function buildGuideMap() {
  const files = walk(GUIDES_DIR);
  const map = new Map<
    string,
    { slug: string; threads: string[]; path: string }
  >();

  for (const f of files) {
    const fm = matter.read(f);
    const slug = path.basename(f, ".md");
    const id = ((fm.data as any).id as string) || slug;
    const threads = Array.isArray((fm.data as any).threads)
      ? ((fm.data as any).threads as string[])
      : [];

    map.set(id, {
      slug,
      threads,
      path: path.relative(ROOT, f),
    });
  }

  return map;
}

/**
 * Validate bidirectional links between threads and guides
 */
function validateBidirectionalLinks() {
  if (!fs.existsSync(THREADS_DIR)) {
    console.warn(
      "⚠️  No threads directory found, skipping bidirectional validation",
    );
    return { errors: 0, warnings: 0 };
  }

  const threadFiles = fs
    .readdirSync(THREADS_DIR)
    .filter((n) => n.endsWith(".md"))
    .map((n) => path.join(THREADS_DIR, n));

  const guideMap = buildGuideMap();
  let errors = 0;
  let warnings = 0;

  for (const threadFile of threadFiles) {
    const threadSlug = path.basename(threadFile, ".md");
    const threadContent = fs.readFileSync(threadFile, "utf8");
    const fm = matter(threadContent);
    const linkedGuides = extractLearningLinks(fm.content);

    if (linkedGuides.size === 0) {
      console.warn(
        `⚠️  Thread '${threadSlug}' has no inline [[guide-id]] learning links`,
      );
      console.warn(
        `   ↳ Consider adding [[guide-id]] links in: ${path.relative(
          ROOT,
          threadFile,
        )}`,
      );
      warnings++;
    }

    // Check each linked guide exists and references this thread back
    for (const guideId of linkedGuides) {
      const guide = guideMap.get(guideId);

      if (!guide) {
        console.error(
          `❌ Thread '${threadSlug}' references guide [[${guideId}]] but no guide with that ID exists`,
        );
        console.error(`   ↳ Referenced in: ${path.relative(ROOT, threadFile)}`);
        errors++;
        continue;
      }

      // Check bidirectional link: guide must reference thread in frontmatter
      if (!guide.threads.includes(threadSlug)) {
        console.error(
          `❌ Broken bidirectional link: Thread '${threadSlug}' references [[${guideId}]], but guide doesn't reference thread back`,
        );
        console.error(`   ↳ Thread: ${path.relative(ROOT, threadFile)}`);
        console.error(`   ↳ Guide: ${guide.path}`);
        console.error(
          `   ↳ Fix: Add 'threads: [${threadSlug}]' to guide frontmatter`,
        );
        errors++;
      }
    }
  }

  return { errors, warnings };
}

const referenced = collectGuideThreadsWithSources();
const existing = collectExistingThreadSlugs();

let errors = 0;

// Check that all referenced threads have content files
for (const [t, sourcesSet] of referenced) {
  if (!existing.has(t)) {
    const sources = Array.from(sourcesSet).sort();
    const list = sources.map((s) => `     - ${s}`).join("\n");
    console.error(
      `❌ Thread '${t}' is referenced in guides but missing content file: src/content/threads/${t}.md` +
        (sources.length ? `\n   ↳ Referenced in:\n${list}` : ""),
    );
    errors++;
  }
}

// Validate bidirectional links
const { errors: bidirErrors, warnings } = validateBidirectionalLinks();
errors += bidirErrors;

if (errors) {
  console.error(`\n❌ Thread validation failed with ${errors} error(s).`);
  if (warnings) {
    console.warn(`⚠️  ${warnings} warning(s) found.`);
  }
  process.exit(1);
} else {
  console.log("✅ All referenced threads have content pages.");
  console.log("✅ All bidirectional links are valid.");
  if (warnings) {
    console.warn(`⚠️  ${warnings} warning(s) found (non-blocking).`);
  }
}
