// Legacy sections.json removed; compute sections from provided data

export interface GuideData {
  title: string;
  url: string;
}

export interface SectionData {
  slug: string;
  label: string;
  order: number;
  guides: GuideData[];
  visibleGuides: GuideData[];
  remainingCount: number;
  comingSoonCount: number;
}

export interface SidebarData {
  guidesBySection: Record<string, GuideData[]>;
  comingSoonCountBySection: Record<string, number>;
}

/**
 * Processes sidebar data and returns sorted sections with filtered guides
 */
export function prepareSidebarSections(data: SidebarData): SectionData[] {
  // Derive sections from keys present in guidesBySection and/or comingSoon counts
  const sectionSlugs = new Set<string>([
    ...Object.keys(data.guidesBySection || {}),
    ...Object.keys(data.comingSoonCountBySection || {}),
  ]);

  // Build derived section objects with inferred order (alphabetical)
  const derived = Array.from(sectionSlugs).map((slug) => {
    const allGuides = data.guidesBySection[slug] || [];

    // Create a human label by title-casing the slug
    const label = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Filter out guides that have the same title as the section label
    const guides = allGuides.filter((guide) => guide.title !== label);

    const visibleGuides = guides.slice(0, 3);
    const remainingCount = Math.max(0, guides.length - 3);
    const comingSoonCount = data.comingSoonCountBySection[slug] || 0;

    return {
      slug,
      label,
      order: 999, // alphabetical default; we'll sort below
      guides,
      visibleGuides,
      remainingCount,
      comingSoonCount,
    } as SectionData;
  });

  return derived.sort((a, b) => a.label.localeCompare(b.label));
}
