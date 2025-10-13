import { test, expect } from "@playwright/test";

test.describe("Button visual regression", () => {
  test("default primary button", async ({ page }) => {
    await page.goto("/test-fixtures/Button/");
    // give fonts/layout a moment to settle
    await page.waitForTimeout(100);
    const container = page.getByTestId("fixture-root");
    const screenshot = await container.screenshot();
    expect(screenshot).toMatchSnapshot(
      `button-${test.info().project.name}.png`,
    );
  });
});
