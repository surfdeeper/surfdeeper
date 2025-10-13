# Visual Regression Testing with Playwright

This project uses Playwright for component-level visual regression tests. Screenshots are compared to baselines so unexpected visual changes fail locally and in CI.

## Quick Start

- Install deps and Playwright browsers:
  - npm ci
  - npx playwright install chromium
- Run tests:
  - npm run test:visual
- Update snapshots (approve expected changes):
  - npm run test:visual:update
- View HTML Report after a run:
  - npx playwright show-report

## Where things live

- Tests: `tests/visual/*.spec.ts`
- Baselines: `tests/visual/__screenshots__/<spec-file-basename>/`
- Config: `playwright.config.ts`
- Example fixture page: `src/pages/test-fixtures/*`

## Writing a new visual test for a component

1. Create or reuse a minimal fixture page that renders just your component with stable example props. Place under `src/pages/test-fixtures/YourComponent.astro`.

2. Add a test file `tests/visual/YourComponent.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("YourComponent visual baseline", async ({ page }) => {
  await page.goto("/test-fixtures/YourComponent");
  await page.waitForTimeout(100); // let layout settle
  const image = await page.screenshot();
  expect(image).toMatchSnapshot("your-component.png");
});
```

3. Create the initial baseline locally by running:

- npm run build
- npm run test:visual:update

This will generate `tests/visual/__screenshots__/YourComponent.spec.ts/your-component.png`.

## Local workflow for reviewing diffs

- Run `npm run test:visual`. If a visual difference is detected, Playwright will:
  - mark the test as failed
  - write `actual-*.png` and `diff-*.png` next to the baseline inside `__screenshots__`
  - generate an HTML report (`playwright-report/`) you can open with `npx playwright show-report`
- If the new rendering is correct and intended, approve by running `npm run test:visual:update` to update the baselines.

## CI behavior

- GitHub Actions workflow `.github/workflows/visual-tests.yml` builds the site, installs Playwright browsers, and runs `npx playwright test`.
- Any screenshot mismatch fails the job. The Playwright HTML report is uploaded as an artifact.

## Tips for stable screenshots

- Keep fixture pages minimal: avoid animations and external data.
- Use fixed viewport sizes and deterministic inputs in tests.
- If needed, add `await page.waitForTimeout(100)` to let layout/fonts settle.
- Prefer static content; for dynamic content, consider mocking or freezing time.

## Troubleshooting

- If tests cannot find the server, ensure `npm run preview` serves at `http://localhost:4321` (Astro default).
- If snapshots don’t appear, run with `--update-snapshots` at least once to create baselines.
- If colors/typography differ between environments, ensure fonts are locally available or accept slight rendering differences by updating the baseline.
