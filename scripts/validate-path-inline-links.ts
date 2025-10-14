import fs from "fs";
import path from "path";
import matter from "gray-matter";

type IdInfo = { slug: string; base: "concept" | "skill" };

const ROOT = process.cwd();
const PATHS_DIR = path.resolve(ROOT, "src/content/paths");
const CONCEPTS_DIR = path.resolve(ROOT, "src/content/concepts");
const SKILLS_DIR = path.resolve(ROOT, "src/content/skills");

function buildIdMap() {
  const map = new Map<string, IdInfo>(); // id -> { slug, base }
  const alias = new Map<string, string>(); // alias -> id
  const slugToId = new Map<string, string>(); // slug -> id

  function walk(dir: string, base: IdInfo["base"]) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, base);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const slug = path.basename(full, ".md");
        const src = fs.readFileSync(full, "utf8");
        const m = /^---[\s\S]*?---/m.exec(src);
        let id: string | null = null;
        if (m) {
          const fm = m[0];
          const idMatch = /^id:\s*([^\n#]+)$/m.exec(fm);
          if (idMatch) id = idMatch[1].trim();
          const aliasesMatch = /^aliases:\s*\[(.+?)\]/m.exec(fm);
          if (aliasesMatch) {
            const list = aliasesMatch[1]
              .split(",")
              .map((s) => s.replace(/["'\s]/g, "").trim())
              .filter(Boolean);
            for (const a of list) alias.set(a, (id || slug).trim());
          }
        }
        const key = (id || slug).trim();
        if (!map.has(key)) map.set(key, { slug, base });
        if (!slugToId.has(slug)) slugToId.set(slug, key);
      }
    }
  }

  walk(CONCEPTS_DIR, "concept");
  walk(SKILLS_DIR, "skill");
  return { map, alias, slugToId };
}

function toCanonicalNodeIds(
  nodes: unknown[],
  maps: ReturnType<typeof buildIdMap>,
) {
  const { map, alias, slugToId } = maps;
  const out = new Set<string>();
  for (const n of nodes) {
    const key = String(n ?? "").trim();
    if (!key) continue;
    if (map.has(key))
      out.add(key); // id
    else if (alias.has(key))
      out.add(alias.get(key)!); // alias
    else if (slugToId.has(key))
      out.add(slugToId.get(key)!); // slug
    else out.add(key); // unknown; keep for error messages later
  }
  return out;
}

function lineAndCol(str: string, index: number) {
  const prior = str.slice(0, index);
  const lines = prior.split("\n");
  const line = lines.length; // 1-based
  const col = (lines[lines.length - 1] || "").length + 1; // 1-based
  return { line, col };
}

function main() {
  const { map, alias, slugToId } = buildIdMap();
  const errors: string[] = [];
  console.log("\n🔍 Validating path inline links...");

  for (const entry of fs.readdirSync(PATHS_DIR)) {
    if (!entry.endsWith(".md")) continue;
    const file = path.join(PATHS_DIR, entry);
    const src = fs.readFileSync(file, "utf8");
    const fm = matter(src);
    const nodes = Array.isArray(fm.data?.nodes) ? fm.data.nodes : [];
    const canonicalNodes = toCanonicalNodeIds(nodes, { map, alias, slugToId });

    // [[id|label]] links
    const bracketRe = /\[\[([^\]]+?)\]\]/g;
    for (let m; (m = bracketRe.exec(fm.content)); ) {
      const full = m[0];
      const content = m[1].trim();
      const idPart = content.split("|")[0].trim();
      let resolved: string | null = null;
      if (map.has(idPart)) resolved = idPart;
      else if (alias.has(idPart)) resolved = alias.get(idPart)!;
      else if (slugToId.has(idPart)) resolved = slugToId.get(idPart)!;

      const { line, col } = lineAndCol(fm.content, m.index);
      if (!resolved) {
        errors.push(
          `• ${file}:${line}:${col} Unresolved learning link ${full}.`,
        );
        continue;
      }
      // Only enforce for concept/skill links
      const info = map.get(resolved);
      if (info && (info.base === "concept" || info.base === "skill")) {
        if (!canonicalNodes.has(resolved)) {
          errors.push(
            `• ${file}:${line}:${col} Learning link ${full} points to “${resolved}” which is not listed in this path's frontmatter nodes. Add it to nodes or remove the link.`,
          );
        }
      }
    }

    // [label](:id) magic links to concept/skill are not allowed in path pages
    const colonRe = /\[[^\]]+\]\(:([^)#\s]+)\)/g;
    for (let m; (m = colonRe.exec(fm.content)); ) {
      const target = m[1].trim();
      let resolved: string | null = null;
      if (map.has(target)) resolved = target;
      else if (alias.has(target)) resolved = alias.get(target)!;
      else if (slugToId.has(target)) resolved = slugToId.get(target)!;
      if (!resolved) continue; // not a concept/skill id/alias/slug we know about

      const info = map.get(resolved);
      if (info && (info.base === "concept" || info.base === "skill")) {
        const { line, col } = lineAndCol(fm.content, m.index);
        errors.push(
          `• ${file}:${line}:${col} Do not use colon-style links to ${info.base}s in path pages. Use [[${resolved}|label]] and ensure it's in frontmatter nodes to be numbered.`,
        );
      }
    }

    // Direct /concept/slug or /skill/slug links are not allowed in path pages
    const directRe = /(\/)(concept|skill)\/([a-z0-9-]+)/g;
    for (let m; (m = directRe.exec(fm.content)); ) {
      const base = m[2] as "concept" | "skill";
      const slug = m[3];
      const id = slugToId.get(slug);
      const { line, col } = lineAndCol(fm.content, m.index);
      if (id) {
        errors.push(
          `• ${file}:${line}:${col} Direct link to /${base}/${slug} not allowed in path pages. Use [[${id}|label]] so it is numbered and styled.`,
        );
      } else {
        errors.push(
          `• ${file}:${line}:${col} Direct link to /${base}/${slug} appears to reference unknown content.`,
        );
      }
    }
  }

  if (errors.length) {
    console.error(
      "\n❌ validate-path-inline-links: FAIL\n" + errors.join("\n"),
    );
    process.exit(1);
  } else {
    console.log("✅ validate-path-inline-links: OK");
  }
}

main();
