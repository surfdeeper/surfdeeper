# Surf Deeper

[![CI](https://github.com/surfdeeper/surfdeeper/actions/workflows/ci.yml/badge.svg)](https://github.com/surfdeeper/surfdeeper/actions/workflows/ci.yml)

A minimal Astro site.

## Learn more

- Contributing: CONTRIBUTING.md
- Knowledge model: docs/KNOWLEDGE_ARCHITECTURE.md
- Design tokens & CSS rules: .stylelintrc.cjs and src/styles/design-system.css
- Magic links: scripts/remark-magic-links.mjs

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:4321](http://localhost:4321) in your browser.

## Knowledge Graph & Magic Links

Content is organized as a simple knowledge graph:

- Each guide in `src/content/guides/*.md` may define a stable `id` in frontmatter. If omitted, the file slug is used as the implicit id.
- Relationships can be expressed in frontmatter using arrays: `dependsOn`, `leadsTo`, `paths`, `appliesTo`, and optional `aliases`.
- Markdown supports "magic links" to other guides using an id: `[Angling](:angling-down-the-line)`.

How it works:

- `astro.config.mjs` registers a remark plugin (`scripts/remark-magic-links.mjs`) that scans all guides, builds an id/alias map, and rewrites `:id` links to `/guide/{slug}` at build time.
- Unresolved magic links are rendered with a `broken-magic-link` class to stand out (see `src/styles/design-system.css`).
- Guide pages (`src/pages/guide/[...slug].astro`) render related links based on `dependsOn` and `leadsTo` if present.

Authoring tips:

- Prefer stable `id` and link by `:id` instead of file paths.
- Add 1–2 strong relationships (dependsOn/leadsTo) per concept.
- Keep sections (`kind: "section"`) as index pages and group child guides with `category: <section-id>`.

Validation:

- Run `npm run lint` to validate links, concepts, assets, CSS tokens, and formatting.
- Run `npm run dev` to preview; production build with `npm run build`.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the site for production
- `npm run preview` - Preview the production build locally
- `npm run test:visual` - Run Playwright visual tests (chromium)

### Visual tests in Docker

Run visual regression tests in a deterministic Docker environment that matches CI:

- Run tests:

  ```bash
  npm run test:visual:docker
  ```

- Update snapshots in the container:

  ```bash
  npm run snapshots:update:docker
  ```

The Docker setup uses:

- The official Playwright image `mcr.microsoft.com/playwright:v1.48.2-jammy` (kept in sync with `@playwright/test`)
- Named volumes for cache and artifacts:
  - `pw-cache` -> `/root/.cache/ms-playwright` (browser/cache)
  - `pw-results` -> `/app/test-results` (artifacts)

Notes:

- The Astro site is built then served via `astro preview` on port 4321 inside the container; tests target `http://localhost:4321`.
- Fonts (Liberation, Noto Color Emoji, Roboto/Mono) are installed in the image for consistent rendering.
- Animations are disabled in tests to reduce flakiness.

## Project Structure

```text
├── src/
│   ├── pages/             # Astro pages (routes)
│   ├── scripts/           # TypeScript modules for client-side code
│   ├── utils/             # Shared utility functions
│   ├── components/        # Astro components
│   └── layouts/           # Page layouts
├── public/                Static assets (served as-is)
│   └── favicon.svg        #
├── astro.config.mjs       # Astro configuration
└── package.json           # Dependencies and scripts
```

## JavaScript/TypeScript Guidelines

### ✅ Use `src/` for bundled code (Recommended)

Place JavaScript/TypeScript in `src/scripts/` or `src/utils/` to get:

- TypeScript support and type checking
- Module bundling and tree shaking
- Code minification and optimization
- Hot module reloading in development

**Example:**

```typescript
// src/scripts/my-feature.ts
export function initFeature() {
  // Your code here
}
```

```astro
<!-- src/pages/index.astro -->
<script>
  import { initFeature } from "../scripts/my-feature";
  initFeature();
</script>
```

### ⚠️ Use `public/` sparingly for static assets

Only use `public/js/` for:

- Third-party libraries that must be loaded via `<script src="">`
- Code that needs to be accessed by external tools
- Legacy code that can't be easily migrated

**Files in `public/` are served as-is without processing, bundling, or TypeScript compilation.**

## Duplicate content check

You can scan Markdown content for near-duplicates (e.g., similar guides like "cutbacks" and "cutback mechanics"):

- Local, human-friendly output:
  - `npm run check:duplicates`

Options (via direct script call):

- `--threshold <0..1>`: higher is stricter (default 0.78)
- `--top <N>`: limit pairs shown (default 50)
- `--path <dir>`: add custom dir(s) to scan (defaults to `src/content/guides` and `src/content/spots`)
- `--fail`: exit 1 when any pair >= threshold
- `--json`: JSON output
