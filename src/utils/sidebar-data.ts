import { getCollection, type CollectionEntry } from "astro:content";
import {
  buildGraph,
  getGuidesByPath,
  loadGuides,
  type GuideNode,
} from "./knowledge-graph";

export interface GuideData {
  title: string;
  url: string;
}

export interface SectionData {
  key: "paths" | "skills" | "concepts";
  label: string;
  href: string;
  order: number;
  guides: GuideData[];
  visibleGuides: GuideData[];
  remainingCount: number;
  comingSoonCount: number;
}

function toTitleCase(s: string) {
  return s
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Build sidebar sections from Paths, Skills, and Concepts.
 * - Paths: each path becomes a section, listing up to 3 guides tagged with that path
 * - Skills: a single section linking to the Skills index, previewing up to 3 skills
 * - Concepts: a single section linking to the Concepts index, previewing up to 3 concepts
 */
export async function buildSidebarSections(): Promise<SectionData[]> {
  const [entries, pathMeta, allSkills, allConcepts] = await Promise.all([
    loadGuides(),
    getCollection("paths"),
    getCollection("skills"),
    getCollection("concepts"),
  ] as const);

  const graph = buildGraph(entries);

  // 1) Paths → section per path
  const pathSections: SectionData[] = pathMeta
    .slice()
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
    .map((meta: CollectionEntry<"paths">) => {
      const items: GuideNode[] = getGuidesByPath(graph, meta.slug);
      const guides: GuideData[] = items
        .filter((n) => !n.isPlaceholder)
        .map((n) => ({ title: n.title, url: n.url }));
      const visibleGuides = guides.slice(0, 3);
      const remainingCount = Math.max(0, guides.length - 3);
      const comingSoonCount = items.filter((n) => n.isPlaceholder).length;
      return {
        key: "paths",
        label: meta.data.title || toTitleCase(meta.slug),
        href: `/paths/${meta.slug}`,
        order: 10,
        guides,
        visibleGuides,
        remainingCount,
        comingSoonCount,
      } satisfies SectionData;
    });

  // Helpers to format entries into GuideData
  const toGuideData = (slugBase: string, title: string, slug: string) => ({
    title,
    url: `/${slugBase}/${slug}`,
  });

  // 2) Skills → one section with preview items
  const skillOrder = new Map([
    ["beginner", 0],
    ["intermediate", 1],
    ["advanced", 2],
  ]);
  const sortedSkills = allSkills
    .slice()
    .sort((a, b) => {
      const aLevel = (a.data as any).skillLevel || (a.data as any).level || "zzz";
      const bLevel = (b.data as any).skillLevel || (b.data as any).level || "zzz";
      const byLevel =
        (skillOrder.get(String(aLevel)) ?? 99) -
        (skillOrder.get(String(bLevel)) ?? 99);
      if (byLevel !== 0) return byLevel;
      return a.data.title.localeCompare(b.data.title);
    });
  const comingSoonSkills = sortedSkills.filter((s) =>
    // @ts-ignore body exists at runtime
    typeof (s as any).body === "string" && (s as any).body.includes("TODO"),
  ).length;
  const skillGuides = sortedSkills
    .filter((s) => !(s as any).body?.includes?.("TODO"))
    .map((s) => toGuideData("skill", s.data.title, s.slug));
  const skillsSection: SectionData = {
    key: "skills",
    label: "Skills",
    href: "/skill",
    order: 0,
    guides: skillGuides,
    visibleGuides: skillGuides.slice(0, 3),
    remainingCount: Math.max(0, skillGuides.length - 3),
    comingSoonCount: comingSoonSkills,
  };

  // 3) Concepts → one section with preview items
  const sortedConcepts = allConcepts
    .slice()
    .sort((a, b) => a.data.title.localeCompare(b.data.title));
  const comingSoonConcepts = sortedConcepts.filter((c) =>
    // @ts-ignore body exists at runtime
    typeof (c as any).body === "string" && (c as any).body.includes("TODO"),
  ).length;
  const conceptGuides = sortedConcepts
    .filter((c) => !(c as any).body?.includes?.("TODO"))
    .map((c) => toGuideData("concept", c.data.title, c.slug));
  const conceptsSection: SectionData = {
    key: "concepts",
    label: "Concepts",
    href: "/concept",
    order: 1,
    guides: conceptGuides,
    visibleGuides: conceptGuides.slice(0, 3),
    remainingCount: Math.max(0, conceptGuides.length - 3),
    comingSoonCount: comingSoonConcepts,
  };

  // Final ordering: Skills (0), Concepts (1), Paths (10+ by title)
  return [skillsSection, conceptsSection, ...pathSections];
}
