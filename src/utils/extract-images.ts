import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

export interface ExtractedImage {
  src: string;
  alt: string;
  context?: string;
}

export function extractImagesWithContext(markdown: string): ExtractedImage[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);

  const headings: { text: string; line: number }[] = [];
  visit(tree, "heading", (node: any) => {
    const text = extractText(node).trim();
    const line = node?.position?.start?.line || 1;
    if (text) headings.push({ text, line });
  });
  headings.sort((a, b) => a.line - b.line);

  const definitions = new Map<string, string>();
  visit(tree, "definition", (node: any) => {
    const id = String(node.identifier || "").toLowerCase();
    if (id && typeof node.url === "string") {
      definitions.set(id, node.url);
    }
  });

  const results: ExtractedImage[] = [];

  const add = (src: string | undefined, alt: string | undefined, node: any) => {
    if (!src) return;
    const imageLine = node?.position?.start?.line || 1;
    let closestHeading: string | undefined;
    for (let i = headings.length - 1; i >= 0; i--) {
      if (headings[i].line < imageLine) {
        closestHeading = headings[i].text;
        break;
      }
    }
    results.push({
      src,
      alt: (alt && alt.trim()) || "",
      context: closestHeading,
    });
  };

  visit(tree, "image", (node: any) => add(node.url, node.alt || "", node));

  visit(tree, "imageReference", (node: any) => {
    const id = String(node.identifier || "").toLowerCase();
    const url = definitions.get(id);
    add(url, node.alt || "", node);
  });

  return results;
}

function extractText(node: any): string {
  let text = "";
  visit(node, "text", (t: any) => {
    text += t.value || "";
  });
  return text;
}
