import { describe, it, expect, vi, beforeEach } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";

// Mock astro:content for both loadGuides() and component's getCollection('paths')
const guides = [
  {
    slug: "foundations",
    data: {
      title: "Foundations",
      id: "foundations",
      paths: ["core"],
      kind: "concept",
      level: undefined,
      levels: [],
      dependsOn: [],
      leadsTo: ["cutbacks"],
    },
  },
  {
    slug: "core-skills/cutbacks",
    data: {
      title: "Cutbacks",
      id: "cutbacks",
      paths: ["core"],
      kind: "concept",
      level: undefined,
      levels: [],
      dependsOn: ["foundations"],
      leadsTo: [],
    },
  },
] as any[];

const paths = [
  {
    slug: "core",
    data: { title: "Core Skills", description: "", icon: "" },
    render: async () => ({ Content: () => null }),
  },
] as any[];

vi.mock("astro:content", () => ({
  getCollection: (name: string) => {
    if (name === "guides") return guides;
    if (name === "paths") return paths;
    return [];
  },
  getEntryBySlug: async () => null,
}));

describe("GuidePathBreadcrumbs component", () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeEach(async () => {
    container = await AstroContainer.create();
  });

  it("renders breadcrumb links with slug-based hrefs", async () => {
    const Component = (await import("../src/components/GuidePathBreadcrumbs.astro")).default;

    const html = await container.renderToString(Component, {
      props: {
        guideId: "cutbacks",
        guidePaths: ["core"],
      },
    });

    expect(html).toContain("/paths/core");
    // sequence links
    expect(html).toContain('href="/guide/foundations"');
    expect(html).toContain('href="/guide/core-skills/cutbacks"');
    // current crumb should have aria-current="page"
    expect(html).toMatch(/aria-current=\"page\"[^>]*>\s*Cutbacks/);
  });
});
