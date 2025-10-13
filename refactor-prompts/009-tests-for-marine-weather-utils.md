# Add tests for marine-weather utils

Problem

- `src/utils/marine-weather.ts` has non-trivial logic (bucketing, caching, unit conversions). No tests currently.

Why this matters

- Caching and bucketing are easy to regress. Unit conversions should be verified.

Scope

- Add unit tests for:
  - `degreesToCardinal()` boundary values (e.g., 0, 11.25, 22.5, ... 360)
  - `metersToFeet()` and `kmhToMph()` correctness
  - `fetchMarineConditions()` behavior on cache hit (mock localStorage), cache miss (mock fetch), and error path.

Steps

- Use `vitest` with mocked `globalThis.fetch` and `localStorage`.
- Keep tests fast; don’t call external APIs.

Acceptance criteria

- New test file `tests/marine-weather.test.ts` passes locally and in CI.
