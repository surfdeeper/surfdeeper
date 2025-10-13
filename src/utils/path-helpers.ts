import type { CollectionEntry } from "astro:content";
import type { GuideGraph, GuideNode } from "./knowledge-graph";

export type OrderedPathItem = {
  id: string;
  title: string;
  url: string;
  kind?: GuideNode["kind"];
  number: string; // 01, 02, ...
  isPlaceholder?: boolean;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

async function getPathNodes(pathId: string): Promise<string[]> {
  // Use dynamic import to avoid issues in non-Astro runtimes (e.g. tests)
  const { getCollection } = await import("astro:content");
  const all: CollectionEntry<"paths">[] = await getCollection("paths");
  const meta = all.find((t) => t.slug === pathId);
  const nodes = ((meta?.data as any)?.nodes || []) as string[];
  return Array.isArray(nodes) ? nodes : [];
}

/**
 * Compute ordered items for a path, respecting explicit frontmatter `nodes` when present.
 * Falls back to alphabetical by title of all items tagged with the path.
 */
export async function getOrderedPathItems(
  graph: GuideGraph,
  pathId: string,
): Promise<OrderedPathItem[]> {
  const nodesList = await getPathNodes(pathId);

  // Build quick lookups
  const idToNode = graph.byId;
  const slugToId = new Map<string, string>();
  for (const n of graph.nodes) {
    // url is like /concept/:slug or /skill/:slug
    const parts = n.url.split("/").filter(Boolean);
    const slug = parts[2] ?? parts[1] ?? ""; // handle both /concept/x and /skill/x
    if (slug && !slugToId.has(slug)) slugToId.set(slug, n.id);
  }

  let ordered: GuideNode[] = [];
  if (nodesList.length > 0) {
    // Map provided nodes (id or slug) to graph nodes
    const resolvedIds = nodesList
      .map((key) => {
        if (idToNode.has(key)) return key;
        const bySlug = slugToId.get(key);
        return bySlug ?? null;
      })
      .filter(Boolean) as string[];
    ordered = resolvedIds.map((id) => idToNode.get(id)!).filter(Boolean);
  } else {
    // Derive items from graph index and sort by title
    const list = (graph.pathsIndex.get(pathId) || []) as GuideNode[];
    ordered = list.slice().sort((a, b) => a.title.localeCompare(b.title));
  }

  return ordered.map((n, i) => ({
    id: n.id,
    title: n.title,
    url: n.url,
    kind: n.kind,
    number: pad2(i + 1),
    isPlaceholder: n.isPlaceholder,
  }));
}
