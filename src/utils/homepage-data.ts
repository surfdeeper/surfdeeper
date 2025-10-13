import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { getCollection } from "astro:content";
import { isPlaceholderTodo } from "./guide-filters";

export interface UpdatedPage {
  title: string;
  url: string;
  date: string;
  timestamp: number;
  hierarchy: string;
}

export async function loadHomepageData() {
  // Get all surf spots for the map preview
  const spots = await getCollection("spots");

  // Get all typed guides and organize by semantic section (frontmatter category)
  const concepts = await getCollection("concepts");
  const skills = await getCollection("skills");
  const allGuides = [...concepts, ...skills];
  const guidesBySection: Record<
    string,
    Array<{ slug: string; title: string; url: string }>
  > = {};
  const comingSoonCountBySection: Record<string, number> = {};

  for (const guide of allGuides) {
    // Typed entries have category in frontmatter
    let section = (guide.data as any).category as string | undefined;

    // If we still don't know the section, skip from sidebar to avoid mis-grouping
    if (!section) continue;

    // Initialize aggregates
    if (!guidesBySection[section]) guidesBySection[section] = [];
    if (!comingSoonCountBySection[section])
      comingSoonCountBySection[section] = 0;

    // Count placeholders as "coming soon" and exclude from visible list
    if (isPlaceholderTodo(guide.body)) {
      comingSoonCountBySection[section]++;
      continue;
    }

    guidesBySection[section].push({
      slug: guide.slug,
      title: guide.data.title,
      url: `/guide/${guide.slug}`,
    });
  }

  // Fetch recent git commits during build
  let recentCommits: Array<{
    hash: string;
    date: string;
    isoDate: string;
    message: string;
    url: string;
  }> = [];
  try {
    const gitLog = execSync('git log -5 --pretty=format:"%h|%ai|%s"', {
      encoding: "utf-8",
    });
    recentCommits = gitLog.split("\n").map((line: string) => {
      const [hash, date, message] = line.split("|");
      return {
        hash,
        date: date,
        isoDate: date,
        message,
        url: `https://github.com/surfdeeper/surfdeeper/commit/${hash}`,
      };
    });
  } catch (error) {
    console.warn("Could not fetch git log:", error);
  }

  // Fetch recently updated pages
  let recentlyUpdated: UpdatedPage[] = [];
  try {
    const contentPath = "src/content";
    const allFiles: string[] = [];

    function findMarkdownFiles(dir: string, baseDir: string = dir) {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          findMarkdownFiles(fullPath, baseDir);
        } else if (entry.name.endsWith(".md") && entry.name !== "README.md") {
          allFiles.push(fullPath);
        }
      }
    }

    findMarkdownFiles(contentPath);

    const filesWithDates: UpdatedPage[] = [];

    for (const filePath of allFiles) {
      try {
        const gitDate = execSync(`git log -1 --format="%ai" -- "${filePath}"`, {
          encoding: "utf-8",
        }).trim();

        if (gitDate) {
          const timestamp = new Date(gitDate).getTime();

          let url = "";
          let title = "";
          let hierarchy = "";

          if (
            filePath.includes("content/concepts/") ||
            filePath.includes("content/skills/")
          ) {
            const match = filePath.match(
              /content\/(concepts|skills)\/([^/]+)\.md$/,
            );
            if (match) {
              const [, , slug] = match;
              url = `/guide/${slug}`;
              title = slug
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
              hierarchy = "Guide";
            }
          } else if (
            filePath.includes("content/guides/") &&
            /\/([a-z0-9-]+)\.md$/.test(filePath)
          ) {
            // Legacy section pages (e.g., src/content/guides/paddling.md)
            const sectionMatch = filePath.match(
              /content\/guides\/([a-z0-9-]+)\.md$/,
            );
            if (sectionMatch) {
              const section = sectionMatch[1];
              url = `/guide/${section}`;
              title = section
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
              hierarchy = "Guide";
            }
          } else if (filePath.includes("content/spots/")) {
            const match = filePath.match(/content\/spots\/([^/]+)\.md$/);
            if (match) {
              const slug = match[1];
              url = `/spots/${slug}`;
              title = slug
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
              hierarchy = "Spot";
            }
          }

          if (url && title) {
            filesWithDates.push({
              title,
              url,
              date: gitDate,
              timestamp,
              hierarchy,
            });
          }
        }
      } catch (_err) {
        // Skip files not in git yet
        continue;
      }
    }

    recentlyUpdated = filesWithDates
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  } catch (error) {
    console.warn("Could not fetch recently updated pages:", error);
  }

  return {
    spots,
    guidesBySection,
    comingSoonCountBySection,
    recentCommits,
    recentlyUpdated,
  };
}
