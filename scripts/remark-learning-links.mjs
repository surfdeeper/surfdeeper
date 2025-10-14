import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { visit } from "unist-util-visit";
import { isPlaceholderDoc } from "./shared/is-placeholder.mjs";

const CONCEPTS_DIR = path.resolve(process.cwd(), "src/content/concepts");
const SKILLS_DIR = path.resolve(process.cwd(), "src/content/skills");

/**
 * Remark plugin to transform [[guide-id]] syntax into learning links.
 * Syntax: [[guide-id]] or [[guide-id|display text]]
 * Resolves to typed routes: /concept/:slug or /skill/:slug with special styling.
 */
export default function remarkLearningLinks() {
  const { map, alias, slugToId } = buildIdMap();

  return (tree, file) => {
    // If rendering a path page markdown, build a numbering map from its frontmatter nodes
    let canonicalNodes = [];
    try {
      const filePath = file?.path || file?.history?.[0];
      const isPathMd =
        typeof filePath === "string" &&
        filePath.includes(
          `${path.sep}src${path.sep}content${path.sep}paths${path.sep}`,
        ) &&
        filePath.endsWith(".md");
      if (isPathMd) {
        const src = fs.readFileSync(filePath, "utf8");
        const fm = matter(src);
        const nodes = Array.isArray(fm.data?.nodes) ? fm.data.nodes : [];
        // Map nodes to canonical IDs (prefer id, else slug)
        canonicalNodes = nodes
          .map((n) => {
            const key = String(n).trim();
            if (map.has(key)) return key; // it's an id
            if (slugToId.has(key)) return slugToId.get(key);
            return null;
          })
          .filter(Boolean);
      }
    } catch {}

    const numberFor = (idOrSlug) => {
      if (!canonicalNodes || canonicalNodes.length === 0) return null;
      // normalize to id
      let id = null;
      if (map.has(idOrSlug))
        id = idOrSlug; // id
      else if (alias.has(idOrSlug)) id = alias.get(idOrSlug);
      else if (slugToId.has(idOrSlug)) id = slugToId.get(idOrSlug);
      if (!id) return null;
      const idx = canonicalNodes.indexOf(id);
      if (idx === -1) return null;
      return String(idx + 1).padStart(2, "0");
    };

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
          const num = numberFor(idPart);
          const isDisabled = !!resolved.placeholder;
          const hProps = {
            class: `learning-link${isDisabled ? " is-disabled u-coming-soon" : ""}`,
            ...(num ? { "data-number": num } : {}),
            ...(isDisabled
              ? {
                  "aria-disabled": "true",
                  tabindex: -1,
                  "aria-label": `${label} — coming soon`,
                }
              : {}),
          };
          parts.push({
            type: "link",
            url: isDisabled ? "#" : `/${resolved.base}/${resolved.slug}`,
            data: { hProperties: hProps },
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
  const map = new Map(); // id -> { slug, base, placeholder }
  const alias = new Map(); // alias -> id
  const slugToId = new Map(); // slug -> id

  function walk(dir, base) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, base);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const slug = path.basename(full, ".md");
        const src = fs.readFileSync(full, "utf8");
        const parsed = matter(src);
        const id = (parsed.data?.id || slug).toString().trim();
        const aliases = Array.isArray(parsed.data?.aliases)
          ? parsed.data.aliases.map((s) => String(s).trim()).filter(Boolean)
          : [];
        for (const a of aliases) alias.set(a, id);
        const placeholder = isPlaceholderDoc(parsed.content || "");
        if (!map.has(id)) map.set(id, { slug, base, placeholder });
        if (!slugToId.has(slug)) slugToId.set(slug, id);
      }
    }
  }

  if (fs.existsSync(CONCEPTS_DIR)) walk(CONCEPTS_DIR, "concept");
  if (fs.existsSync(SKILLS_DIR)) walk(SKILLS_DIR, "skill");
  return { map, alias, slugToId };
}
