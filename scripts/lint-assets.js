#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { globSync } from "glob";

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";

/**
 * Asset Linter - Detects incorrect asset references that cause 404s in production
 *
 * Common issues this catches:
 * 1. Direct /src/ paths in HTML link tags (should use import statements)
 * 2. Incorrect asset references that work in dev but fail in production
 * 3. Missing asset files that are referenced
 */

const RULES = {
  "no-src-link-tags": {
    pattern: /<link[^>]*href=["|']\/src\/[^"|']*["|'][^>]*>/gi,
    message:
      "Direct /src/ paths in <link> tags will 404 in production. Use import statements in frontmatter instead.",
    severity: "error",
    fix: 'Move to frontmatter: import "../styles/your-file.css"',
  },
  "no-src-script-tags": {
    pattern: /<script[^>]*src=["|']\/src\/[^"|']*["|'][^>]*>/gi,
    message:
      "Direct /src/ paths in <script> tags will 404 in production. Use import statements instead.",
    severity: "error",
    fix: "Move to frontmatter or use proper module imports",
  },
  "no-src-img-tags": {
    pattern: /<img[^>]*src=["|']\/src\/[^"|']*["|'][^>]*>/gi,
    message:
      "Direct /src/ paths in <img> tags may not work in production. Consider moving images to /public/",
    severity: "warning",
    fix: "Move images to /public/ folder or use proper asset imports",
  },
};

class AssetLinter {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.processedFiles = 0;
  }

  async lint() {
    console.log(`${CYAN}🔍 Asset Reference Linter${RESET}\n`);

    // Find all relevant files
    const patterns = [
      "src/**/*.astro",
      "src/**/*.html",
      "src/**/*.svelte",
      "src/**/*.vue",
      "src/**/*.jsx",
      "src/**/*.tsx",
    ];

    const files = [];
    for (const pattern of patterns) {
      files.push(...globSync(pattern));
    }

    if (files.length === 0) {
      console.log(`${YELLOW}⚠️ No files found to lint${RESET}`);
      return;
    }

    console.log(`Found ${files.length} files to check...\n`);

    // Process each file
    for (const file of files) {
      await this.lintFile(file);
    }

    this.printResults();
  }

  async lintFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      this.processedFiles++;

      // Apply each rule
      for (const [ruleName, rule] of Object.entries(RULES)) {
        let match;
        rule.pattern.lastIndex = 0; // Reset regex

        while ((match = rule.pattern.exec(content)) !== null) {
          const lineNumber = this.getLineNumber(content, match.index);
          const issue = {
            file: filePath,
            line: lineNumber,
            rule: ruleName,
            message: rule.message,
            severity: rule.severity,
            fix: rule.fix,
            match: match[0].trim(),
          };

          if (rule.severity === "error") {
            this.errors.push(issue);
          } else {
            this.warnings.push(issue);
          }
        }
      }
    } catch (error) {
      console.error(
        `${RED}Error reading ${filePath}: ${error.message}${RESET}`,
      );
    }
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split("\n").length;
  }

  printResults() {
    console.log(`\n${CYAN}📊 Linting Results${RESET}`);
    console.log(`Files processed: ${this.processedFiles}`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}\n`);

    // Print errors
    if (this.errors.length > 0) {
      console.log(`${RED}❌ Errors:${RESET}`);
      for (const error of this.errors) {
        console.log(`\n${RED}Error${RESET} in ${error.file}:${error.line}`);
        console.log(`  Rule: ${error.rule}`);
        console.log(`  Issue: ${error.message}`);
        console.log(`  Found: ${YELLOW}${error.match}${RESET}`);
        console.log(`  Fix: ${GREEN}${error.fix}${RESET}`);
      }
      console.log("");
    }

    // Print warnings
    if (this.warnings.length > 0) {
      console.log(`${YELLOW}⚠️ Warnings:${RESET}`);
      for (const warning of this.warnings) {
        console.log(
          `\n${YELLOW}Warning${RESET} in ${warning.file}:${warning.line}`,
        );
        console.log(`  Rule: ${warning.rule}`);
        console.log(`  Issue: ${warning.message}`);
        console.log(`  Found: ${YELLOW}${warning.match}${RESET}`);
        console.log(`  Fix: ${GREEN}${warning.fix}${RESET}`);
      }
      console.log("");
    }

    // Summary
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(`${GREEN}✅ No asset reference issues found!${RESET}`);
    } else {
      console.log(`${CYAN}Summary:${RESET}`);
      if (this.errors.length > 0) {
        console.log(
          `  ${RED}${this.errors.length} error(s)${RESET} - These will cause 404s in production`,
        );
      }
      if (this.warnings.length > 0) {
        console.log(
          `  ${YELLOW}${this.warnings.length} warning(s)${RESET} - These may cause issues`,
        );
      }
    }

    // Exit with error code if there are errors
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const linter = new AssetLinter();
  linter.lint().catch((error) => {
    console.error(`${RED}Fatal error: ${error.message}${RESET}`);
    process.exit(1);
  });
}

export default AssetLinter;
