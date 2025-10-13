# Replace deprecated getEntryBySlug usage

Problem

- `getEntryBySlug` is flagged deprecated by `astro check` in:
  - `src/pages/guide/[...slug].astro`
  - `src/pages/spots/[...slug].astro`

Why this matters

- Prevent future breakage; follow Astro content best practices.

Scope

- Replace with `getEntry()` or `getEntry()` + `getCollection()` and find by slug, per Astro v4 docs.
- For `guide/[...slug].astro`, also remove the "slug/index" fallback once all content is flattened; or keep a small helper that normalizes both patterns via content API.

Steps

- Update imports and usage, preserving behavior.
- Add a tiny util `findGuideEntryBySlug(slug)` in `src/utils/content-helpers.ts` if shared.

Acceptance criteria

- No deprecation warnings from `astro check` regarding content entry lookup.
- Build still renders the same paths.
