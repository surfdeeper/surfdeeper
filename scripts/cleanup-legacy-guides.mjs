#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  const guidesDir = path.join(root, "src/content/guides");
  const archiveBase = path.join(root, "memory/archives");
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
  const archiveDir = path.join(archiveBase, `guides-legacy-${stamp}`);

  try {
    const entries = await fs.readdir(guidesDir, { withFileTypes: true });
    const mdFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => e.name);

    if (mdFiles.length === 0) {
      console.log("No legacy markdown files found in src/content/guides.");
      return;
    }

    await ensureDir(archiveDir);

    for (const name of mdFiles) {
      const from = path.join(guidesDir, name);
      const to = path.join(archiveDir, name);
      await fs.rename(from, to);
      console.log(`Archived: ${name}`);
    }

    console.log(
      `\n✅ Archived ${mdFiles.length} files to ${path.relative(root, archiveDir)}`,
    );
    console.log("Legacy _sections.json is no longer used.");
  } catch (err) {
    console.error("Failed to archive legacy guides:", err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
