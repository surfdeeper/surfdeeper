import { describe, it, expect } from "vitest";
import { type GuideGraph, type GuideNode } from "../src/utils/knowledge-graph";

// Local copy of orderByLeadsTo as used inside GuidePathBreadcrumbs component
function orderByLeadsTo(sub: GuideGraph) {
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

describe("Guide breadcrumbs sequence URLs", () => {
  it("uses slug-based URLs in sequence items", () => {
    const graph: GuideGraph = {
      nodes: [
        {
          id: "foundations",
          title: "Foundations",
          url: "/concept/foundations",
          paths: ["core"],
          levels: [],
        },
        {
          id: "cutbacks",
          title: "Cutbacks",
          url: "/concept/core-skills/cutbacks",
          paths: ["core"],
          levels: [],
        },
      ],
      edges: [{ source: "foundations", target: "cutbacks", type: "leadsTo" }],
      byId: new Map(),
      pathsIndex: new Map(),
    };

    const ordered = orderByLeadsTo(graph);
    const seq = ordered.map((n) => ({ id: n.id, title: n.title, url: n.url }));
    expect(seq[0].url).toBe("/concept/foundations");
    // The URL should reflect the slug location, not the id alone
    expect(seq[1].url).toBe("/concept/core-skills/cutbacks");
  });
});
