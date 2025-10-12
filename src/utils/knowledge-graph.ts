import { getCollection, type CollectionEntry } from "astro:content";

export type GuideEntry = CollectionEntry<"guides">;

export type GuideNode = {
  id: string;
  title: string;
  url: string;
  level?: GuideEntry["data"]["level"];
  levels: GuideEntry["data"]["levels"];
  paths: string[];
  kind?: GuideEntry["data"]["kind"];
  category?: string;
};

export type GuideEdge = {
  source: string;
  target: string;
  type: "dependsOn" | "leadsTo";
};

export type GuideGraph = {
  nodes: GuideNode[];
  edges: GuideEdge[];
  byId: Map<string, GuideNode>;
  pathsIndex: Map<string, GuideNode[]>;
};

function normalizeId(entry: GuideEntry): string {
  return entry.data.id || entry.slug;
}

function toUrl(entry: GuideEntry): string {
  const seg = entry.data.id || entry.slug;
  return `/guide/${seg}`;
}

export async function loadGuides(): Promise<GuideEntry[]> {
  return await getCollection("guides");
}

export function buildGraph(entries: GuideEntry[]): GuideGraph {
  const nodes: GuideNode[] = entries.map((e) => ({
    id: normalizeId(e),
    title: e.data.title,
    url: toUrl(e),
    level: e.data.level,
    levels: e.data.levels || [],
    paths: e.data.paths || [],
    kind: e.data.kind,
    category: e.data.category,
  }));

  const byId = new Map(nodes.map((n) => [n.id, n] as const));

  const edges: GuideEdge[] = [];
  for (const e of entries) {
    const id = normalizeId(e);
    for (const dep of e.data.dependsOn || []) {
      // Edge from dependency to this guide
      edges.push({ source: dep, target: id, type: "dependsOn" });
    }
    for (const nxt of e.data.leadsTo || []) {
      // Edge from this guide to the next guide
      edges.push({ source: id, target: nxt, type: "leadsTo" });
    }
  }

  // Filter edges to only include those connecting known nodes
  const validIds = new Set(nodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => validIds.has(e.source) && validIds.has(e.target),
  );

  // Build paths index
  const pathsIndex = new Map<string, GuideNode[]>();
  for (const n of nodes) {
    for (const t of n.paths || []) {
      const arr = pathsIndex.get(t) || [];
      arr.push(n);
      pathsIndex.set(t, arr);
    }
  }

  return { nodes, edges: filteredEdges, byId, pathsIndex };
}

export function getPaths(graph: GuideGraph): string[] {
  return Array.from(graph.pathsIndex.keys()).sort((a, b) => a.localeCompare(b));
}

export function getGuidesByPath(
  graph: GuideGraph,
  pathTag: string,
): GuideNode[] {
  return (graph.pathsIndex.get(pathTag) || [])
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function buildPathSubgraph(
  graph: GuideGraph,
  pathTag: string,
  opts?: { level?: GuideNode["level"]; kind?: GuideNode["kind"] },
): GuideGraph {
  const { level, kind } = opts || {};
  const allowed = new Set(
    getGuidesByPath(graph, pathTag)
      .filter((n) => (level ? n.level === level : true))
      .filter((n) => (kind ? n.kind === kind : true))
      .map((n) => n.id),
  );

  const nodes = graph.nodes.filter((n) => allowed.has(n.id));
  const edges = graph.edges.filter(
    (e) => allowed.has(e.source) && allowed.has(e.target),
  );
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  const pathsIndex = new Map<string, GuideNode[]>();
  for (const n of nodes) {
    for (const t of n.paths || []) {
      const arr = pathsIndex.get(t) || [];
      arr.push(n);
      pathsIndex.set(t, arr);
    }
  }
  return { nodes, edges, byId, pathsIndex };
}

export function computeLayers(subgraph: GuideGraph): GuideNode[][] {
  // Simple DAG layering based on in-degree within subgraph
  const indegree = new Map<string, number>();
  for (const n of subgraph.nodes) indegree.set(n.id, 0);
  for (const e of subgraph.edges) {
    indegree.set(e.target, (indegree.get(e.target) || 0) + 1);
  }

  const layers: GuideNode[][] = [];
  const remaining = new Set(subgraph.nodes.map((n) => n.id));
  const byId = subgraph.byId;

  while (remaining.size) {
    const layerIds = Array.from(remaining).filter(
      (id) => (indegree.get(id) || 0) === 0,
    );
    if (layerIds.length === 0) {
      // Cycle or all have indegree; break to avoid infinite loop
      // Put all remaining into one layer
      const rest = Array.from(remaining)
        .map((id) => byId.get(id)!)
        .filter(Boolean);
      if (rest.length) layers.push(rest);
      break;
    }
    layers.push(layerIds.map((id) => byId.get(id)!).filter(Boolean));
    // Remove this layer and decrement indegrees
    for (const id of layerIds) {
      remaining.delete(id);
      for (const e of subgraph.edges) {
        if (e.source === id) {
          const t = e.target;
          indegree.set(t, Math.max(0, (indegree.get(t) || 0) - 1));
        }
      }
    }
  }

  return layers;
}
