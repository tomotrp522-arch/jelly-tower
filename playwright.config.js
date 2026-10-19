import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  projects: [
    {
      name: "iphone",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    { name: "android", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  use: {
    baseURL: "http://127.0.0.1:4173/jelly-tower/",
    ...devices["iPhone 13"],
    defaultBrowserType: "chromium",
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: "npm run preview -- --port 4173 --base /jelly-tower/",
    url: "http://127.0.0.1:4173/jelly-tower/",
    reuseExistingServer: !process.env.CI,
  },
});
