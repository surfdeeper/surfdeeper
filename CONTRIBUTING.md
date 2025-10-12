# Contributing to SurfDeeper

Thanks for your interest in contributing! This guide helps you add or improve content and code confidently.

## Philosophy (one-liner)

SurfDeeper is a knowledge web, not a textbook — for details see docs/KNOWLEDGE_ARCHITECTURE.md.

## Quick start

1. Fork the repo and clone your fork
2. Install dependencies and run the dev server
3. Add or edit Markdown files in `src/content/guides/` (flat folder) or `src/content/spots/`
4. Commit, push, and open a Pull Request

## Authoring guides (end-state)

- Location: `src/content/guides/` (flat folder; one concept per file)
- Required frontmatter: `id`, `title`
- Recommended frontmatter: `description`, `level`, `threads[]`, `dependsOn[]`, `leadsTo[]`, `appliesTo[]`

Relationships and links use concept IDs (not paths):

- Relationships: `dependsOn: [cobra-pose]`, `leadsTo: [trimming-and-speed]`
- Magic links in Markdown: `[Cobra Pose](:cobra-pose)`

Tips:

- Prefer 1–2 strong `dependsOn`/`leadsTo` edges
- Keep `threads` concise and reusable

## Spots content

Spots live under `src/content/spots/` with structured frontmatter (see `src/content/config.ts`).

## Linting and formatting

- Use Node version from `.nvmrc`
- Before committing, run full lint:
  - `npm run lint` (links, markdown, assets, CSS, Prettier check)
  - Fix issues and re-run until green
- Format code:
  - `npm run format`

## Links and assets

- Internal links use absolute routes (e.g., `/guide/core-skills/cobra-pose`)
- Do not reference `/src/` assets directly in HTML; let Astro bundle via imports
- See `docs/ASSET_LINTER.md` and `LINK_GUIDELINES.md`

## PR guidelines

- Keep PRs small and focused
- If you introduce new tags (`threads`, `appliesTo`), keep them concise; we’ll normalize vocab during review
- If you must change a route, update inbound references and relationship lists

## Reference

- Knowledge model: `docs/KNOWLEDGE_ARCHITECTURE.md`
- Content schema: `src/content/config.ts`
- Contribution page (site): `src/pages/contribute.astro`
