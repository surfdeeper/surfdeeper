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
const types = new Map(); // id -> type (concept|skill|unknown)
let errors = 0;
let warnings = 0;

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
    // Determine type: prefer new `type`, fallback where legacy concept kind exists
    const t =
      fm.data.type || (fm.data.kind === "concept" ? "concept" : undefined);
    if (t && !["concept", "skill"].includes(t)) {
      console.error(
        `❌ Invalid type '${t}' for id '${id}' in ${path.relative(ROOT, f)} (expected 'concept' or 'skill')`,
      );
      errors++;
    }
    types.set(id, t || "unknown");
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
  // Normalize potential snake_case keys from authoring
  const dependsOn = fm.data.depends_on || fm.data.dependsOn;
  const leadsTo = fm.data.leads_to || fm.data.leadsTo;
  const concepts = fm.data.concepts || [];

  checkList(dependsOn, f);
  checkList(leadsTo, f);
  checkList(concepts, f);
}

// Detect cycles among skills using dependsOn/skills-only subgraph
// We'll warn (non-blocking) if a cycle is found.
function detectSkillCycles() {
  // Build adjacency for skills only
  /** @type {Map<string, string[]>} */
  const adj = new Map();
  for (const [id, file] of ids) {
    if (types.get(id) === "skill") {
      const fm = matter.read(file);
      const deps = (fm.data.depends_on || fm.data.dependsOn || []).filter(
        (d) => types.get(d) === "skill",
      );
      adj.set(id, deps);
    }
  }

  const temp = new Set();
  const perm = new Set();
  /** @type {string[]} */
  const stack = [];
  let found = false;

  function visit(n) {
    if (perm.has(n)) return;
    if (temp.has(n)) {
      // cycle detected; stack currently holds path
      const i = stack.indexOf(n);
      const cycle = i >= 0 ? stack.slice(i).concat(n) : [n];
      console.warn(
        `⚠️  Skill dependency cycle detected: ${cycle.join(" -> ")}`,
      );
      warnings++;
      found = true;
      return;
    }
    temp.add(n);
    stack.push(n);
    for (const m of adj.get(n) || []) visit(m);
    stack.pop();
    temp.delete(n);
    perm.add(n);
  }

  for (const id of adj.keys()) visit(id);
  return found;
}

detectSkillCycles();

if (errors) {
  console.error(`\n❌ Validation failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log("✅ Concept/Skill IDs and relationships look good!");
  if (warnings) {
    console.warn(`⚠️  ${warnings} warning(s) found (non-blocking).`);
  }
}
