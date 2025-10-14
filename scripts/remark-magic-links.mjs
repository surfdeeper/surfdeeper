import fs from "fs";
import path from "path";
import { visit } from "unist-util-visit";

const CONCEPTS_DIR = path.resolve(process.cwd(), "src/content/concepts");
const SKILLS_DIR = path.resolve(process.cwd(), "src/content/skills");

function buildIdMap() {
  const map = new Map(); // id -> { slug, base }
  const alias = new Map(); // alias -> id

  function walk(dir, base) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, base);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const slug = path.basename(full, ".md");
        const src = fs.readFileSync(full, "utf8");
        const m = /^---[\s\S]*?---/m.exec(src);
        let id = null;
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
            for (const a of list) alias.set(a, id || slug);
          }
        }
        const key = (id || slug).trim();
        if (!map.has(key)) map.set(key, { slug, base });
      }
    }
  }

  if (fs.existsSync(CONCEPTS_DIR)) walk(CONCEPTS_DIR, "concept");
  if (fs.existsSync(SKILLS_DIR)) walk(SKILLS_DIR, "skill");
  return { map, alias };
}

export default function remarkMagicLinks() {
  const { map, alias } = buildIdMap();

  return (tree) => {
    visit(tree, "link", (node) => {
      if (!node.url || typeof node.url !== "string") return;
      if (!node.url.startsWith(":")) return;

      // Syntax: :id or :id|:alias1|:alias2
      const parts = node.url.split("|").map((p) => p.trim());
      const candidates = parts
        .map((p) => p.replace(/^:/, "").trim())
        .filter(Boolean);

      let resolved = null;
      for (const c of candidates) {
        if (map.has(c)) {
          resolved = map.get(c);
          break;
        }
        if (alias.has(c)) {
          const id = alias.get(c);
          if (map.has(id)) {
            resolved = map.get(id);
            break;
          }
        }
      }

      if (resolved) {
        node.url = `/${resolved.base}/${resolved.slug}`;
      } else {
        // Convert broken link to plain text - hide the link entirely
        node.type = "text";
        node.value = node.children?.[0]?.value || "";
        delete node.url;
        delete node.children;
        delete node.data;
      }
    });
  };
}
