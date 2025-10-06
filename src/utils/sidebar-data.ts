import sections from "../content/guides/_sections.json";

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
  return Object.entries(sections)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([slug, section]) => {
      const allGuides = data.guidesBySection[slug] || [];

      // Filter out guides that have the same title as the section
      const guides = allGuides.filter((guide) => guide.title !== section.label);

      const visibleGuides = guides.slice(0, 3);
      const remainingCount = Math.max(0, guides.length - 3);
      const comingSoonCount = data.comingSoonCountBySection[slug] || 0;

      return {
        slug,
        label: section.label,
        order: section.order,
        guides,
        visibleGuides,
        remainingCount,
        comingSoonCount,
      };
    });
}
