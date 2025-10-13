#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "src/content/guides");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.isFile() && e.name.endsWith(".md")) files.push(full);
  }
  return files;
}

const files = walk(DIR);

// Build index
type Bucket = { sections: Set<string>; concepts: Map<string, string> };
const bySection = new Map<string, Bucket>(); // section -> { sections: Set(ids), concepts: Map(id|alias|slug -> canonicalId) }

for (const f of files) {
  const rel = path.relative(DIR, f);
  const slug = path.basename(rel, ".md");
  const fm = matter.read(f).data as any;
  const id = (fm?.id as string) || slug;
  const sectionId =
    fm?.kind === "section" ? id : (fm?.category as string | undefined);

  if (!sectionId) continue;
  if (!bySection.has(sectionId)) {
    bySection.set(sectionId, { sections: new Set(), concepts: new Map() });
  }
  const bucket = bySection.get(sectionId)!;
  if (fm?.kind === "section") {
    bucket.sections.add(id);
  } else {
    bucket.concepts.set(id, id);
    bucket.concepts.set(slug, id);
    for (const a of (fm?.aliases as string[] | undefined) || [])
      bucket.concepts.set(a, id);
  }
}

const LINK_RE = /(\[[^\]]+\]\()(?<url>\/guide\/[^)\s]+)(\))/g;

let changes = 0;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const out = src.replace(
    LINK_RE,
    (m, pre: string, url: string, post: string) => {
      try {
        const clean = url.replace(/\)$/, "");
        const parts = clean
          .replace(/^\/guide\//, "")
          .split("/")
          .filter(Boolean);
        if (parts.length === 0) return m; // shouldn't happen
        if (parts.length === 1) {
          // Section link
          const sectionId = parts[0].replace(/\/index$/, "");
          if (bySection.has(sectionId)) {
            changes++;
            return `${pre}:${sectionId}${post}`;
          }
          return m;
        }
        const sectionId = parts[0];
        const last = parts[parts.length - 1];
        if (last === "index") {
          if (bySection.has(sectionId)) {
            changes++;
            return `${pre}:${sectionId}${post}`;
          }
          return m;
        }
        const bucket = bySection.get(sectionId);
        if (!bucket) return m;
        const canonical = bucket.concepts.get(last);
        if (canonical) {
          changes++;
          return `${pre}:${canonical}${post}`;
        }
        return m;
      } catch {
        return m;
      }
    },
  );
  if (out !== src) fs.writeFileSync(f, out, "utf8");
}

console.log(`✅ Converted ${changes} path-based links to Magic Links`);
