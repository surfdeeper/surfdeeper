#!/usr/bin/env node
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const GUIDES_DIR = path.join(ROOT, "src/content/guides");
const THREADS_DIR = path.join(ROOT, "src/content/threads");

function walk(dir) {
  const files = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.isFile() && e.name.endsWith(".md")) files.push(full);
  }
  return files;
}

function collectGuideThreadsWithSources() {
  const files = walk(GUIDES_DIR);
  /** @type {Map<string, Set<string>>} */
  const map = new Map();
  for (const f of files) {
    const fm = matter.read(f);
    const list = Array.isArray(fm.data.threads) ? fm.data.threads : [];
    for (const t of list) {
      const key = String(t);
      if (!map.has(key)) map.set(key, new Set());
      // store relative path for cleaner output
      map.get(key).add(path.relative(ROOT, f));
    }
  }
  return map;
}

function collectExistingThreadSlugs() {
  if (!fs.existsSync(THREADS_DIR)) return new Set();
  const files = fs
    .readdirSync(THREADS_DIR)
    .filter((n) => n.endsWith(".md"))
    .map((n) => n.replace(/\.md$/, ""));
  return new Set(files);
}

const referenced = collectGuideThreadsWithSources();
const existing = collectExistingThreadSlugs();

let errors = 0;
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

if (errors) {
  console.error(`\n❌ Thread validation failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log("✅ All referenced threads have content pages.");
}
