import { test, expect } from "@playwright/test";
import { setTheme, expectFixtureScreenshot } from "./utils";

test.describe("Map visual", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`Map - default view (${theme})`, async ({ page }) => {
      await setTheme(page, theme);
      await page.goto("/test-fixtures/Map/");
      await page.waitForFunction(() => !!(window as any).L);
      await page.waitForTimeout(300);
      await expectFixtureScreenshot(page, `map-default-${theme}.png`);
    });

    test(`Map - zoomed view (${theme})`, async ({ page }) => {
      await setTheme(page, theme);
      await page.goto("/test-fixtures/Map/");
      await page.waitForFunction(() => !!(window as any).L);
      await page.waitForTimeout(300);
      // Prefer Leaflet zoom API to minimize randomness
      await page.evaluate(() => {
        const map: any = (window as any).fixtureMap;
        if (map && map.setZoom) map.setZoom(12);
      });
      await page.waitForTimeout(400);
      if (theme === "dark") {
        const container = page.getByTestId("fixture-root");
        await container.waitFor();
        await expect(container).toHaveScreenshot(`map-zoomed-${theme}.png`, {
          animations: "disabled",
          caret: "hide",
          scale: "device",
          maxDiffPixelRatio: 0.12,
        });
      } else {
        await expectFixtureScreenshot(page, `map-zoomed-${theme}.png`);
      }
    });
  }
});
