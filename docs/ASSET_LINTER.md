# Asset Reference Linter

A standalone lint rule to detect asset reference issues that cause 404 errors in production builds.

## What it catches

This linter detects common asset reference problems that work in development but fail in production:

### Errors (will cause 404s)

- **Direct `/src/` paths in `<link>` tags**: `<link rel="stylesheet" href="/src/styles/file.css" />`
- **Direct `/src/` paths in `<script>` tags**: `<script src="/src/scripts/file.js"></script>`

### Warnings (may cause issues)

- **Direct `/src/` paths in `<img>` tags**: `<img src="/src/images/file.png" />`

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

⚠️ **May cause issues**:

```astro
<img src="/src/images/file.png" alt="description" />
```

✅ **Better approach**:

```astro
<!-- Move images to /public/ folder -->
<img src="/images/file.png" alt="description" />

<!-- Or use proper asset imports -->
--- import imageUrl from "../images/file.png"; ---
<img src={imageUrl} alt="description" />
```

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

The linter rules are defined in `scripts/lint-assets.js`. Current rules:

- `no-src-link-tags` - Prevents `/src/` paths in link tags (ERROR)
- `no-src-script-tags` - Prevents `/src/` paths in script tags (ERROR)
- `no-src-img-tags` - Warns about `/src/` paths in img tags (WARNING)

## Why This Matters

In Astro and other modern frameworks:

- **Development**: The dev server can serve files directly from `/src/`
- **Production**: Assets are processed, bundled, and moved to different locations
- **Result**: Direct `/src/` references that work in dev will 404 in production

This linter catches these issues before they reach production, preventing broken websites and frustrated users.
