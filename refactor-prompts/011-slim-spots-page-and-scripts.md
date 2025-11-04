# Slim spots page: move inline logic to modules

Problem

- `src/pages/spots/[...slug].astro` has large inline `<script>` with multiple imports; this should be moved to a dedicated `.ts` module and loaded via `type="module"`.

Why this matters

- Inline scripts lack TS processing, and the page is very long and mixes concerns.

Scope

- Move the inline script block into `src/scripts/spot-page.ts` exporting an `init()` that wires up conditions and map init.
- In the page, replace inline imports with `<script type="module" src={Astro.resolve('../scripts/spot-page.ts')} />` and keep only minimal `init()` bootstrap if needed.
- Keep JSON script for data or switch to `data-*` attributes where cleaner.

Acceptance criteria

- Page size reduced; logic resides in TS module with types.
- `astro check` hints about inline scripts removed for this page.
