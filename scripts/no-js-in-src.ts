#!/usr/bin/env node
import { globSync } from "glob";

const jsFiles = globSync("src/**/*.js");

if (jsFiles.length > 0) {
  console.error("Found JavaScript files in src/ (TypeScript required):");
  for (const f of jsFiles) console.error(` - ${f}`);
  process.exit(1);
} else {
  console.log("✅ No .js files in src/");
}
