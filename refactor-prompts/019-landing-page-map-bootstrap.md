# Bootstrap homepage map via module

Problem

- `src/pages/index.astro` embeds JSON and likely contains inline script to initialize the homepage map preview.

Why this matters

- Inline logic doesn’t get TS support; duplication with `map-preview.ts` exists.

Scope

- Ensure `index.astro` uses `<script type="module" src={Astro.resolve('../scripts/map-preview.ts')} />` and only supplies `spots-data` via JSON script (or via data-\* attributes), using the shared parser.

Acceptance criteria

- No inline JS on the homepage for map preview initialization.
- Typecheck is clean for index page scripts.
