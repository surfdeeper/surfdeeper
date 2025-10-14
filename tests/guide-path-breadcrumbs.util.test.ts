import { describe, it, expect } from "vitest";
import {
  computePathCrumbs,
  orderByLeadsTo,
} from "../src/components/guide-path-breadcrumbs.util";
import type { GuideGraph } from "../src/utils/knowledge-graph";

describe("guide-path-breadcrumbs.util", () => {
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
      {
        id: "linking-maneuvers",
        title: "Linking Maneuvers",
        url: "/concept/intermediate/linking-maneuvers",
        paths: ["core"],
        levels: [],
      },
    ],
    edges: [
      { source: "foundations", target: "cutbacks", type: "leadsTo" },
      { source: "cutbacks", target: "linking-maneuvers", type: "leadsTo" },
    ],
    byId: new Map(),
    pathsIndex: new Map(),
  };

  it("orders nodes by leadsTo with fallback by title", () => {
    const ordered = orderByLeadsTo(graph);
    expect(ordered.map((n) => n.id)).toEqual([
      "foundations",
      "cutbacks",
      "linking-maneuvers",
    ]);
  });

  it("builds crumbs with slug-based URLs and current flag", () => {
    const crumbs = computePathCrumbs(
      "cutbacks",
      ["core"],
      () => graph,
      new Map([["core", { title: "Core Skills" }]]),
    );
    expect(crumbs).toHaveLength(1);
    const c = crumbs[0];
    expect(c.title).toBe("Core Skills");
    expect(c.sequence.map((s) => s.url)).toEqual([
      "/concept/foundations",
      "/concept/core-skills/cutbacks",
      "/concept/intermediate/linking-maneuvers",
    ]);
    const current = c.sequence.find((s) => s.isCurrent)!;
    expect(current.id).toBe("cutbacks");
  });
});
