import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const FIXTURE_API_PORT = 3101;

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    // Fixed products instead of the live API, so prices can be asserted exactly.
    {
      command: "node e2e/fixtures/dummyjson-server.mjs",
      url: `http://localhost:${FIXTURE_API_PORT}/products/1`,
      env: { PORT: String(FIXTURE_API_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    // Runs against a production build: that's where caching and hydration behave as shipped.
    // The build prerenders from the fixture API too, so rebuild before serving real data.
    {
      command: `npm run build && npm run start -- --port ${PORT}`,
      url: `http://localhost:${PORT}/cart`,
      env: { DUMMYJSON_API_URL: `http://localhost:${FIXTURE_API_PORT}` },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
