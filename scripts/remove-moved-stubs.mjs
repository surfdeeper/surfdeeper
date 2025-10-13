#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";

const root = process.cwd();
const targets = [
  "src/content/concepts/cutbacks.md",
  "src/content/concepts/bottom-and-top-turns.md",
  "src/content/concepts/trimming-and-speed.md",
  "src/content/concepts/board-care-and-repair.md",
  "src/content/concepts/duck-dive-vs-turtle-roll.md",
  "src/content/skills/popping-mechanics.md",
];

async function removeIfExists(relPath) {
  const full = path.join(root, relPath);
  try {
    await fs.unlink(full);
    console.log(`Removed: ${relPath}`);
  } catch (e) {
    if (e && e.code === "ENOENT") {
      // already gone
      return;
    }
    console.warn(`Could not remove ${relPath}: ${e.message}`);
  }
}

for (const t of targets) {
  // eslint-disable-next-line no-await-in-loop
  await removeIfExists(t);
}
console.log("✅ Cleanup complete");
