#!/usr/bin/env node
/*
 Flattens src/content/guides/* into a flat folder while:
 - Adding frontmatter: id, category, kind, aliases (when needed)
 - Making IDs unique; adds alias for previous/conflicting id
 - Renaming files to <id>.md (or <id>-<category>.md on collision)
*/

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const GUIDES_DIR = path.join(ROOT, "src/content/guides");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

function kebabCase(s: string) {
  return String(s)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function removeEmptyDirs(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      removeEmptyDirs(full);
      if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
    }
  }
}

function main() {
  const all = walk(GUIDES_DIR);
  const usedIds = new Set<string>();
  const usedNames = new Set(
    fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith(".md")),
  );

  for (const abs of all) {
    const rel = path.relative(GUIDES_DIR, abs);
    const parts = rel.split(path.sep);
    const filename = parts.pop()!;
    const category = parts.length > 0 ? parts[0] : undefined;
    const isIndex = filename === "index.md";
    const baseName = path.basename(filename, ".md");
    const initialId = kebabCase(isIndex ? (category ?? baseName) : baseName);

    const raw = fs.readFileSync(abs, "utf8");
    const fm = matter(raw);

    let id = fm.data.id ? kebabCase(String(fm.data.id)) : initialId;
    let aliases: string[] = Array.isArray(fm.data.aliases)
      ? (fm.data.aliases as string[])
      : [];
    let kind = (fm.data.kind as string) || (isIndex ? "section" : "concept");

    if (usedIds.has(id)) {
      const newId = kebabCase(`${id}-${category ?? "guide"}`);
      if (newId !== id) {
        aliases = Array.from(new Set([...aliases, id]));
        id = newId;
      } else {
        let i = 2;
        while (usedIds.has(`${id}-${i}`)) i++;
        aliases = Array.from(new Set([...aliases, id]));
        id = `${id}-${i}`;
      }
    }
    usedIds.add(id);

    // Ensure filename uniqueness
    let newName = `${id}.md`;
    if (usedNames.has(newName) && path.join(GUIDES_DIR, newName) !== abs) {
      const alt = `${id}-${category ?? "guide"}.md`;
      newName = usedNames.has(alt) ? `${id}-${Date.now()}.md` : alt;
    }
    usedNames.add(newName);

    // Update frontmatter
    (fm.data as any).id = id;
    if (category) (fm.data as any).category = category;
    (fm.data as any).kind = kind;
    if (aliases.length) (fm.data as any).aliases = aliases.map(kebabCase);

    const out = matter.stringify(fm.content, fm.data);

    const dest = path.join(GUIDES_DIR, newName);
    if (dest !== abs) {
      fs.writeFileSync(dest, out, "utf8");
      fs.unlinkSync(abs);
    } else {
      fs.writeFileSync(abs, out, "utf8");
    }
  }

  // Remove now-empty subfolders
  for (const entry of fs.readdirSync(GUIDES_DIR, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const dir = path.join(GUIDES_DIR, entry.name);
      removeEmptyDirs(dir);
      if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
      }
    }
  }

  console.log(
    "✅ Flattened guides and updated frontmatter (id, category, kind)",
  );
}

main();
