# Audit and split large files

Problem

- Several Astro pages are quite large with interleaved logic and styles, e.g., `src/pages/spots/[...slug].astro` and `src/pages/guide/[...slug].astro`.

Why this matters

- Large files slow down comprehension and increase chance of style/logic coupling.

Scope

- Spots page: split conditions panel, right sidebar cards, and map section into smaller Astro components under `src/components/spots/` while moving corresponding CSS with them (per repo rule).
- Guide slug page: extract graph links and section list into components, keep CSS with components.

Acceptance criteria

- Each extracted component has scoped CSS and no duplication.
- Build results unchanged; components imported back into the page.
