# Migrate Markdown root/public images to astro:assets

Problem

- Lint warns that `src/content/guides/types-of-waves.md` references `/public` images (`/spilling-wave.png`, `/plunging-wave.png`, `/surging-wave.png`).

Why this matters

- Using `astro:assets` enables optimization, automatic formats, and consistent paths.

Scope

- Move the three images to `src/assets/` (already exist), convert the MD file to MDX, and import + use `<Image>`.
- Update `scripts/lint-assets.ts` allowlist if no longer needed.

Steps

- Rename file to `.mdx` and import assets at top; replace `![...](...)` with `<Image src={...} alt="..." width={...} />`.
- Verify build generated optimized images.

Acceptance criteria

- `npm run lint:assets` shows 0 warnings for Markdown images.
- Build produces optimized assets for these images.
