import type { GuideGraph, GuideNode } from "./knowledge-graph";
import { resolveOrderedPathIds } from "./path-order";

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

/**
 * Compute ordered items for a path, respecting explicit frontmatter `nodes` when present.
 * No fallback: nodes are required and define the canonical order.
 */
export async function getOrderedPathItems(
  graph: GuideGraph,
  pathId: string,
): Promise<OrderedPathItem[]> {
  const idToNode = graph.byId;
  const resolvedIds = await resolveOrderedPathIds(pathId);
  const ordered: GuideNode[] = resolvedIds
    .map((id) => idToNode.get(id)!)
    .filter(Boolean);

  return ordered.map((n, i) => ({
    id: n.id,
    title: n.title,
    url: n.url,
    kind: n.kind,
    number: pad2(i + 1),
    isPlaceholder: n.isPlaceholder,
  }));
}
