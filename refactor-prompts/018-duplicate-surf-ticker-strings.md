# Centralize surf ticker sayings and styles

Problem

- `src/scripts/surf-ticker.ts` contains a long hard-coded `surfSayings` array and inline HTML/styles in strings.

Why this matters

- Hard to maintain, no tests, and strings may be reused elsewhere (e.g., in a future footer banner).

Scope

- Move sayings to `src/config/surf-sayings.ts` and export typed array.
- Extract reusable small DOM helpers and style classes; avoid long inline style attributes.
- Add small unit test for `getRandomSaying()` and marquee logic boundaries.

Acceptance criteria

- Sayings live in config; test covers helper behavior.
- No inline styles in strings; use CSS classes with tokens.
