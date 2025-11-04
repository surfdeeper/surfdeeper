# Strongly type spot serialization and DOM transfer

Problem

- `getSpotDataFromElement()` and `getSpotsDataFromElement()` in `src/utils/spot-data.ts` return `any`/`any[]` and consumers re-cast or accept `any`.
- Multiple pages embed JSON via `<script type="application/json" id="..." set:html={JSON.stringify(...)} />`.

Why this matters

- `any` hides integration issues; invalid shapes won’t be caught. DOM transfer can benefit from a shared schema.

Scope

- Define a `SpotData` TypeScript type and use it as the return type in both functions.
- Add narrow runtime validation (e.g., presence of `latitude/longitude` as numbers) to guard parsing, with typed return `SpotData | null` and `SpotData[]`.
- Centralize JSON embedding helper: create `src/utils/json-script.ts` with utilities:
  - `toJsonScript(id: string, data: unknown)` -> safe string
  - `parseJsonScript<T>(id: string): T | null`
- Replace `set:html={JSON.stringify(...)}` usages with the new helper in:
  - `src/pages/spots/[...slug].astro`
  - `src/pages/maps.astro`
  - `src/pages/index.astro`

Steps

- Update `spot-data.ts` to export `type SpotData` and typed parsers.
- Add simple Zod runtime check (optional) or manual narrow check if avoiding deps.
- Replace direct JSON parse call sites to use typed function.

Acceptance criteria

- Zero `any` in the spot data utility public API.
- All JSON-in-script patterns use a single helper; three call sites updated.
- Typecheck, lint, and build pass.
