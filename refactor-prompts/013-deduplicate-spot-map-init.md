# Deduplicate spot map initialization

Problem

- Both `src/pages/maps.astro` and `src/scripts/spot-guides.ts` perform very similar map init and view toggle wiring, with small differences.

Why this matters

- Divergence makes fixes appear in one place but not the other.

Scope

- Create `src/scripts/init-map-and-directory.ts` providing:
  - `initMapWithSpots(spots, opts)` that accepts theme defaults and returns a map instance
  - `initViewToggle()` reusable function
- Use this in `maps.astro` and any other pages needing similar behavior.

Acceptance criteria

- Common logic exists in one module and is used in both places.
- Behavior remains identical.
