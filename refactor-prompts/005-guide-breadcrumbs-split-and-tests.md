# Split GuidePathBreadcrumbs logic and add tests

Problem

- `src/components/GuidePathBreadcrumbs.astro` includes complex ordering logic in-file (preferred order extraction, reordering by edges), making the Astro component large and harder to test. Some of the logic lives in `guide-path-breadcrumbs.util.ts`, but more logic is still embedded in the component.

Why this matters

- Logic in components is hard to unit test; duplication in graph helpers is likely as features evolve.

Scope

- Move all non-render logic from the component into `guide-path-breadcrumbs.util.ts`:
  - `extractPreferredOrderFromBody(body)`
  - `applyPreferredOrder(sequence, preferred, hasLeadsTo)`
  - A higher-level `buildPathCrumbs(guideId, guidePaths)` that orchestrates fetching and ordering using `knowledge-graph`.
- Keep component thin: props in, call util, render.
- Add unit tests that cover: ordering with and without leadsTo, preferred order list reordering, current node marked.

Steps

- Create tests under `tests/guide-path-breadcrumbs.util.test.ts` or extend existing ones.
- Ensure zero behavior change in UI.

Acceptance criteria

- Component becomes < ~120 lines (render + scoped styles only).
- New/updated tests pass in CI.
