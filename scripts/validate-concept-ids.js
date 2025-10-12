#!/usr/bin/env node
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "src/content/guides");

function walk(dir) {
  const files = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.isFile() && e.name.endsWith(".md")) files.push(full);
  }
  return files;
}

const files = walk(DIR);
const ids = new Map();
let errors = 0;

for (const f of files) {
  const fm = matter.read(f);
  const id = fm.data.id;
  if (!id) {
    console.error(`❌ Missing id in ${path.relative(ROOT, f)}`);
    errors++;
    continue;
  }
  if (ids.has(id)) {
    console.error(
      `❌ Duplicate id '${id}' in ${path.relative(ROOT, f)} (also in ${path.relative(
        ROOT,
        ids.get(id),
      )})`,
    );
    errors++;
  } else {
    ids.set(id, f);
  }
}

// Relationship validation
function checkList(arr, from) {
  for (const id of arr || []) {
    if (!ids.has(id)) {
      console.error(
        `❌ Unknown reference '${id}' in ${path.relative(ROOT, from)}`,
      );
      errors++;
    }
  }
}

for (const f of files) {
  const fm = matter.read(f);
  checkList(fm.data.dependsOn, f);
  checkList(fm.data.leadsTo, f);
}

if (errors) {
  console.error(`\n❌ Validation failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log("✅ Concept IDs and relationships look good!");
}
