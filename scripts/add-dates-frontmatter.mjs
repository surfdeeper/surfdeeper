#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");
const guidesDir = path.join(root, "src", "content", "guides");
const spotsDir = path.join(root, "src", "content", "spots");

const now = new Date().toISOString();

function updateFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  // Require existing frontmatter block
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return false;
  const fm = match[1];

  const hasCreated = /\ncreated:\s*/.test("\n" + fm);
  const hasUpdated = /\nlastUpdated:\s*/.test("\n" + fm);

  if (hasCreated && hasUpdated) return false; // nothing to change

  // Insert created/lastUpdated after description if present, else after title
  const lines = fm.split(/\r?\n/);
  let insertIdx = 0;
  const titleIdx = lines.findIndex((l) => /^title:\s*/.test(l));
  const descIdx = lines.findIndex((l) => /^description:\s*/.test(l));
  if (descIdx !== -1) {
    const usesBlock = /:\s*[>|]/.test(lines[descIdx]);
    if (usesBlock) {
      let i = descIdx + 1;
      while (i < lines.length) {
        const line = lines[i];
        // a top-level key: starts at col 0 and contains 'key:'
        if (/^[A-Za-z0-9_-]+:\s*/.test(line)) break;
        i++;
      }
      insertIdx = i;
    } else {
      insertIdx = descIdx + 1;
    }
  } else if (titleIdx !== -1) insertIdx = titleIdx + 1;

  const toInsert = [];
  if (!hasCreated) toInsert.push(`created: ${now}`);
  if (!hasUpdated) toInsert.push(`lastUpdated: ${now}`);

  const newFm = [
    ...lines.slice(0, insertIdx),
    ...toInsert,
    ...lines.slice(insertIdx),
  ].join("\n");

  const updated = raw.replace(/^---\n([\s\S]*?)\n---/, `---\n${newFm}\n---`);
  fs.writeFileSync(filePath, updated);
  return true;
}

function walkAndUpdate(dir) {
  if (!fs.existsSync(dir)) return 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let changed = 0;
  for (const e of entries) {
    if (e.isDirectory()) {
      changed += walkAndUpdate(path.join(dir, e.name));
    } else if (e.isFile() && e.name.endsWith(".md")) {
      if (updateFrontmatter(path.join(dir, e.name))) changed += 1;
    }
  }
  return changed;
}

const total = walkAndUpdate(guidesDir) + walkAndUpdate(spotsDir);
console.log(`Updated ${total} files with created/lastUpdated = ${now}`);
