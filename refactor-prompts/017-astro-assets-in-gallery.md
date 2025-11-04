# Use astro:assets in gallery rendering

Problem

- `gallery.astro` builds a list of images from markdown but shows only those present in a hard-coded `assetMap`. This suggests a partial migration.

Why this matters

- The gallery should handle imported images comprehensively, or the content should be converted to MDX with explicit imports.

Scope

- Convert guides with images to MDX and use `<Image>` component so gallery can import from content metadata instead of parsing markdown image syntax.
- Alternatively, extend gallery to detect `/public` images and surface an actionable warning (link to migration guide) per image.

Acceptance criteria

- Gallery either renders all images as optimized assets or clearly lists items to migrate (no silent omission).
