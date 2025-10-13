import { test } from "@playwright/test";
import { setTheme, expectFixtureScreenshot } from "./utils";

test.describe("Footer visual", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`Footer - default state (${theme})`, async ({ page }) => {
      await setTheme(page, theme);
      await page.goto("/test-fixtures/Footer/");
      await expectFixtureScreenshot(page, `footer-${theme}.png`, {
        selector: "footer.footer",
      });
    });
  }
});
