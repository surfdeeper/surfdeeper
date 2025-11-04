# CSS token compliance sweep

Problem

- Most styles use design tokens, but a few hard-coded colors/sizes are present in map UI and scripts (e.g., hex codes in `map-preview.ts` popup content, `maps.astro` label background/border colors).

Why this matters

- Hard-coded values violate design system rules and make theme changes harder.

Scope

- Replace hex values in inline styles/strings with design tokens where applicable; if missing, propose new tokens (ask human first per rules).
- Prefer moving inline styles into scoped CSS and using variables.

Acceptance criteria

- No hard-coded hex colors in inline HTML strings; use CSS classes and tokens.
- `npm run lint:css` passes without new warnings.
