# Surf Deeper

A minimal Astro site.

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

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the site for production
- `npm run preview` - Preview the production build locally

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
