Always run nvm use / match node version to .nvmrc always run `npm run lint`, fix any errors, format the code, and ensure `npm run build` succeeds locally before finishing.

# AI Agent Instructions for SurfDeeper

## Quick Setup

- **Linter**: `npm run lint:css` (Stylelint with design token enforcement)
- **Config**: `.stylelintrc.cjs` enforces CSS custom properties from `src/styles/design-system.css`
- **Dev**: `npm run dev`
- **Build**: `npm run build` (required to pass; see Dynamic Routes rules below)

## Design System Rules

- Always use `var(--font-size-*)`, `var(--color-*)`, `var(--space-*)` instead of hardcoded values
- **Never add new CSS custom properties without asking the human first**
- Check `src/styles/design-system.css` for available tokens

## Lint-Driven Development

When you notice patterns or repeated issues:

1. Create/enhance lint rules instead of manual grep searches
2. Run `npm run lint:css` to find all violations systematically
3. Fix all violations at once

Example: Instead of `grep -r "font-size: [0-9]" src/`, use the existing lint rule that catches hardcoded font sizes.

## Astro Dynamic Routes (required)

If you create or edit any dynamic route files under `src/pages/**/[param].astro` or `src/pages/**/[...slug].astro`, you MUST export `getStaticPaths()` unless the site is configured for server/hybrid output (we default to static SSG). Missing this will cause `npm run build` to fail with `GetStaticPathsRequired`.

Rules:

- For SSG builds (default), every dynamic route MUST export `getStaticPaths()` returning `{ params }[]`.
- Prefer generating params from content collections via `getCollection()` to keep routes aligned with content.
- Only consider `output: "server" | "hybrid"` in `astro.config.mjs` if there’s a clear need; otherwise stick with SSG and implement `getStaticPaths`.

Checklist when adding a dynamic page:

1. Add the page file, e.g. `src/pages/threads/[id].astro`.
2. Export `getStaticPaths()` that returns the list of `id`s.
3. In the page, read `Astro.params` and render accordingly.
4. Run `npm run build` to verify.

Example (threads):

```ts
// src/pages/threads/[id].astro (top of file)
export async function getStaticPaths() {
  const { getCollection } = await import("astro:content");
  const threads = await getCollection("threads");
  return threads.map((t) => ({ params: { id: t.slug } }));
}
```

This ensures `/threads/<id>` is generated for each entry in `src/content/threads/`.

### Thread existence verification

- Lint includes `scripts/validate-threads.js` which fails if any guide references a thread that has no content page under `src/content/threads/<thread>.md`.
- Before adding a `threads: ["foo"]` tag to guides, create `src/content/threads/foo.md` with frontmatter (`title`, optional `description`, `icon`) and body content. The body renders on the thread page.

## Component Refactoring

⚠️ **CRITICAL: CSS MUST MOVE WITH COMPONENTS** ⚠️

When splitting components out of existing files:

1. **🎯 ALWAYS Move CSS with the component** - Extract ALL component-specific CSS rules and move them to the new component as scoped styles. This is NON-NEGOTIABLE.
2. **Keep styles scoped** - Don't make styles global unless absolutely necessary; maintain Astro's scoped styling
3. **Complete the extraction** - Remove the moved CSS from the original file to avoid duplication
4. **Test after refactoring** - Verify that styles still work correctly after the split

**CSS Extraction Checklist:**

- [ ] Identify all CSS selectors that target the extracted component
- [ ] Move those CSS rules to a `<style>` block in the new component
- [ ] Remove the moved CSS from the original file
- [ ] Test that styling still works

Example: When extracting a sidebar component, move all `.sidebar-*`, `.nested-links`, `.section-*` CSS rules from the page-level CSS file to the new component's `<style>` block.

## When to Ask Human

- Adding new design tokens or abstractions
- When lint rules seem too restrictive for a use case

## Content Architecture (for AI + Editors)

End-state model:

- Flat folder: put all concept guides under `src/content/guides/` (one concept per file).
- Stable IDs: every guide has an immutable `id` in frontmatter; relationships and links use IDs.
- Magic links: link by `:id` in Markdown, e.g., `[Cobra Pose](:cobra-pose)`.
- Relationships by ID: `dependsOn`, `leadsTo`, `threads`, `level`, `appliesTo` in frontmatter.

Behavioral guidelines:

- Add 1–2 strong relationships per concept (`dependsOn`/`leadsTo`).
- Keep `threads` concise and reusable; avoid inventing categories — use tags.
- Prefer precise concepts; split multi-idea docs.

Reference: `docs/KNOWLEDGE_ARCHITECTURE.md`.
