import fs from "fs";
import path from "path";
import { visit } from "unist-util-visit";

const GUIDE_DIR = path.resolve(process.cwd(), "src/content/guides");

function buildIdMap() {
  const map = new Map(); // id -> slug
  const alias = new Map(); // alias -> id

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const rel = path.relative(GUIDE_DIR, full);
        const slug = path.basename(rel, ".md");
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
        if (!map.has(key)) map.set(key, slug);
      }
    }
  }

  if (fs.existsSync(GUIDE_DIR)) walk(GUIDE_DIR);
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

      let resolvedSlug = null;
      for (const c of candidates) {
        if (map.has(c)) {
          resolvedSlug = map.get(c);
          break;
        }
        if (alias.has(c)) {
          const id = alias.get(c);
          if (map.has(id)) {
            resolvedSlug = map.get(id);
            break;
          }
        }
      }

      if (resolvedSlug) {
        node.url = `/guide/${resolvedSlug}`;
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
