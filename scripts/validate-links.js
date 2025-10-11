#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

class LinkValidator {
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

  async init() {
    await this.buildFileIndex();
  }

  async buildFileIndex() {
    // Index all guide files
    const guidesDir = path.join(this.contentDir, "guides");
    const guideFiles = await this.getMarkdownFiles(guidesDir);

    for (const filePath of guideFiles) {
      // Convert file path to guide slug format
      const relativePath = path.relative(guidesDir, filePath);
      const slug = relativePath.replace(/\.md$/, "").replace(/\/index$/, "");
      this.availableGuides.add(slug);

      // Also add the /index variant for section pages
      if (!slug.includes("/")) {
        this.availableGuides.add(`${slug}/index`);
      }
    }

    // Index all public files (images, etc.)
    try {
      const publicFiles = await this.getPublicFiles(this.publicDir);
      for (const filePath of publicFiles) {
        const relativePath = path.relative(this.publicDir, filePath);
        this.availablePublicFiles.add(`/${relativePath}`);
      }
    } catch (error) {
      console.warn("Could not index public directory:", error.message);
    }

    console.log(
      `📁 Indexed ${this.availableGuides.size} guide pages and ${this.availablePublicFiles.size} public files`,
    );
  }

  async getMarkdownFiles(dir) {
    const files = [];
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

  async getPublicFiles(dir) {
    const files = [];
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

  async validateAllFiles() {
    const markdownFiles = await this.getMarkdownFiles(this.contentDir);

    for (const filePath of markdownFiles) {
      await this.validateFile(filePath);
    }
  }

  async validateFile(filePath) {
    this.filesChecked++;
    const content = await fs.readFile(filePath, "utf-8");
    const relativePath = path.relative(rootDir, filePath);

    // Parse markdown using remark to correctly handle nested/edge cases
    const tree = unified().use(remarkParse).use(remarkGfm).parse(content);

    // Collect link definitions to resolve reference-style links
    const definitions = new Map(); // id (lowercased) -> url
    visit(tree, "definition", (node) => {
      if (node.identifier && typeof node.url === "string") {
        definitions.set(String(node.identifier).toLowerCase(), node.url);
      }
    });

    const handle = async (url, text, node) => {
      if (!url || typeof url !== "string") return;
      this.linksChecked++;
      const lineNumber = node?.position?.start?.line || 1;
      const fullMatch = `${node.type === "image" || node.type === "imageReference" ? "!" : ""}[${text ?? ""}](${url})`;
      await this.validateLink(
        url,
        text ?? "",
        relativePath,
        lineNumber,
        fullMatch,
      );
    };

    // Visit inline links and images
    visit(
      tree,
      (node) => node.type === "link" || node.type === "image",
      (node) => {
        const url = node.url;
        const text = node.type === "link" ? extractText(node) : node.alt || "";
        return handle(url, text, node);
      },
    );

    // Visit reference-style links/images and resolve via definitions
    visit(
      tree,
      (node) => node.type === "linkReference" || node.type === "imageReference",
      (node) => {
        const id = String(node.identifier || "").toLowerCase();
        const defUrl = definitions.get(id);
        const text =
          node.type === "linkReference" ? extractText(node) : node.alt || "";
        return handle(defUrl, text, node);
      },
    );
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split("\n").length;
  }

  async validateLink(url, linkText, filePath, lineNumber, fullMatch) {
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
      // Relative links
      this.addWarning(
        `Relative link found (consider using absolute paths): ${url}`,
        filePath,
        lineNumber,
      );
    }
  }

  async validateGuideLink(
    urlPath,
    hash,
    linkText,
    filePath,
    lineNumber,
    fullMatch,
  ) {
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

  async validatePublicLink(urlPath, linkText, filePath, lineNumber, fullMatch) {
    if (!this.availablePublicFiles.has(urlPath)) {
      this.addError(
        `Broken public file link: ${urlPath}`,
        filePath,
        lineNumber,
        fullMatch,
      );
    }
  }

  findSimilarGuides(searchSlug) {
    const searchParts = searchSlug.toLowerCase().split(/[-\/]/);
    const scored = [];

    for (const guide of this.availableGuides) {
      const guideParts = guide.toLowerCase().split(/[-\/]/);
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

  addError(message, filePath, lineNumber, fullMatch = "") {
    this.errors.push({
      type: "error",
      message,
      file: filePath,
      line: lineNumber,
      match: fullMatch,
    });
  }

  addWarning(message, filePath, lineNumber, fullMatch = "") {
    this.warnings.push({
      type: "warning",
      message,
      file: filePath,
      line: lineNumber,
      match: fullMatch,
    });
  }

  generateReport() {
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
  main();
}

export { LinkValidator };

// Helper: extract plain text from a node (for link text)
function extractText(node) {
  let text = "";
  visit(node, "text", (t) => {
    text += t.value || "";
  });
  return text;
}
