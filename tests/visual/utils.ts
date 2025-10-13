import { Page, expect } from "@playwright/test";

export async function setTheme(page: Page, theme: "light" | "dark" | "auto") {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
      document.documentElement.setAttribute("data-theme", t);
    } catch {}
  }, theme);
}

export async function expectFixtureScreenshot(
  page: Page,
  name: string,
  options?: { selector?: string }
) {
  await page.waitForLoadState("domcontentloaded");
  let target = options?.selector
    ? page.locator(options.selector)
    : page.getByTestId("fixture-root");
  try {
    await target.waitFor({ state: "attached", timeout: 5000 });
  } catch {
    // fallback to common component roots
    const fallbackSelectors = [
      "footer.footer",
      "aside.right-sidebar",
      "aside.left-sidebar",
      "nav.nav",
      "#fixture-map",
      "[data-testid='fixture-root']",
      "main",
      "body",
    ];
    for (const sel of fallbackSelectors) {
      const loc = page.locator(sel);
      if (await loc.count()) {
        target = loc.first();
        break;
      }
    }
    await target.waitFor({ state: "attached", timeout: 2000 });
  }
  await page.waitForTimeout(150);
  await expect(target).toHaveScreenshot(name, {
    animations: "disabled",
    caret: "hide",
    scale: "device",
  });
}
