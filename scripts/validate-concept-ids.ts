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
const ids = new Map<string, string>();
let errors = 0;

for (const f of files) {
  const fm = matter.read(f);
  const id = (fm.data as any).id as string | undefined;
  if (!id) {
    console.error(`❌ Missing id in ${path.relative(ROOT, f)}`);
    errors++;
    continue;
  }
  if (ids.has(id)) {
    console.error(
      `❌ Duplicate id '${id}' in ${path.relative(ROOT, f)} (also in ${path.relative(
        ROOT,
        ids.get(id)!,
      )})`,
    );
    errors++;
  } else {
    ids.set(id, f);
  }
}

// Relationship validation
function checkList(arr: unknown, from: string) {
  const list = Array.isArray(arr) ? (arr as string[]) : [];
  for (const id of list) {
    if (!ids.has(id)) {
      console.error(
        `❌ Unknown reference '${id}' in ${path.relative(ROOT, from)}`,
      );
      errors++;
    }
  }
}

for (const f of files) {
  const fm = matter.read(f);
  checkList((fm.data as any).dependsOn, f);
  checkList((fm.data as any).leadsTo, f);
}

// Build alias map for validation
const aliases = new Map<string, string>();
for (const f of files) {
  const fm = matter.read(f);
  const id = (fm.data as any).id as string | undefined;
  if (id && (fm.data as any).aliases) {
    for (const alias of (fm.data as any).aliases as string[]) {
      aliases.set(alias, id);
    }
  }
}

// Validate magic links in markdown content (:id syntax)
function validateMagicLinks(filePath: string, content: string) {
  const magicLinkRegex = /\[([^\]]+)\]\((:([^)|]+)(?:\|[^)]*)?)\)/g;
  let match: RegExpExecArray | null;

  while ((match = magicLinkRegex.exec(content)) !== null) {
    const label = match[1]!;
    const url = match[2]!;

    // Get candidates from the URL
    const candidates = url
      .split("|")
      .map((p) => p.replace(/^:/, "").trim())
      .filter(Boolean);

    let resolved = false;
    for (const c of candidates) {
      if (ids.has(c) || aliases.has(c)) {
        resolved = true;
        break;
      }
    }

    if (!resolved) {
      const lineNumber = content.substring(0, match.index).split("\n").length;
      console.error(
        `❌ Broken magic link [${label}](${url}) in ${path.relative(ROOT, filePath)}:${lineNumber}`,
      );
      console.error(`   Tried to resolve: ${candidates.join(", ")}`);
      errors++;
    }
  }
}

// Validate learning links in markdown content ([[id]] syntax)
function validateLearningLinks(filePath: string, content: string) {
  const learningLinkRegex = /\[\[([^\]]+)\]\]/g;
  let match: RegExpExecArray | null;

  while ((match = learningLinkRegex.exec(content)) !== null) {
    const contentStr = match[1]!.trim();
    const [idPart] = contentStr.split("|").map((s) => s.trim());

    let resolved = false;
    if (ids.has(idPart) || aliases.has(idPart)) {
      resolved = true;
    }

    if (!resolved) {
      const lineNumber = content.substring(0, match.index).split("\n").length;
      console.error(
        `❌ Broken learning link [[${contentStr}]] in ${path.relative(ROOT, filePath)}:${lineNumber}`,
      );
      errors++;
    }
  }
}

// Check all magic links and learning links in markdown content
for (const f of files) {
  const content = fs.readFileSync(f, "utf8");
  validateMagicLinks(f, content);
  validateLearningLinks(f, content);
}

if (errors) {
  console.error(`\n❌ Validation failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log("✅ Concept IDs, relationships, and magic links look good!");
}
