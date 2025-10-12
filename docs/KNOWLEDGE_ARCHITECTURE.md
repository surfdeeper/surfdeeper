# Knowledge Architecture (Graph-based)

SurfDeeper is built as a knowledge web, not a textbook. Surfing isn’t learned in a straight line — it’s a cyclical, interconnected discipline where each concept (like paddling, positioning, or getting out back) deepens and reappears across levels and styles.

To reflect that, we use a graph-based model rather than a rigid hierarchy. Each concept is a node with relationships like depends on, leads to, and applies to. Pedagogical “levels” and thematic “paths” act as lenses — allowing us to dynamically project the same body of knowledge as:

- a linear course for beginners,
- a cross-sectional grid by skill and topic, or
- an open exploration map for deeper learning.

This approach keeps the structure coherent for learners while preserving the richness and cyclic nature of real surf progression. The goal isn’t to overcomplicate — it’s to match the medium and the subject: a flowing, interconnected web of ideas, just like the ocean itself.

In short: a tree teaches, a grid organizes, but a graph understands.

> Status: Documentation-first. We are preparing to adopt this model. Content authors can start adding relationship metadata today (see below) while existing folder-based routing continues to work.

## What changes (and what does not)

- URLs and folders: The current URL and folder structure remains for now. No breaking changes to routes.
- New metadata: We will enrich Markdown frontmatter with relationship metadata to form a content graph.
- Rendering: New views (maps, learning paths, cross-sections) will consume the graph to generate dynamic navigation over time.

## Core concepts

- Node: A single guide (Markdown file) representing one concept or skill.
- Edge (Relationship): Directed or tagged connections between nodes:
  - dependsOn: prerequisites that should be understood first
  - leadsTo: suggested next concepts or natural progressions
  - appliesTo: tags indicating where a concept is used (e.g., paddling, duck dive, longboard)
- Lenses: Orthogonal views for learning and browsing (levels, paths, topics).

# Knowledge Architecture (Graph-based, End State)

SurfDeeper is a knowledge web, not a textbook. Surfing isn’t linear — concepts deepen and recur across levels and styles. Our content model is a graph: each concept is a node; relationships are edges; levels and paths are lenses.

In short: a tree teaches, a grid organizes, but a graph understands.

## End-state design

### 1) Flat content layout

- All concept files live in a single flat folder, e.g. `src/content/guides/` (no subfolders that imply hierarchy).
- Each file represents exactly one concept.
- File name is not the canonical identifier (rename without breaking links).

### 2) Stable concept IDs

- Each file defines an immutable `id` in frontmatter (kebab-case by convention):

```yaml
---
id: pop-up
title: Pop-up Mechanics
description: Efficient chest lift and foot placement for faster takeoffs.
---
```

- IDs are used everywhere for relationships and magic links.
- Title/slug/filename may evolve without breaking references.

### 3) Magic Links (pathless linking)

Authors link concepts by ID, not by path. A simple, unambiguous syntax is resolved at build time:

```markdown
[Pop-up Mechanics](:pop-up)
```

Rules:

- `:id` refers to a concept file with `id: id`.
- Optionally support aliases: `[Pop](:pop-up|:popup)` resolves to the first valid.
- Broken IDs fail the build with actionable errors and suggestions.

Author ergonomics:

- You don’t need to know or care where a file lives, only the concept ID.
- Renaming or reorganizing files never breaks links.

### 4) Relationships as edges (by ID)

Relationships are declared in frontmatter using IDs:

```yaml
---
id: cobra-pose
title: Cobra Pose
level: beginner
paths: [mobility, pop-up]
dependsOn: [warm-up-and-mobility]
leadsTo: [pop-up, trimming-and-speed]
appliesTo: [longboard, shortboard]
---
```

Notes:

- `dependsOn`, `leadsTo` accept arrays of concept IDs.
- `level` is a primary pedagogical lens (beginner|intermediate|advanced).
- `paths` group related ideas across the graph (e.g., positioning, paddling, mobility).
- `appliesTo` are context tags (e.g., longboard, shortboard).

### 5) Derived URLs and navigation

- Routes are generated from IDs (and optionally sections/lenses), e.g. `/guide/:id`.
- The same node can appear in multiple views: linear course, thread grid, or a graph map.
- Redirects are handled automatically if we change how URLs are shaped.

### 6) Aliases (optional conveniences)

Provide non-canonical alternative IDs for authoring and search:

```yaml
aliases: [popup, pop]
```

Magic links resolve aliases to the canonical node. Warnings are emitted if multiple nodes claim the same alias.

## Authoring contract

Minimal frontmatter for a concept:

```yaml
---
id: unique-concept-id
title: Human-readable Title
description: Short summary for listings.
level: beginner # or intermediate | advanced
paths: [paddling, positioning]
dependsOn: [some-prereq]
leadsTo: [some-next-step]
appliesTo: [shortboard]
---
```

Guidelines:

- One concept per file.
- Prefer 1–2 strong `dependsOn`/`leadsTo` edges over many weak ones.
- Keep `paths` concise and reusable.
- Use `id` everywhere for relationships and magic links.

## Tooling expectations

- Magic link resolver validates `:id` references and fails builds on unknown IDs.
- Lint rule checks that `dependsOn`/`leadsTo` contain valid IDs.
- Link checker operates at the concept-graph level (IDs), not paths.
- Optional formatter suggests canonical IDs (kebab-case, ascii) and warns on duplicates.

## Example

File: `src/content/guides/pop-up.md`

```yaml
---
id: pop-up
title: Pop-up Mechanics
level: beginner
paths: [pop-up, takeoff]
dependsOn: [cobra-pose]
leadsTo: [trimming-and-speed]
---
```

Content excerpt:

```markdown
Master your chest lift with [Cobra Pose](:cobra-pose) before attempting faster [Pop-ups](:pop-up). Next, channel that speed into [Trimming and Speed](:trimming-and-speed).
```

This keeps links stable even if files are renamed or reorganized.
