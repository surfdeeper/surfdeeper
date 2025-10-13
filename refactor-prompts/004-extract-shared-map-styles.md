# Extract shared map UI styles

Problem

- Marker-with-label CSS lives inline in `src/pages/maps.astro` and slightly different classes inline in `src/scripts/map-preview.ts` popups. Styling is duplicated and diverging.

Why this matters

- Inline duplication makes maintenance harder; small visual bugs creep in.

Scope

- Create `src/styles/map-ui.css` that contains shared classes for:
  - `.numbered-marker-with-label`, `.marker-with-label`, `.marker-badge`, `.marker-label`, `.marker-pointer` (and homepage variants)
  - Popup content blocks and CTA styles
- Import this stylesheet in `maps.astro` and homepage `index.astro` (or `Layout.astro` if scoping allows), keeping page-specific overrides locally.

Steps

- Move identical rules; parameterize differences via modifier classes (e.g., `--homepage`).
- Keep to design tokens from `design-system.css`.

Acceptance criteria

- No duplicated marker CSS across pages; a single stylesheet defines them.
- `stylelint` passes and tokens are used (no hardcoded colors when a token exists).
