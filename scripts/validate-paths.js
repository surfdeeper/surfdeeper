#!/usr/bin/env node
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const GUIDES_DIR = path.join(ROOT, "src/content/guides");
const PATHS_DIR = path.join(ROOT, "src/content/paths");

function walk(dir) {
  const files = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.isFile() && e.name.endsWith(".md")) files.push(full);
  }
  return files;
}

function collectGuidePathsWithSources() {
  const files = walk(GUIDES_DIR);
  /** @type {Map<string, Set<string>>} */
  const map = new Map();
  for (const f of files) {
    const fm = matter.read(f);
    const list = Array.isArray(fm.data.paths) ? fm.data.paths : [];
    for (const t of list) {
      const key = String(t);
      if (!map.has(key)) map.set(key, new Set());
      // store relative path for cleaner output
      map.get(key).add(path.relative(ROOT, f));
    }
  }
  return map;
}

function collectExistingPathSlugs() {
  if (!fs.existsSync(PATHS_DIR)) return new Set();
  const files = fs
    .readdirSync(PATHS_DIR)
    .filter((n) => n.endsWith(".md"))
    .map((n) => n.replace(/\.md$/, ""));
  return new Set(files);
}

/**
 * Extract [[guide-id]] references from path content
 * @param {string} content - The markdown content
 * @returns {Set<string>} Set of guide IDs referenced in the content
 */
function extractLearningLinks(content) {
  const links = new Set();
  const regex = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const guideId = match[1].trim();
    links.add(guideId);
  }

  return links;
}

/**
 * Build a map of guide ID -> guide metadata
 * @returns {Map<string, {slug: string, paths: string[], path: string}>}
 */
function buildGuideMap() {
  const files = walk(GUIDES_DIR);
  const map = new Map();

  for (const f of files) {
    const fm = matter.read(f);
    const slug = path.basename(f, ".md");
    const id = fm.data.id || slug;
    const paths = Array.isArray(fm.data.paths) ? fm.data.paths : [];

    map.set(id, {
      slug,
      paths,
      path: path.relative(ROOT, f),
    });
  }

  return map;
}

/**
 * Validate bidirectional links between paths and guides
 * @returns {{errors: number, warnings: number}}
 */
function validateBidirectionalLinks() {
  if (!fs.existsSync(PATHS_DIR)) {
    console.warn(
      "⚠️  No paths directory found, skipping bidirectional validation",
    );
    return { errors: 0, warnings: 0 };
  }

  const pathFiles = fs
    .readdirSync(PATHS_DIR)
    .filter((n) => n.endsWith(".md"))
    .map((n) => path.join(PATHS_DIR, n));

  const guideMap = buildGuideMap();
  let errors = 0;
  let warnings = 0;

  for (const pathFile of pathFiles) {
    const pathSlug = path.basename(pathFile, ".md");
    const pathContent = fs.readFileSync(pathFile, "utf8");
    const fm = matter(pathContent);
    const linkedGuides = extractLearningLinks(fm.content);

    if (linkedGuides.size === 0) {
      console.warn(
        `⚠️  Path '${pathSlug}' has no inline [[guide-id]] learning links`,
      );
      console.warn(
        `   ↳ Consider adding [[guide-id]] links in: ${path.relative(
          ROOT,
          pathFile,
        )}`,
      );
      warnings++;
    }

    // Check each linked guide exists and references this path back
    for (const guideId of linkedGuides) {
      const guide = guideMap.get(guideId);

      if (!guide) {
        console.error(
          `❌ Path '${pathSlug}' references guide [[${guideId}]] but no guide with that ID exists`,
        );
        console.error(`   ↳ Referenced in: ${path.relative(ROOT, pathFile)}`);
        errors++;
        continue;
      }

      // Check bidirectional link: guide must reference path in frontmatter
      if (!guide.paths.includes(pathSlug)) {
        console.error(
          `❌ Broken bidirectional link: Path '${pathSlug}' references [[${guideId}]], but guide doesn't reference path back`,
        );
        console.error(`   ↳ Path: ${path.relative(ROOT, pathFile)}`);
        console.error(`   ↳ Guide: ${guide.path}`);
        console.error(
          `   ↳ Fix: Add 'paths: [${pathSlug}]' to guide frontmatter`,
        );
        errors++;
      }
    }
  }

  return { errors, warnings };
}

const referenced = collectGuidePathsWithSources();
const existing = collectExistingPathSlugs();

let errors = 0;

// Check that all referenced paths have content files
for (const [t, sourcesSet] of referenced) {
  if (!existing.has(t)) {
    const sources = Array.from(sourcesSet).sort();
    const list = sources.map((s) => `     - ${s}`).join("\n");
    console.error(
      `❌ Path '${t}' is referenced in guides but missing content file: src/content/paths/${t}.md` +
        (sources.length ? `\n   ↳ Referenced in:\n${list}` : ""),
    );
    errors++;
  }
}

// Validate bidirectional links
const { errors: bidirErrors, warnings } = validateBidirectionalLinks();
errors += bidirErrors;

if (errors) {
  console.error(`\n❌ Path validation failed with ${errors} error(s).`);
  if (warnings) {
    console.warn(`⚠️  ${warnings} warning(s) found.`);
  }
  process.exit(1);
} else {
  console.log("✅ All referenced paths have content pages.");
  console.log("✅ All bidirectional links are valid.");
  if (warnings) {
    console.warn(`⚠️  ${warnings} warning(s) found (non-blocking).`);
  }
}
