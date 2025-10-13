import { test } from "@playwright/test";
import { setTheme, expectFixtureScreenshot } from "./utils";

test.describe("Header visual", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`Header - default state (${theme})`, async ({ page }) => {
      await setTheme(page, theme);
      await page.goto("/test-fixtures/Header/");
      await expectFixtureScreenshot(page, `header-${theme}.png`);
    });
  }
});
