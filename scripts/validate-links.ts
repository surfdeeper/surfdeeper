#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

type Issue = {
  type: "error" | "warning";
  message: string;
  file: string;
  line: number;
  match?: string;
};

class LinkValidator {
  contentDir: string;
  publicDir: string;
  errors: Issue[];
  warnings: Issue[];
  filesChecked: number;
  linksChecked: number;
  availableGuides: Set<string>;
  availablePublicFiles: Set<string>;

  constructor() {
    this.contentDir = path.join(rootDir, "src/content");
    this.publicDir = path.join(rootDir, "public");
    this.errors = [];
    this.warnings = [];
    this.filesChecked = 0;
    this.linksChecked = 0;

    // Track all available guide files for validation
    this.availableGuides = new Set();
    this.availablePublicFiles = new Set();
  }

  async init(): Promise<void> {
    await this.buildFileIndex();
  }

  async buildFileIndex(): Promise<void> {
    // Index all typed content files (concepts + skills)
    const conceptsDir = path.join(this.contentDir, "concepts");
    const skillsDir = path.join(this.contentDir, "skills");
    const [conceptFiles, skillFiles] = await Promise.all([
      this.getMarkdownFiles(conceptsDir).catch(() => []),
      this.getMarkdownFiles(skillsDir).catch(() => []),
    ]);

    const addSlugFrom = (baseDir: string, filePath: string) => {
      const relativePath = path.relative(baseDir, filePath);
      const slug = relativePath.replace(/\.md$/, "").replace(/\/index$/, "");
      if (slug) this.availableGuides.add(slug);
    };

    for (const fp of conceptFiles) addSlugFrom(conceptsDir, fp);
    for (const fp of skillFiles) addSlugFrom(skillsDir, fp);

    // Also include section slugs derived from typed content categories
    try {
      const categories = new Set<string>();
      const readAll = async (dir: string) => {
        const files = await this.getMarkdownFiles(dir).catch(() => []);
        for (const fp of files) {
          const content = await fs.readFile(fp, "utf-8");
          const fmMatch = /^---([\s\S]*?)---/m.exec(content);
          if (fmMatch) {
            const fm = fmMatch[1];
            const catMatch = /^\s*category:\s*([^\n]+)$/m.exec(fm);
            if (catMatch) {
              const slug = catMatch[1].trim().replace(/^"|"$/g, "");
              if (slug) categories.add(slug);
            }
          }
        }
      };
      await readAll(conceptsDir);
      await readAll(skillsDir);
      for (const sectionSlug of categories) {
        this.availableGuides.add(sectionSlug);
        this.availableGuides.add(`${sectionSlug}/index`);
      }
    } catch (e) {
      // ignore if category discovery fails
    }

    // Index all public files (images, etc.)
    try {
      const publicFiles = await this.getPublicFiles(this.publicDir);
      for (const filePath of publicFiles) {
        const relativePath = path.relative(this.publicDir, filePath);
        this.availablePublicFiles.add(`/${relativePath}`);
      }
    } catch (error: any) {
      console.warn("Could not index public directory:", error.message);
    }

    console.log(
      `📁 Indexed ${this.availableGuides.size} /guide pages (concepts, skills, sections) and ${this.availablePublicFiles.size} public files`,
    );
  }

  async getMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.getMarkdownFiles(fullPath)));
      } else if (entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }

    return files;
  }

  async getPublicFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.getPublicFiles(fullPath)));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  async validateAllFiles(): Promise<void> {
    const markdownFiles = await this.getMarkdownFiles(this.contentDir);

    for (const filePath of markdownFiles) {
      await this.validateFile(filePath);
    }
  }

  async validateFile(filePath: string): Promise<void> {
    this.filesChecked++;
    const content = await fs.readFile(filePath, "utf-8");
    const relativePath = path.relative(rootDir, filePath);

    // Extract all markdown links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(content)) !== null) {
      this.linksChecked++;
      const [fullMatch, linkText, url] = match;
      const lineNumber = this.getLineNumber(content, match.index);

      await this.validateLink(
        url,
        linkText,
        relativePath,
        lineNumber,
        fullMatch,
      );
    }
  }

  getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split("\n").length;
  }

  async validateLink(
    url: string,
    linkText: string,
    filePath: string,
    lineNumber: number,
    fullMatch: string,
  ): Promise<void> {
    // Skip external links (http/https)
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return;
    }

    // Skip mailto links
    if (url.startsWith("mailto:")) {
      return;
    }

    // Skip anchor-only links
    if (url.startsWith("#")) {
      return;
    }

    // Parse URL for path and hash
    const [urlPath, hash] = url.split("#");

    if (urlPath.startsWith("/guide/")) {
      await this.validateGuideLink(
        urlPath,
        hash,
        linkText,
        filePath,
        lineNumber,
        fullMatch,
      );
    } else if (urlPath.startsWith("/")) {
      await this.validatePublicLink(
        urlPath,
        linkText,
        filePath,
        lineNumber,
        fullMatch,
      );
    } else {
      // Allow magic links like :concept-id
      if (url.startsWith(":")) {
        return;
      }
      // Relative links (non-magic)
      this.addWarning(
        `Relative link found (consider using absolute paths): ${url}`,
        filePath,
        lineNumber,
      );
    }
  }

  async validateGuideLink(
    urlPath: string,
    hash: string | undefined,
    linkText: string,
    filePath: string,
    lineNumber: number,
    fullMatch: string,
  ): Promise<void> {
    // Extract guide slug from /guide/slug format
    const guideSlug = urlPath.replace("/guide/", "");

    if (!this.availableGuides.has(guideSlug)) {
      // Try to find similar guides for suggestions
      const suggestions = this.findSimilarGuides(guideSlug);
      let errorMsg = `Broken guide link: ${urlPath}`;

      if (suggestions.length > 0) {
        errorMsg += `\n  Did you mean: ${suggestions
          .slice(0, 3)
          .map((s) => `/guide/${s}`)
          .join(", ")}?`;
      }

      this.addError(errorMsg, filePath, lineNumber, fullMatch);
    }

    // TODO: Validate hash anchors by parsing the target file's headings
    if (hash) {
      // For now, just log that we found a hash link
      // console.log(`Hash link found: ${urlPath}#${hash}`);
    }
  }

  async validatePublicLink(
    urlPath: string,
    linkText: string,
    filePath: string,
    lineNumber: number,
    fullMatch: string,
  ): Promise<void> {
    if (!this.availablePublicFiles.has(urlPath)) {
      this.addError(
        `Broken public file link: ${urlPath}`,
        filePath,
        lineNumber,
        fullMatch,
      );
    }
  }

  findSimilarGuides(searchSlug: string): string[] {
    const searchParts = searchSlug.toLowerCase().split(/[-\//]/);
    const scored: Array<{ guide: string; score: number }> = [];

    for (const guide of this.availableGuides) {
      const guideParts = guide.toLowerCase().split(/[-\//]/);
      let score = 0;

      // Simple scoring based on matching words
      for (const searchPart of searchParts) {
        for (const guidePart of guideParts) {
          if (
            guidePart.includes(searchPart) ||
            searchPart.includes(guidePart)
          ) {
            score += searchPart.length;
          }
        }
      }

      if (score > 0) {
        scored.push({ guide, score });
      }
    }

    return scored.sort((a, b) => b.score - a.score).map((item) => item.guide);
  }

  addError(
    message: string,
    filePath: string,
    lineNumber: number,
    fullMatch = "",
  ): void {
    this.errors.push({
      type: "error",
      message,
      file: filePath,
      line: lineNumber,
      match: fullMatch,
    });
  }

  addWarning(
    message: string,
    filePath: string,
    lineNumber: number,
    fullMatch = "",
  ): void {
    this.warnings.push({
      type: "warning",
      message,
      file: filePath,
      line: lineNumber,
      match: fullMatch,
    });
  }

  generateReport(): boolean {
    console.log("\n📊 Link Validation Report");
    console.log("=".repeat(50));
    console.log(`Files checked: ${this.filesChecked}`);
    console.log(`Links checked: ${this.linksChecked}`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      console.log("-".repeat(30));
      for (const error of this.errors) {
        console.log(`\n📄 ${error.file}:${error.line}`);
        console.log(`   ${error.message}`);
        if (error.match) {
          console.log(`   Found: ${error.match}`);
        }
      }
    }

    if (this.warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      console.log("-".repeat(30));
      for (const warning of this.warnings) {
        console.log(`\n📄 ${warning.file}:${warning.line}`);
        console.log(`   ${warning.message}`);
        if (warning.match) {
          console.log(`   Found: ${warning.match}`);
        }
      }
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log("\n✅ All links are valid!");
    }

    return this.errors.length === 0;
  }
}

// CLI runner
async function main() {
  const validator = new LinkValidator();

  try {
    console.log("🔍 Starting link validation...");
    await validator.init();
    await validator.validateAllFiles();

    const success = validator.generateReport();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("❌ Validation failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}

export { LinkValidator };
