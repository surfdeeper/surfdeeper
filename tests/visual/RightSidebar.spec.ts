import { test } from "@playwright/test";
import { setTheme, expectFixtureScreenshot } from "./utils";

test.describe("Right Sidebar visual", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`Right Sidebar - default (${theme})`, async ({ page }) => {
      await setTheme(page, theme);
      await page.goto("/test-fixtures/RightSidebar/");
      await expectFixtureScreenshot(page, `right-sidebar-${theme}.png`, {
        selector: "aside.right-sidebar",
      });
    });
  }
});
