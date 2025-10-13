#!/usr/bin/env node
import { globSync } from "glob";
import path from "node:path";

// Disallowed JS locations (we prefer TypeScript)
const patterns = ["src/**/*.js", "scripts/**/*.js"] as const;

const results = patterns.flatMap((p) => globSync(p, { nodir: true }));

// Normalize to posix-style relative paths and filter allowlisted files
const offending = results
  .map((f) => path.posix.normalize(f.split(path.sep).join(path.posix.sep)))

if (offending.length > 0) {
  console.error(
    "Found JavaScript files where TypeScript is required (src/ and scripts/):",
  );
  for (const f of offending) console.error(` - ${f}`);
  process.exit(1);
} else {
  console.log(
    "✅ No .js files in src/ or scripts/ (excluding temporary allowlist)",
  );
}
