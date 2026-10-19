import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
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
