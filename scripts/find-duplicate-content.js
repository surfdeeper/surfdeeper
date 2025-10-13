#!/usr/bin/env node
/*
  Duplicate Content Finder
  - Scans Markdown files for near-duplicate content using TF-IDF cosine similarity
  - Defaults to scanning src/content/guides and src/content/spots
  - CLI flags:
      --path <dir>          Path(s) to scan (can be provided multiple times)
      --threshold <number>  Cosine similarity threshold (0-1), default: 0.78
      --top <n>             Limit the number of pairs displayed (default: 50)
      --json                Output results as JSON only
      --fail                Exit with code 1 if any pair >= threshold
      --minTokens <n>       Minimum tokens per doc to include (default: 80)
  - Example:
      node scripts/find-duplicate-content.js --threshold 0.8 --fail
*/

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

const DEFAULT_PATHS = ["src/content/guides", "src/content/spots"];
const DEFAULT_THRESHOLD = 0.78;
const DEFAULT_TOP = 50;
const DEFAULT_MIN_TOKENS = 80;

function parseArgs(argv) {
  const args = {
    paths: [],
    threshold: DEFAULT_THRESHOLD,
    top: DEFAULT_TOP,
    json: false,
    fail: false,
    minTokens: DEFAULT_MIN_TOKENS,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--path" && argv[i + 1]) {
      args.paths.push(argv[++i]);
    } else if (a === "--threshold" && argv[i + 1]) {
      args.threshold = Number(argv[++i]);
    } else if (a === "--top" && argv[i + 1]) {
      args.top = Number(argv[++i]);
    } else if (a === "--json") {
      args.json = true;
    } else if (a === "--fail") {
      args.fail = true;
    } else if (a === "--minTokens" && argv[i + 1]) {
      args.minTokens = Number(argv[++i]);
    }
  }
  if (args.paths.length === 0) args.paths = DEFAULT_PATHS;
  return args;
}

async function isDirectory(p) {
  try {
    const st = await fs.stat(p);
    return st.isDirectory();
  } catch {
    return false;
  }
}

async function listMarkdownFiles(dir) {
  const out = [];
  async function walk(d) {
    let entries;
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const fp = path.join(d, e.name);
      if (e.isDirectory()) {
        await walk(fp);
      } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
        out.push(fp);
      }
    }
  }
  await walk(dir);
  return out;
}

// A compact English stopword list (can extend as needed)
const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "if",
  "in",
  "into",
  "is",
  "it",
  "no",
  "not",
  "of",
  "on",
  "or",
  "such",
  "that",
  "the",
  "their",
  "then",
  "there",
  "these",
  "they",
  "this",
  "to",
  "was",
  "will",
  "with",
  "you",
  "your",
  "i",
  "we",
  "our",
  "from",
  "up",
  "down",
  "over",
  "under",
  "so",
  "can",
  "could",
  "should",
  "would",
  "about",
  "than",
  "when",
  "what",
  "which",
  "who",
  "whom",
  "how",
  "why",
  "where",
  "also",
  "more",
  "most",
  "other",
  "some",
  "any",
  "each",
  "few",
  "both",
  "many",
  "much",
  "very",
  "just",
  "one",
  "two",
  "three",
  "may",
  "might",
  "like",
  "often",
  "always",
  "sometimes",
]);

function stripMarkdown(md) {
  // Remove code blocks
  let text = md.replace(/```[\s\S]*?```/g, " ");
  // Remove inline code
  text = text.replace(/`[^`]*`/g, " ");
  // Replace images and links with their alt/text
  text = text.replace(/!\[[^\]]*\]\([^\)]*\)/g, " ");
  text = text.replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1");
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  // Remove headings/emphasis/list markers
  text = text.replace(/[>#*_~\-]+/g, " ");
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z]+/g)
    .filter((t) => t && !STOPWORDS.has(t));
}

function buildTfIdf(docs) {
  // docs: Array<{ id, tokens: string[] }>
  const N = docs.length;
  const df = new Map(); // term -> doc freq
  const tfs = []; // per-doc term frequency maps

  for (const d of docs) {
    const tf = new Map();
    for (const tok of d.tokens) tf.set(tok, (tf.get(tok) || 0) + 1);
    tfs.push(tf);
    for (const tok of new Set(d.tokens)) df.set(tok, (df.get(tok) || 0) + 1);
  }

  const idf = new Map();
  for (const [tok, f] of df.entries()) {
    idf.set(tok, Math.log((N + 1) / (f + 1)) + 1); // smoothed idf
  }

  // Build tf-idf vectors as sparse maps and their norms
  const vectors = [];
  const norms = [];
  for (let i = 0; i < docs.length; i++) {
    const tf = tfs[i];
    const vec = new Map();
    let sumSq = 0;
    const maxTf = Math.max(...tf.values());
    for (const [tok, f] of tf.entries()) {
      const tfNorm = 0.5 + 0.5 * (f / maxTf); // augmented tf
      const w = tfNorm * (idf.get(tok) || 0);
      if (w > 0) {
        vec.set(tok, w);
        sumSq += w * w;
      }
    }
    vectors.push(vec);
    norms.push(Math.sqrt(sumSq) || 1);
  }
  return { vectors, norms, idf };
}

function cosineSim(vecA, normA, vecB, normB) {
  let dot = 0;
  // iterate the smaller vector for efficiency
  const [small, large] = vecA.size < vecB.size ? [vecA, vecB] : [vecB, vecA];
  for (const [tok, w] of small.entries()) {
    const w2 = large.get(tok);
    if (w2) dot += w * w2;
  }
  return dot / (normA * normB);
}

function topOverlapTerms(vecA, vecB, limit = 8) {
  const common = [];
  for (const [tok, w] of vecA.entries()) {
    const w2 = vecB.get(tok);
    if (w2) common.push([tok, w + w2]);
  }
  common.sort((a, b) => b[1] - a[1]);
  return common.slice(0, limit).map(([t]) => t);
}

async function loadDocs(pathsToScan, minTokens) {
  const files = new Set();
  for (const p of pathsToScan) {
    if (await isDirectory(p)) {
      (await listMarkdownFiles(p)).forEach((f) => files.add(f));
    }
  }
  const docs = [];
  for (const f of [...files].sort()) {
    let raw;
    try {
      raw = await fs.readFile(f, "utf8");
    } catch {
      continue;
    }
    const { content, data } = matter(raw);
    const body = stripMarkdown(content);
    // Include title (frontmatter or filename) to help similarity on short docs
    const title = (data && (data.title || data.id)) || path.basename(f, ".md");
    const tokens = tokenize(`${title} ${body}`);
    if (tokens.length >= minTokens) {
      docs.push({ id: f, tokens, meta: { title } });
    }
  }
  return docs;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const docs = await loadDocs(args.paths, args.minTokens);
  if (docs.length < 2) {
    console.error("Not enough documents to compare.");
    process.exit(0);
  }
  const { vectors, norms } = buildTfIdf(docs);
  const results = [];

  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const sim = cosineSim(vectors[i], norms[i], vectors[j], norms[j]);
      if (sim >= args.threshold) {
        const overlap = topOverlapTerms(vectors[i], vectors[j], 8);
        results.push({
          a: path.relative(process.cwd(), docs[i].id),
          b: path.relative(process.cwd(), docs[j].id),
          sim: Number(sim.toFixed(4)),
          overlap,
        });
      }
    }
  }

  results.sort((x, y) => y.sim - x.sim);
  const limited = args.top > 0 ? results.slice(0, args.top) : results;

  if (args.json) {
    console.log(
      JSON.stringify(
        { threshold: args.threshold, count: results.length, results: limited },
        null,
        2,
      ),
    );
  } else {
    if (limited.length === 0) {
      console.log(
        `No duplicate candidates found at threshold ${args.threshold}. (Docs compared: ${docs.length})`,
      );
    } else {
      const rows = [];
      rows.push(
        `Found ${results.length} duplicate candidates (showing ${limited.length}) at threshold ${args.threshold}.`,
      );
      rows.push("");
      for (const r of limited) {
        rows.push(`${r.sim.toFixed(4)}  ${r.a}  <>  ${r.b}`);
        if (r.overlap.length) rows.push(`   overlap: ${r.overlap.join(", ")}`);
      }
      console.log(rows.join("\n"));
    }
  }

  if (args.fail && results.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
