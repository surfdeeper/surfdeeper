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

## Component Refactoring

When splitting components out of existing files:

1. **Move CSS with the component** - Always extract component-specific CSS rules and move them to the new component as scoped styles
2. **Keep styles scoped** - Don't make styles global unless absolutely necessary; maintain Astro's scoped styling
3. **Complete the extraction** - Remove the moved CSS from the original file to avoid duplication
4. **Test after refactoring** - Verify that styles still work correctly after the split

Example: When extracting a sidebar component, move all `.sidebar-*` CSS rules from the page-level CSS file to the new component's `<style>` block.

## When to Ask Human

- Adding new design tokens or abstractions
- When lint rules seem too restrictive for a use case
