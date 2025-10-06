import { execSync } from "child_process";
import { readdirSync } from "fs";
import { join } from "path";
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

  // Get all guides and organize by section
  const allGuides = await getCollection("guides");
  const guidesBySection: Record<
    string,
    Array<{ slug: string; title: string; url: string }>
  > = {};

  // Group guides by their section (first part of slug)
  for (const guide of allGuides) {
    const slugParts = guide.slug.split("/");
    const section = slugParts[0];
    const pageName = slugParts[1];

    // Skip index pages
    if (pageName === "index") continue;

    // Skip placeholder guides that contain only "coming soon" or "todo" content
    if (isPlaceholderTodo(guide.body)) continue;

    if (!guidesBySection[section]) {
      guidesBySection[section] = [];
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
    recentCommits = gitLog.split("\n").map((line) => {
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

          if (filePath.includes("content/guides/")) {
            const match = filePath.match(
              /content\/guides\/([^/]+)\/([^/]+)\.md$/,
            );
            if (match) {
              const [, category, slug] = match;
              const categoryFormatted = category
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());

              if (slug === "index") {
                url = `/guide/${category}`;
                title = categoryFormatted;
                hierarchy = "Guide";
              } else {
                url = `/guide/${category}/${slug}`;
                title = slug
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase());
                hierarchy = `Guide > ${categoryFormatted}`;
              }
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

  return { spots, guidesBySection, recentCommits, recentlyUpdated };
}
