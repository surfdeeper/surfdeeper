Always run nvm use / match node version to .nvmrc always run `npm run lint`, fix any errors, and format the code.

# AI Agent Instructions for SurfDeeper

## Quick Setup

- **Linter**: `npm run lint:css` (Stylelint with design token enforcement)
- **Config**: `.stylelintrc.cjs` enforces CSS custom properties from `src/styles/design-system.css`
- **Dev**: `npm run dev`

### Images and Optimization

- Use `astro:assets` for images used in components/pages. Import assets from `src/assets` and render with `<Image src={imported} width={...} />`.
- Do NOT use raw `<img>` in `.astro` files for local assets—this bypasses optimization and is now linted as an error.
- Avoid referencing images from `/public` in Markdown using `![...](/file.png)`. Prefer moving images to `src/assets` and MDX + `<Image>`. A linter will surface violations; a small allowlist exists for legacy diagrams.

## Design System Rules

- Always use `var(--font-size-*)`, `var(--color-*)`, `var(--space-*)` instead of hardcoded values
- **Never add new CSS custom properties without asking the human first**
- Check `src/styles/design-system.css` for available tokens

## Lint-Driven Development

When you notice patterns or repeated issues:

1. Create/enhance lint rules instead of manual grep searches
2. Run `npm run lint:css` to find all violations systematically
3. Fix all violations at once

Image-specific rules enforced by `scripts/lint-assets.js`:

- error: raw `<img>` in `.astro` files (use `astro:assets` `<Image>`)
- error: Markdown `![...](/<file>.(png|jpg|webp|gif))` from `/public` (migrate to `src/assets` + MDX)
- warning: direct `/src/` paths in tags

Example: Instead of `grep -r "font-size: [0-9]" src/`, use the existing lint rule that catches hardcoded font sizes.

## Component Refactoring

⚠️ **CRITICAL: CSS MUST MOVE WITH COMPONENTS** ⚠️

When splitting components out of existing files:

1. **🎯 ALWAYS Move CSS with the component** - Extract ALL component-specific CSS rules and move them to the new component as scoped styles. This is NON-NEGOTIABLE.
2. **Keep styles scoped** - Don't make styles global unless absolutely necessary; maintain Astro's scoped styling
3. **Complete the extraction** - Remove the moved CSS from the original file to avoid duplication
4. **Test after refactoring** - Verify that styles still work correctly after the split

**CSS Extraction Checklist:**

- [ ] Identify all CSS selectors that target the extracted component
- [ ] Move those CSS rules to a `<style>` block in the new component
- [ ] Remove the moved CSS from the original file
- [ ] Test that styling still works

Example: When extracting a sidebar component, move all `.sidebar-*`, `.nested-links`, `.section-*` CSS rules from the page-level CSS file to the new component's `<style>` block.

## When to Ask Human

- Adding new design tokens or abstractions
- When lint rules seem too restrictive for a use case
