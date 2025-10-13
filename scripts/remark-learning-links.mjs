import fs from "fs";
import path from "path";
import { visit } from "unist-util-visit";

const CONCEPTS_DIR = path.resolve(process.cwd(), "src/content/concepts");
const SKILLS_DIR = path.resolve(process.cwd(), "src/content/skills");

/**
 * Remark plugin to transform [[guide-id]] syntax into learning links.
 * Syntax: [[guide-id]] or [[guide-id|display text]]
 * Resolves to typed routes: /concept/:slug or /skill/:slug with special styling.
 */
export default function remarkLearningLinks() {
  const { map, alias } = buildIdMap();

  return (tree) => {
    visit(tree, "text", (node, index, parent) => {
      if (!node.value || typeof node.value !== "string") return;
      if (!node.value.includes("[[")) return;

      const parts = [];
      let lastIndex = 0;
      const regex = /\[\[([^\]]+)\]\]/g;
      let match;

      while ((match = regex.exec(node.value)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          parts.push({
            type: "text",
            value: node.value.slice(lastIndex, match.index),
          });
        }

        // Parse the learning link
        const content = match[1].trim();
        const [idPart, ...labelParts] = content.split("|").map((s) => s.trim());
        const label = labelParts.join("|") || idPart;

        // Resolve the guide
        let resolved = null;
        if (map.has(idPart)) {
          resolved = map.get(idPart);
        } else if (alias.has(idPart)) {
          const id = alias.get(idPart);
          if (map.has(id)) {
            resolved = map.get(id);
          }
        }

        if (resolved) {
          parts.push({
            type: "link",
            url: `/${resolved.base}/${resolved.slug}`,
            data: {
              hProperties: {
                class: "learning-link",
              },
            },
            children: [{ type: "text", value: label }],
          });
        } else {
          // Unresolved - keep as text with broken link indicator
          parts.push({
            type: "link",
            url: "#",
            data: {
              hProperties: {
                class: "broken-learning-link",
              },
            },
            children: [{ type: "text", value: label }],
          });
        }

        lastIndex = regex.lastIndex;
      }

      // Add remaining text
      if (lastIndex < node.value.length) {
        parts.push({
          type: "text",
          value: node.value.slice(lastIndex),
        });
      }

      // Replace the text node with the parts
      if (parts.length > 0) {
        parent.children.splice(index, 1, ...parts);
        return index + parts.length;
      }
    });
  };
}

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
