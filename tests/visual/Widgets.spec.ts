import { test } from "@playwright/test";
import { setTheme, expectFixtureScreenshot } from "./utils";

const widgets = [
  { path: "/test-fixtures/widgets/AboutWidget/", name: "about-widget" },
  {
    path: "/test-fixtures/widgets/RecentUpdatesWidget/",
    name: "recent-updates-widget",
  },
  {
    path: "/test-fixtures/widgets/RecentCommitsWidget/",
    name: "recent-commits-widget",
  },
  {
    path: "/test-fixtures/widgets/SurfWisdomWidget/",
    name: "surf-wisdom-widget",
  },
] as const;

for (const { path, name } of widgets) {
  test.describe(`${name} visual`, () => {
    for (const theme of ["light", "dark"] as const) {
      test(`${name} - default (${theme})`, async ({ page }) => {
        await setTheme(page, theme);
        await page.goto(path);
        const selectorMap: Record<string, string> = {
          "about-widget": ".card",
          "recent-updates-widget": ".updates-section",
          "recent-commits-widget": ".updates-section",
          "surf-wisdom-widget": ".surf-wisdom",
        };
        await expectFixtureScreenshot(page, `${name}-${theme}.png`, {
          selector: selectorMap[name] ?? "[data-testid='fixture-root']",
        });
      });
    }
  });
}
