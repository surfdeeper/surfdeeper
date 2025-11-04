# Consolidate sections metadata source

Problem

- `src/pages/gallery.astro` imports `src/content/guides/_sections.json` for display labels, while guides now encode `category`/`kind` in frontmatter. There may be drift between JSON and content.

Why this matters

- Two sources of truth lead to inconsistencies.

Scope

- Replace `_sections.json` usage with content-derived metadata (e.g., a collection for sections or path entries). If section display labels are needed, store them in content (e.g., a `sections` collection) rather than JSON.

Steps

- Add a `sections` collection in `src/content/config.ts` (or repurpose `paths`) to hold labels/icons.
- Update `gallery.astro` to resolve section label from content collections only.

Acceptance criteria

- No imports from `_sections.json`.
- Section labels come from content; build unaffected.
