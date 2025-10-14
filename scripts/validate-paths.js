#!/usr/bin/env node
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const CONCEPTS_DIR = path.join(ROOT, "src/content/concepts");
const SKILLS_DIR = path.join(ROOT, "src/content/skills");
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
  const files = [CONCEPTS_DIR, SKILLS_DIR]
    .filter((d) => fs.existsSync(d))
    .flatMap((d) => walk(d));
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
function extractBracketLearningLinks(content) {
  const occurrences = [];
  const regex = /\[\[([^\]]+)\]\]/g; // [[id]] or [[id|label]]
  let match;
  while ((match = regex.exec(content)) !== null) {
    const full = match[1].trim();
    const idPart = full.split("|")[0].trim();
    occurrences.push({ raw: idPart, index: match.index });
  }
  return occurrences;
}

function extractMarkdownLinks(content) {
  // Generic markdown link extractor: [label](url)
  const occurrences = [];
  const regex = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    occurrences.push({ url: match[1].trim(), index: match.index });
  }
  return occurrences;
}

/**
 * Build a map of guide ID -> guide metadata
 * @returns {Map<string, {slug: string, paths: string[], path: string}>}
 */
function buildGuideMap() {
  const files = [CONCEPTS_DIR, SKILLS_DIR]
    .filter((d) => fs.existsSync(d))
    .flatMap((d) => walk(d));
  const map = new Map();
  const bySlug = new Map(); // slug -> id
  const aliasToId = new Map(); // alias -> id

  for (const f of files) {
    const fm = matter.read(f);
    const slug = path.basename(f, ".md");
    const id = fm.data.id || slug;
    const paths = Array.isArray(fm.data.paths) ? fm.data.paths : [];
    const aliases = Array.isArray(fm.data.aliases) ? fm.data.aliases : [];

    map.set(id, {
      slug,
      paths,
      path: path.relative(ROOT, f),
      type: f.includes("/skills/") ? "skill" : "concept",
      aliases,
    });

    bySlug.set(slug, id);
    for (const a of aliases) aliasToId.set(String(a), id);
  }

  return { map, bySlug, aliasToId };
}

/**
 * Resolve a token (id | alias | slug) to canonical guide id
 */
function makeIdResolver(guideIndex) {
  const { map, bySlug, aliasToId } = guideIndex;
  return (token) => {
    const t = String(token).trim();
    if (!t) return null;
    if (map.has(t)) return t; // exact id
    if (aliasToId.has(t)) return aliasToId.get(t);
    if (bySlug.has(t)) return bySlug.get(t);
    return null;
  };
}

/**
 * Extract inline guide references from content, recognizing:
 * - [[id]] / [[id|label]]
 * - [label](:id|:alias1|:alias2)
 * - [label](/concept/slug) and [label](/skill/slug)
 * Returns ordered occurrences with canonical ids and positions.
 */
function extractInlineGuideRefs(content, guideIndex) {
  const resolveId = makeIdResolver(guideIndex);
  const { map } = guideIndex;
  const occurrences = [];

  // [[...]] occurrences
  for (const occ of extractBracketLearningLinks(content)) {
    const id = resolveId(occ.raw);
    if (id && map.has(id)) occurrences.push({ id, index: occ.index });
  }

  // Markdown links
  for (const occ of extractMarkdownLinks(content)) {
    const url = occ.url;
    if (url.startsWith(":")) {
      // Magic link: :id or :id|:alias1|:alias2
      const candidates = url
        .split("|")
        .map((p) => p.replace(/^:/, "").trim())
        .filter(Boolean);
      for (const c of candidates) {
        const id = resolveId(c);
        if (id && guideIndex.map.has(id)) {
          occurrences.push({ id, index: occ.index });
          break;
        }
      }
      continue;
    }
    if (url.startsWith("/concept/") || url.startsWith("/skill/")) {
      const slug = url.replace(/^\/(concept|skill)\//, "").replace(/#.*/, "");
      const id = resolveId(slug);
      if (id && guideIndex.map.has(id))
        occurrences.push({ id, index: occ.index });
      continue;
    }
  }

  // Sort by position in content
  occurrences.sort((a, b) => a.index - b.index);
  return occurrences;
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

  const guideIndex = buildGuideMap();
  const guideMap = guideIndex.map;
  let errors = 0;
  let warnings = 0;

  for (const pathFile of pathFiles) {
    const pathSlug = path.basename(pathFile, ".md");
    const pathContent = fs.readFileSync(pathFile, "utf8");
    const fm = matter(pathContent);
    const inlineRefs = extractInlineGuideRefs(fm.content, guideIndex);
    const linkedGuides = new Set(inlineRefs.map((r) => r.id));
    const nodeIds = new Set(
      Array.isArray(fm.data.nodes) ? fm.data.nodes.map(String) : [],
    );

    // Inline learning links in path content are optional. We no longer require
    // any inline learning links, nor that nodes appear inline or in a specific
    // order. Validation below only checks existence and bidirectional mapping.

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

    // Check each node id exists and references the path back
    for (const nodeId of nodeIds) {
      const guide = guideMap.get(nodeId);
      if (!guide) {
        console.error(
          `❌ Path '${pathSlug}' lists node '${nodeId}' but no guide with that ID exists`,
        );
        console.error(`   ↳ Path: ${path.relative(ROOT, pathFile)}`);
        errors++;
        continue;
      }
      if (!guide.paths.includes(pathSlug)) {
        console.error(
          `❌ Broken bidirectional link: Path '${pathSlug}' lists node '${nodeId}', but guide doesn't reference path back`,
        );
        console.error(`   ↳ Guide: ${guide.path}`);
        console.error(
          `   ↳ Fix: Add 'paths: [${pathSlug}]' to guide frontmatter`,
        );
        errors++;
      }
    }

    // For guides that reference this path, ensure path references them somehow (inline or nodes)
    const guidesReferencingThisPath = Array.from(guideMap.entries())
      .filter(([, g]) => g.paths.includes(pathSlug))
      .map(([id]) => id);

    for (const id of guidesReferencingThisPath) {
      const referencedInPath = linkedGuides.has(id) || nodeIds.has(id);
      if (!referencedInPath) {
        const guide = guideMap.get(id);
        console.error(
          `❌ Missing path reference: Guide '${id}' references path '${pathSlug}', but the path doesn't reference it in frontmatter nodes[]`,
        );
        console.error(`   ↳ Path: ${path.relative(ROOT, pathFile)}`);
        console.error(`   ↳ Guide: ${guide?.path}`);
        console.error(
          `   ↳ Fix: Add '${id}' to 'nodes: []' in the path frontmatter`,
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
