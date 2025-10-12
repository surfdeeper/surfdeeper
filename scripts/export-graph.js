#!/usr/bin/env node
/**
 * Export Knowledge Graph CLI
 * 
 * Walks the content/ directory and outputs a structured JSON graph
 * representing the site's concepts, skills, and paths.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const GUIDES_DIR = path.join(ROOT, "src/content/guides");
const PATHS_DIR = path.join(ROOT, "src/content/paths");
const OUTPUT_FILE = path.join(ROOT, "graph.json");

/**
 * Recursively walk a directory and return all .md files
 */
function walk(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...walk(full));
    } else if (e.isFile() && e.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Parse a guide/concept file and extract relevant metadata
 */
function parseGuide(filePath) {
  const fm = matter.read(filePath);
  const data = fm.data;
  
  // Use id from frontmatter or fallback to slug
  const slug = path.basename(filePath, ".md");
  const id = data.id || slug;
  
  return {
    id,
    title: data.title || slug,
    description: data.description,
    kind: data.kind,
    category: data.category,
    level: data.level,
    levels: data.levels || [],
    paths: data.paths || [],
    dependsOn: data.dependsOn || [],
    leadsTo: data.leadsTo || [],
    appliesTo: data.appliesTo || [],
    aliases: data.aliases || [],
    tags: [], // Not in current schema but included for future use
  };
}

/**
 * Parse a path file and extract relevant metadata
 */
function parsePath(filePath) {
  const fm = matter.read(filePath);
  const data = fm.data;
  
  const slug = path.basename(filePath, ".md");
  const id = data.id || slug;
  
  // Extract guide references from content using [[guide-id]] syntax
  const content = fm.content || "";
  const linkPattern = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const nodes = [];
  let match;
  
  while ((match = linkPattern.exec(content)) !== null) {
    nodes.push(match[1].trim());
  }
  
  return {
    id,
    title: data.title || slug,
    description: data.description,
    icon: data.icon,
    order: data.order,
    nodes, // Guide IDs referenced in the path content
  };
}

/**
 * Validate that all references exist and report issues
 */
function validateReferences(concepts, skills, paths) {
  const allIds = new Set();
  const warnings = [];
  const errors = [];
  
  // Build set of all valid IDs (concepts + skills)
  [...concepts, ...skills].forEach(item => {
    allIds.add(item.id);
    item.aliases?.forEach(alias => allIds.add(alias));
  });
  
  // Validate dependsOn and leadsTo references
  for (const item of [...concepts, ...skills]) {
    for (const depId of item.dependsOn || []) {
      if (!allIds.has(depId)) {
        errors.push(
          `❌ Unknown dependency '${depId}' in ${item.id} (${item.title})`
        );
      }
    }
    
    for (const nextId of item.leadsTo || []) {
      if (!allIds.has(nextId)) {
        errors.push(
          `❌ Unknown leadsTo reference '${nextId}' in ${item.id} (${item.title})`
        );
      }
    }
  }
  
  // Validate path references
  for (const pathItem of paths) {
    for (const nodeId of pathItem.nodes || []) {
      if (!allIds.has(nodeId)) {
        warnings.push(
          `⚠️  Path '${pathItem.id}' references unknown guide '${nodeId}'`
        );
      }
    }
  }
  
  // Check for bidirectional consistency (optional warning)
  for (const item of [...concepts, ...skills]) {
    for (const depId of item.dependsOn || []) {
      if (allIds.has(depId)) {
        // Find the dependency and check if it has leadsTo pointing back
        const dep = [...concepts, ...skills].find(i => i.id === depId);
        if (dep && !dep.leadsTo?.includes(item.id)) {
          warnings.push(
            `⚠️  Unidirectional link: ${item.id} depends on ${depId}, but ${depId} doesn't lead to ${item.id}`
          );
        }
      }
    }
  }
  
  return { warnings, errors };
}

/**
 * Main export function
 */
function exportGraph() {
  console.log("🔍 Scanning content directories...");
  
  const guideFiles = walk(GUIDES_DIR);
  const pathFiles = walk(PATHS_DIR);
  
  console.log(`📁 Found ${guideFiles.length} guide files and ${pathFiles.length} path files`);
  
  // Parse all guides and categorize by kind
  const concepts = [];
  const skills = [];
  const sections = [];
  
  for (const file of guideFiles) {
    const guide = parseGuide(file);
    
    // Categorize based on kind field
    if (guide.kind === "concept") {
      concepts.push(guide);
    } else if (guide.kind === "skill") {
      skills.push(guide);
    } else if (guide.kind === "section") {
      sections.push(guide);
    } else {
      // Default to concept if no kind specified
      concepts.push(guide);
    }
  }
  
  // Parse all paths
  const paths = pathFiles.map(file => parsePath(file));
  
  console.log(`📊 Categorized: ${concepts.length} concepts, ${skills.length} skills, ${sections.length} sections, ${paths.length} paths`);
  
  // Validate references
  console.log("🔍 Validating references...");
  const { warnings, errors } = validateReferences(concepts, skills, paths);
  
  // Report validation results
  if (errors.length > 0) {
    console.error("\n❌ Validation Errors:");
    errors.forEach(err => console.error(err));
  }
  
  if (warnings.length > 0) {
    console.warn("\n⚠️  Validation Warnings:");
    warnings.forEach(warn => console.warn(warn));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log("✅ All references are valid!");
  }
  
  // Build output structure
  const graph = {
    concepts: concepts.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      level: c.level,
      levels: c.levels,
      paths: c.paths,
      dependsOn: c.dependsOn,
      leadsTo: c.leadsTo,
      appliesTo: c.appliesTo,
      aliases: c.aliases,
      tags: c.tags,
    })),
    skills: skills.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      category: s.category,
      level: s.level,
      levels: s.levels,
      paths: s.paths,
      dependsOn: s.dependsOn,
      leadsTo: s.leadsTo,
      appliesTo: s.appliesTo,
      aliases: s.aliases,
      tags: s.tags,
    })),
    paths: paths.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      icon: p.icon,
      order: p.order,
      nodes: p.nodes,
    })),
    sections: sections.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      category: s.category,
      order: s.order,
    })),
    metadata: {
      exportedAt: new Date().toISOString(),
      totalConcepts: concepts.length,
      totalSkills: skills.length,
      totalPaths: paths.length,
      totalSections: sections.length,
      validationErrors: errors.length,
      validationWarnings: warnings.length,
    }
  };
  
  // Write to file
  console.log(`\n💾 Writing graph to ${path.relative(ROOT, OUTPUT_FILE)}...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(graph, null, 2));
  
  console.log(`\n✅ Graph exported successfully!`);
  console.log(`   - ${graph.concepts.length} concepts`);
  console.log(`   - ${graph.skills.length} skills`);
  console.log(`   - ${graph.paths.length} paths`);
  console.log(`   - ${graph.sections.length} sections`);
  
  if (errors.length > 0) {
    console.error(`\n❌ Export completed with ${errors.length} error(s)`);
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn(`\n⚠️  Export completed with ${warnings.length} warning(s)`);
  }
}

// Run the export
exportGraph();
