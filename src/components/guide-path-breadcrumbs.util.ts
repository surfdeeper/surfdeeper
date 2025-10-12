import type { GuideGraph, GuideNode } from "../utils/knowledge-graph";

export type PathCrumb = {
  id: string;
  title: string;
  icon?: string;
  sequence: { id: string; title: string; url: string; isCurrent: boolean }[];
};

export function orderByLeadsTo(sub: GuideGraph): GuideNode[] {
  const nodes = sub.nodes;
  const idToNode = new Map(nodes.map((n) => [n.id, n] as const));
  const leads = sub.edges.filter((e) => e.type === "leadsTo");
  const indeg = new Map<string, number>();
  for (const n of nodes) indeg.set(n.id, 0);
  for (const e of leads) indeg.set(e.target, (indeg.get(e.target) || 0) + 1);

  const queue: string[] = Array.from(indeg.entries())
    .filter(([, d]) => d === 0)
    .map(([id]) => id)
    .sort((a, b) =>
      (idToNode.get(a)?.title || a).localeCompare(idToNode.get(b)?.title || b),
    );

  const result: GuideNode[] = [];
  const adj = new Map<string, string[]>();
  for (const e of leads) {
    const arr = adj.get(e.source) || [];
    arr.push(e.target);
    adj.set(e.source, arr);
  }

  while (queue.length) {
    const id = queue.shift()!;
    const node = idToNode.get(id);
    if (node) result.push(node);
    for (const nxt of adj.get(id) || []) {
      indeg.set(nxt, Math.max(0, (indeg.get(nxt) || 0) - 1));
      if ((indeg.get(nxt) || 0) === 0) queue.push(nxt);
    }
    queue.sort((a, b) =>
      (idToNode.get(a)?.title || a).localeCompare(idToNode.get(b)?.title || b),
    );
  }

  if (result.length < nodes.length) {
    const inResult = new Set(result.map((n) => n.id));
    const rest = nodes
      .filter((n) => !inResult.has(n.id))
      .sort((a, b) => a.title.localeCompare(b.title));
    result.push(...rest);
  }
  return result;
}

export function computePathCrumbs(
  guideId: string,
  guidePaths: string[],
  buildSubgraph: (pathId: string) => GuideGraph,
  metaById: Map<string, { title: string; icon?: string }>,
): PathCrumb[] {
  if (!Array.isArray(guidePaths) || guidePaths.length === 0) return [];
  return guidePaths.map((pathId) => {
    const sub = buildSubgraph(pathId);
    const ordered = orderByLeadsTo(sub);
    const sequence = ordered.map((n) => ({
      id: n.id,
      title: n.title,
      url: n.url,
      isCurrent: n.id === guideId,
    }));
    const meta = metaById.get(pathId);
    return {
      id: pathId,
      title: meta?.title || pathId,
      icon: meta?.icon,
      sequence,
    };
  });
}
