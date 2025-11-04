# Make Astro script directives explicit

Problem

- `astro check` hints: scripts are treated as `is:inline` due to attributes in `src/components/GoogleAnalytics.astro`, `src/pages/index.astro`, `src/pages/maps.astro`, `src/pages/spots/[...slug].astro`.

Why this matters

- Explicit `is:inline` improves readability and silences hints; some scripts might be better as external modules (`type="module"`) for TS support.

Scope

- Add `is:inline` where intended for CDN `<script>`s and JSON `<script>` tags.
- Where we own code (non-CDN), move complex logic to `.ts` modules imported via `type="module"` script for better TS support.

Steps

- Update the four files to add `is:inline` to JSON and CDN tags.
- Consider moving any inline logic blocks to modules (if present).

Acceptance criteria

- `npm run typecheck` no longer reports `astro(4000)` hints for these files.
