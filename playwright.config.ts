import { defineConfig } from "@playwright/test";

// Visual regression snapshots stored under tests/visual/__screenshots__/<test-file-basename>/
export default defineConfig({
  testDir: "./tests/visual",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["list"], ["html", { open: "never" }]],
  // Store baselines under tests/visual/__screenshots__/<spec-file-name>/
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFileName}/{arg}{ext}",
  // Tighten snapshot expectations a bit. Adjust if necessary.
  expect: {
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: "http://localhost:4321",
    trace: "retain-on-failure",
    /* Deterministic rendering for consistent screenshots */
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "UTC",
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {},
      launchOptions: {
        args: [
          "--disable-font-subpixel-positioning",
          "--force-color-profile=srgb",
        ],
      },
    },
    // Add more browsers if desired for broader coverage
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  /* Run your local dev server before starting the tests */
  webServer: [
    // Build the site
    {
      command: "npm run build",
      cwd: ".",
      timeout: 10 * 60 * 1000,
      reuseExistingServer: false,
    },
    // Preview the built site for stable output
    {
      command: "npm run preview -- --port=4321 --host=0.0.0.0",
      url: "http://localhost:4321",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
