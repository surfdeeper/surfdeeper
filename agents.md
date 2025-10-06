Always run nvm use / match node version to .nvmrc

# AI Agent Instructions for SurfDeeper

## Quick Setup

- **Linter**: `npm run lint:css` (Stylelint with design token enforcement)
- **Config**: `.stylelintrc.cjs` enforces CSS custom properties from `src/styles/design-system.css`
- **Dev**: `npm run dev`

## Design System Rules

- Always use `var(--font-size-*)`, `var(--color-*)`, `var(--space-*)` instead of hardcoded values
- **Never add new CSS custom properties without asking the human first**
- Check `src/styles/design-system.css` for available tokens

## Lint-Driven Development

When you notice patterns or repeated issues:

1. Create/enhance lint rules instead of manual grep searches
2. Run `npm run lint:css` to find all violations systematically
3. Fix all violations at once

Example: Instead of `grep -r "font-size: [0-9]" src/`, use the existing lint rule that catches hardcoded font sizes.

## When to Ask Human

- Adding new design tokens or abstractions
- When lint rules seem too restrictive for a use case
