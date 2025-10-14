import type { CollectionEntry } from "astro:content";

export type GuideIndexEntry = {
  id: string;
  title: string;
  slug: string;
  type: "concept" | "skill";
};

export type GuideIndex = {
  byId: Map<string, GuideIndexEntry>;
  slugToId: Map<string, string>;
};

/**
 * Load concepts and skills into a lookup index by id and slug.
 */
export async function buildGuideIndex(): Promise<GuideIndex> {
  const { getCollection } = await import("astro:content");
  const concepts = (await getCollection(
    "concepts",
  )) as CollectionEntry<"concepts">[];
  const skills = (await getCollection("skills")) as CollectionEntry<"skills">[];
  const all = [...concepts, ...skills];

  const byId = new Map<string, GuideIndexEntry>();
  const slugToId = new Map<string, string>();

  for (const e of all) {
    const id = ((e.data as any).id || e.slug) as string;
    const type = (e.collection as string) === "concepts" ? "concept" : "skill";
    const entry: GuideIndexEntry = {
      id,
      title: (e.data as any).title as string,
      slug: e.slug as string,
      type,
    };
    if (!byId.has(id)) byId.set(id, entry);
    if (!slugToId.has(e.slug)) slugToId.set(e.slug, id);
  }

  return { byId, slugToId };
}

/**
 * Read a path frontmatter by slug and return its nodes array. Throws when missing/empty.
 */
export async function getPathNodesStrict(pathId: string): Promise<string[]> {
  const { getCollection } = await import("astro:content");
  const all = (await getCollection("paths")) as CollectionEntry<"paths">[];
  const meta = all.find((t) => t.slug === pathId);
  if (!meta) throw new Error(`Path not found: ${pathId}`);
  const nodes = ((meta.data as any)?.nodes || []) as string[];
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error(
      `Path '${pathId}' must define a non-empty 'nodes' array in frontmatter`,
    );
  }
  return nodes.map((n) => String(n).trim());
}

/**
 * Resolve the canonical ordered list of guide IDs for a path, accepting id or slug tokens.
 * Throws if any token cannot be resolved.
 */
export async function resolveOrderedPathIds(pathId: string): Promise<string[]> {
  const nodes = await getPathNodesStrict(pathId);
  const { byId, slugToId } = await buildGuideIndex();
  const resolved = nodes.map((token) => {
    if (byId.has(token)) return token; // id
    const bySlug = slugToId.get(token);
    if (bySlug) return bySlug; // slug
    throw new Error(
      `Path '${pathId}' lists node '${token}' but no matching guide id or slug exists`,
    );
  });
  return resolved;
}

/**
 * Return sidebar-ready ordered items with numbering.
 */
export async function getOrderedPathItemsForSidebar(pathId: string) {
  const ids = await resolveOrderedPathIds(pathId);
  const { byId } = await buildGuideIndex();
  return ids.map((id, i) => {
    const e = byId.get(id);
    if (!e)
      throw new Error(
        `Invariant: guide '${id}' not found in index while building sidebar for path '${pathId}'`,
      );
    return {
      id: e.id,
      title: e.title,
      slug: e.slug,
      type: e.type,
      number: String(i + 1).padStart(2, "0"),
    } as const;
  });
}
