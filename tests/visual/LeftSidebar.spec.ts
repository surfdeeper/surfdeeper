import { test } from "@playwright/test";
import { setTheme, expectFixtureScreenshot } from "./utils";

test.describe("Left Sidebar visual", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`Left Sidebar - default (${theme})`, async ({ page }) => {
      await setTheme(page, theme);
      await page.goto("/test-fixtures/LeftSidebar/");
      await expectFixtureScreenshot(page, `left-sidebar-${theme}.png`);
    });
  }
});
