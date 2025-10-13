import { test, expect } from "@playwright/test";

test.describe("Button visual regression", () => {
  test("default primary button", async ({ page }) => {
    await page.goto("/test-fixtures/Button/");
    // Wait for fixture root to be visible
    const container = page.getByTestId("fixture-root");
    await container.waitFor({ state: "visible" });
    // Disable animations/transitions/caret to avoid flakiness
    await page.addStyleTag({
      content:
        "*{animation:none!important;transition:none!important;caret-color:transparent!important}",
    });
    // give fonts/layout a moment to settle
    await page.waitForTimeout(100);
    const screenshot = await container.screenshot();
    expect(screenshot).toMatchSnapshot(
      `button-${test.info().project.name}.png`,
    );
  });
});
