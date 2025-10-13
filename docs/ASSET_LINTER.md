# Asset Reference Linter

A standalone lint rule to detect asset reference issues that cause 404 errors in production builds.

## What it catches

This linter detects common asset reference problems that work in development but fail in production:

### Errors (will cause 404s or disable optimization)

- Direct `/src/` paths in `<link>` tags: `<link rel="stylesheet" href="/src/styles/file.css" />`
- Direct `/src/` paths in `<script>` tags: `<script src="/src/scripts/file.js"></script>`
- Raw `<img>` tags in `.astro` files (use `astro:assets` `<Image>` instead)
- Markdown images referencing root/public images (e.g. `![]( /file.png )`) — prefer MDX + `<Image>`

### Warnings (transition period / legacy)

- Direct `/src/` paths in `<img>` tags
- A small allowlist of legacy Markdown images from `/public` will be flagged as warnings, not errors, until migrated to MDX + `<Image>`

## How to fix

### CSS Files

❌ **Wrong** (causes 404 in production):

```astro
<head>
  <link rel="stylesheet" href="/src/styles/design-system.css" />
</head>
```

✅ **Correct** (works in production):

```astro
---
import "../styles/design-system.css";
---

<head>
  <!-- CSS is automatically injected -->
</head>
```

### JavaScript Files

❌ **Wrong** (causes 404 in production):

```astro
<head>
  <script src="/src/scripts/file.js"></script>
</head>
```

✅ **Correct** (works in production):

```astro
---
// Import in frontmatter for bundling
import "../scripts/file.js";
---

<!-- Or use client-side imports -->
<script>
  import("../scripts/file.js");
</script>
```

### Image Files

❌ Wrong in `.astro` (raw `<img>`):

```astro
<img src={someUrl} alt="..." />
```

✅ Correct in `.astro` (optimized):

```astro
---
import { Image } from "astro:assets";
import diagram from "../assets/diagram.png";
---

<Image src={diagram} alt="..." width={800} />
```

❌ Wrong in Markdown (root/public):

```md
![Alt](/diagram.png)
```

✅ Preferred: convert to MDX and use `<Image>`

```mdx
---
import { Image } from "astro:assets"; import diagram from "../../assets/diagram.png";
---

<Image src={diagram} alt="Alt" width={800} />
```

Note: A temporary allowlist exists for a few legacy diagrams to avoid blocking; they still show warnings.

## Usage

### Command Line

```bash
# Run asset linter
npm run lint:assets

# Run all linters (includes asset linter)
npm run lint
```

### Integration

The asset linter is automatically included in:

- `npm run lint` - Full lint suite
- Pre-commit hooks (if configured)
- CI/CD pipelines

## Exit Codes

- `0` - No errors found
- `1` - Errors found (will fail CI/CD builds)

## Configuration

The linter rules are defined in `scripts/lint-assets.js`. Current rules include:

- `no-src-link-tags` (ERROR): No `/src/` href in `<link>`
- `no-src-script-tags` (ERROR): No `/src/` src in `<script>`
- `no-raw-img-tags-in-astro` (ERROR): Use `astro:assets` `<Image>`
- `no-root-public-images-in-markdown` (ERROR with allowlist→WARNING): Prefer MDX + `<Image>` over `/public` paths

## Why This Matters

In Astro and other modern frameworks:

- **Development**: The dev server can serve files directly from `/src/`
- **Production**: Assets are processed, bundled, and moved to different locations
- **Result**: Direct `/src/` references that work in dev will 404 in production

This linter catches these issues before they reach production, preventing broken websites and frustrated users.
