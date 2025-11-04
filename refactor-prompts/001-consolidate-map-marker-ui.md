# Consolidate map marker UI and duplication

Problem

- The marker popup HTML, drag-to-edit flow, and contribution modal are duplicated between `src/scripts/spot-guides.ts` and `src/scripts/spot-guides-helpers.ts`, and a third variation exists in `src/pages/maps.astro`. There’s also similar marker-with-label HTML/CSS split across `maps.astro` and `map-preview.ts`.
- Use of `any` is pervasive for Leaflet types.

Why this matters

- Duplication increases maintenance cost and divergence in behavior/style. Types help prevent runtime bugs.

Scope

- Create a small, reusable client-side module under `src/scripts/` (e.g. `marker-ui.ts`) that exports:
  - `createNumberedLabelIcon(label: string)` that returns `L.divIcon` HTML for both homepage and maps usage (accepts variants via props)
  - `createSpotPopup(spot, marker, isDragging)` that returns consistent HTML
  - `attachEditFlow(marker, spot, { onDone(lat,lng) })` that wires drag/edit/done and contribution modal
- Replace in:
  - `src/pages/maps.astro` inline marker creation
  - `src/scripts/map-preview.ts`
  - `src/scripts/spot-guides.ts`
  - `src/scripts/spot-guides-helpers.ts` (delete if fully merged)

Steps

- Introduce minimal Leaflet ambient types or a tiny `LeafletMarker` interface to remove `any`.
- Move shared HTML strings to template helpers and centralize CSS classes; keep styles in page/component-scoped CSS but share class names.
- Ensure no functional regressions (drag to edit still works).

Acceptance criteria

- No duplicated popup/marker HTML across the three call sites.
- `any` removed where practical in the new module; local aliases for Leaflet types or narrowed interfaces are used.
- Build and all linters pass.
